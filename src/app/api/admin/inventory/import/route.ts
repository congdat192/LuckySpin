import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface ImportRow {
    branch_code: string;
    prize_name: string;
    remaining_quantity: number;
    initial_quantity: number;
}

// POST - Import inventory from CSV data
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { rows, event_id } = body as { rows: ImportRow[]; event_id: string };

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Dữ liệu import trống hoặc không hợp lệ' },
                { status: 400 }
            );
        }

        if (!event_id) {
            return NextResponse.json(
                { success: false, error: 'Thiếu event_id' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get all branches for lookup
        const { data: branches } = await supabase
            .from('branches')
            .select('id, code');

        // Get all prizes for this event for lookup
        const { data: prizes } = await supabase
            .from('event_prizes')
            .select('id, name')
            .eq('event_id', event_id);

        if (!branches || !prizes) {
            return NextResponse.json(
                { success: false, error: 'Không thể load dữ liệu chi nhánh/quà' },
                { status: 500 }
            );
        }

        // Create lookup maps
        const branchMap = new Map(branches.map(b => [b.code.toLowerCase(), b.id]));
        const prizeMap = new Map(prizes.map(p => [p.name.toLowerCase().trim(), p.id]));

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const row of rows) {
            const branchCode = row.branch_code?.trim().toLowerCase();
            const prizeName = row.prize_name?.trim().toLowerCase();

            const branchId = branchMap.get(branchCode);
            const prizeId = prizeMap.get(prizeName);

            if (!branchId) {
                errors.push(`Chi nhánh "${row.branch_code}" không tồn tại`);
                errorCount++;
                continue;
            }

            if (!prizeId) {
                errors.push(`Quà "${row.prize_name}" không tồn tại trong sự kiện này`);
                errorCount++;
                continue;
            }

            const initialQty = parseInt(String(row.initial_quantity)) || 0;
            const remainingQty = parseInt(String(row.remaining_quantity)) || 0;

            // Upsert logic
            const { data: existing } = await supabase
                .from('branch_prize_inventory')
                .select('id')
                .eq('branch_id', branchId)
                .eq('prize_id', prizeId)
                .single();

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('branch_prize_inventory')
                    .update({
                        initial_quantity: initialQty,
                        remaining_quantity: remainingQty,
                    })
                    .eq('id', existing.id);

                if (error) {
                    errors.push(`Lỗi cập nhật ${row.branch_code} - ${row.prize_name}: ${error.message}`);
                    errorCount++;
                } else {
                    successCount++;
                }
            } else {
                // Insert
                const { error } = await supabase
                    .from('branch_prize_inventory')
                    .insert({
                        branch_id: branchId,
                        prize_id: prizeId,
                        event_id,
                        initial_quantity: initialQty,
                        remaining_quantity: remainingQty,
                    });

                if (error) {
                    errors.push(`Lỗi thêm mới ${row.branch_code} - ${row.prize_name}: ${error.message}`);
                    errorCount++;
                } else {
                    successCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                successCount,
                errorCount,
                errors: errors.slice(0, 10), // Limit error messages
            },
        });
    } catch (error) {
        console.error('Import inventory error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi khi import' },
            { status: 500 }
        );
    }
}
