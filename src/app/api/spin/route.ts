import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { selectPrizeWeighted, getPrizeIndex } from '@/lib/spin-logic';
import { createVoucher, releaseVoucher, generateVoucherCode, calculateExpireDate } from '@/lib/kiotviet-voucher';
import type { InvoiceSession, EventPrize, BranchPrizeInventory } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { session_id, turn_index } = body;

        if (!session_id || turn_index === undefined) {
            return NextResponse.json(
                { success: false, error: 'Thiếu thông tin phiên hoặc lượt quay' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get session
        const { data: session, error: sessionError } = await supabase
            .from('invoice_sessions')
            .select('*')
            .eq('id', session_id)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy phiên quay thưởng' },
                { status: 404 }
            );
        }

        const typedSession = session as InvoiceSession;

        // Check if session is valid
        if (!typedSession.is_valid) {
            return NextResponse.json(
                { success: false, error: 'Hóa đơn không đủ điều kiện tham gia' },
                { status: 400 }
            );
        }

        // Check remaining turns
        const remainingTurns = typedSession.total_turns - typedSession.used_turns;
        if (remainingTurns <= 0) {
            return NextResponse.json(
                { success: false, error: 'Đã hết lượt quay' },
                { status: 400 }
            );
        }

        // Check turn index
        if (turn_index !== typedSession.used_turns + 1) {
            return NextResponse.json(
                { success: false, error: 'Lượt quay không hợp lệ' },
                { status: 400 }
            );
        }

        // Check if this turn already spun
        const { data: existingSpin } = await supabase
            .from('spin_logs')
            .select('id')
            .eq('session_id', session_id)
            .eq('turn_index', turn_index)
            .single();

        if (existingSpin) {
            return NextResponse.json(
                { success: false, error: 'Lượt này đã được quay' },
                { status: 400 }
            );
        }

        // Get prizes for this event first
        const { data: eventPrizes, error: prizesError } = await supabase
            .from('event_prizes')
            .select('id')
            .eq('event_id', typedSession.event_id);

        if (prizesError || !eventPrizes || eventPrizes.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Sự kiện chưa có quà' },
                { status: 500 }
            );
        }

        const prizeIds = eventPrizes.map(p => p.id);

        // Get available inventory for this branch's prizes
        const { data: inventory, error: inventoryError } = await supabase
            .from('branch_prize_inventory')
            .select(`
        *,
        prize:event_prizes(*)
      `)
            .eq('branch_id', typedSession.branch_id)
            .in('prize_id', prizeIds)
            .gt('remaining_quantity', 0);

        if (inventoryError || !inventory || inventory.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Không có quà trong kho chi nhánh này' },
                { status: 500 }
            );
        }

        // Get all prizes for the event (for wheel display order)
        const { data: allPrizes } = await supabase
            .from('event_prizes')
            .select('*')
            .eq('event_id', typedSession.event_id)
            .order('display_order', { ascending: true });

        // Select prize using weighted random
        const typedInventory = inventory as (BranchPrizeInventory & { prize: EventPrize })[];
        const selectedItem = selectPrizeWeighted(typedInventory);

        if (!selectedItem) {
            return NextResponse.json(
                { success: false, error: 'Không thể chọn quà' },
                { status: 500 }
            );
        }

        // Start transaction-like operations
        // 1. Decrement inventory (if not no_prize)
        if (selectedItem.prize.prize_type !== 'no_prize') {
            console.log('Updating inventory:', {
                inventory_id: selectedItem.id,
                prize_id: selectedItem.prize_id,
                current_qty: selectedItem.remaining_quantity,
                new_qty: selectedItem.remaining_quantity - 1,
            });

            const { data: updateData, error: updateError } = await supabase
                .from('branch_prize_inventory')
                .update({
                    remaining_quantity: selectedItem.remaining_quantity - 1
                })
                .eq('id', selectedItem.id)
                .select();

            console.log('Update result:', { updateData, updateError });

            if (updateError) {
                console.error('Inventory update error:', updateError);
                return NextResponse.json(
                    { success: false, error: 'Lỗi cập nhật kho' },
                    { status: 500 }
                );
            }
        }

        // 2. Update session used_turns
        const { error: sessionUpdateError } = await supabase
            .from('invoice_sessions')
            .update({ used_turns: typedSession.used_turns + 1 })
            .eq('id', session_id);

        if (sessionUpdateError) {
            console.error('Session update error:', sessionUpdateError);
            // Try to rollback inventory
            if (selectedItem.prize.prize_type !== 'no_prize') {
                await supabase
                    .from('branch_prize_inventory')
                    .update({ remaining_quantity: selectedItem.remaining_quantity })
                    .eq('id', selectedItem.id);
            }
            return NextResponse.json(
                { success: false, error: 'Lỗi cập nhật phiên' },
                { status: 500 }
            );
        }

        // 3. Create spin log
        const { data: spinLog, error: spinError } = await supabase
            .from('spin_logs')
            .insert({
                session_id: session_id,
                event_id: typedSession.event_id,
                branch_id: typedSession.branch_id,
                turn_index: turn_index,
                prize_won: selectedItem.prize.id,
                customer_phone: typedSession.customer_phone,
                customer_name: typedSession.customer_name,
            })
            .select()
            .single();

        if (spinError) {
            console.error('Spin log error:', spinError);
        }

        // Calculate prize index for animation
        const prizeIndex = getPrizeIndex(
            selectedItem.prize.id,
            (allPrizes || []) as EventPrize[]
        );

        // Handle voucher prizes
        let voucherInfo = null;
        if (selectedItem.prize.prize_type === 'voucher' && spinLog) {
            try {
                // Get the voucher campaign linked to this prize
                const { data: prize } = await supabase
                    .from('event_prizes')
                    .select('voucher_campaign_id')
                    .eq('id', selectedItem.prize.id)
                    .single();

                if (prize?.voucher_campaign_id) {
                    // Get campaign details
                    const { data: campaign } = await supabase
                        .from('voucher_campaigns')
                        .select('*')
                        .eq('id', prize.voucher_campaign_id)
                        .single();

                    if (campaign) {
                        // Generate and create voucher
                        const voucherCode = generateVoucherCode('XMAS');

                        // Create voucher in KiotViet
                        await createVoucher(campaign.kiotviet_campaign_id, voucherCode);

                        // Release voucher
                        const releaseDate = new Date();
                        await releaseVoucher(campaign.kiotviet_campaign_id, voucherCode, releaseDate);

                        // Calculate expire date
                        const expireDate = campaign.expire_days
                            ? calculateExpireDate(campaign.expire_days, releaseDate)
                            : campaign.end_date ? new Date(campaign.end_date) : null;

                        // Save to database
                        const { data: issuedVoucher } = await supabase
                            .from('issued_vouchers')
                            .insert({
                                campaign_id: prize.voucher_campaign_id,
                                spin_log_id: spinLog.id,
                                voucher_code: voucherCode,
                                customer_name: typedSession.customer_name,
                                customer_phone: typedSession.customer_phone,
                                value: campaign.value,
                                release_date: releaseDate.toISOString(),
                                expire_date: expireDate?.toISOString(),
                                status: 'issued',
                            })
                            .select()
                            .single();

                        // Update spin_log with issued_voucher_id for history lookup
                        if (issuedVoucher) {
                            await supabase
                                .from('spin_logs')
                                .update({ issued_voucher_id: issuedVoucher.id })
                                .eq('id', spinLog.id);
                        }

                        voucherInfo = {
                            voucher_id: issuedVoucher?.id,
                            voucher_code: voucherCode,
                            value: campaign.value,
                            expire_date: expireDate?.toISOString(),
                            conditions: campaign.conditions_text,
                        };
                    }
                }
            } catch (voucherError) {
                console.error('Voucher creation error:', voucherError);
                // Continue without voucher info - prize still won
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                prize: {
                    id: selectedItem.prize.id,
                    name: selectedItem.prize.name,
                    image_url: selectedItem.prize.image_url,
                    type: selectedItem.prize.prize_type,
                    value: selectedItem.prize.value,
                    color: selectedItem.prize.color,
                },
                voucher: voucherInfo,
                remaining_turns: remainingTurns - 1,
                spin_id: spinLog?.id,
                prize_index: prizeIndex >= 0 ? prizeIndex : 0,
            },
        });
    } catch (error) {
        console.error('Spin error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi, vui lòng thử lại' },
            { status: 500 }
        );
    }
}
