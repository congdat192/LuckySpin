import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET single event with details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createAdminClient();

        const { data: event, error } = await supabase
            .from('events')
            .select(`
        *,
        event_rules(*),
        event_prizes(*)
      `)
            .eq('id', params.id)
            .single();

        if (error) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy sự kiện' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: event });
    } catch (error) {
        console.error('Event GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}

// PUT - Update event
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { name, slug, description, start_date, end_date, status, prizes, rules } = body;

        const supabase = createAdminClient();

        // Update event basic info
        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (slug !== undefined) updateData.slug = slug;
        if (description !== undefined) updateData.description = description;
        if (start_date !== undefined) updateData.start_date = start_date;
        if (end_date !== undefined) updateData.end_date = end_date;
        if (status !== undefined) updateData.status = status;

        const { data: event, error } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Event update error:', error);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi cập nhật sự kiện' },
                { status: 500 }
            );
        }

        // Update prizes if provided
        if (prizes !== undefined && Array.isArray(prizes)) {
            // Get existing prizes
            const { data: existingPrizes } = await supabase
                .from('event_prizes')
                .select('id')
                .eq('event_id', params.id);

            const existingPrizeIds = new Set((existingPrizes || []).map(p => p.id));
            const incomingPrizeIds = new Set(prizes.filter((p: { id?: string }) => p.id).map((p: { id: string }) => p.id));

            // Find prizes to delete (exist in DB but not in incoming)
            const prizesToDelete = Array.from(existingPrizeIds).filter(id => !incomingPrizeIds.has(id));

            // Delete related data for removed prizes only
            if (prizesToDelete.length > 0) {
                await supabase.from('spin_logs').delete().in('prize_won', prizesToDelete);
                await supabase.from('branch_prize_inventory').delete().in('prize_id', prizesToDelete);
                await supabase.from('event_prizes').delete().in('id', prizesToDelete);
            }

            // Update or insert prizes
            for (let idx = 0; idx < prizes.length; idx++) {
                const p = prizes[idx] as {
                    id?: string;
                    name: string;
                    prize_type: string;
                    value?: string;
                    description?: string;
                    default_weight?: string;
                    color: string;
                };

                const prizeData = {
                    name: p.name,
                    prize_type: p.prize_type,
                    value: p.value ? parseFloat(p.value) : null,
                    description: p.description || null,
                    default_weight: parseInt(p.default_weight || '10') || 10,
                    color: p.color,
                    display_order: idx,
                };

                if (p.id && existingPrizeIds.has(p.id)) {
                    // Update existing prize
                    await supabase.from('event_prizes').update(prizeData).eq('id', p.id);
                } else {
                    // Insert new prize
                    await supabase.from('event_prizes').insert({
                        ...prizeData,
                        event_id: params.id,
                    });
                }
            }
        }

        // Update rules if provided
        if (rules) {
            // Delete existing rules
            await supabase.from('event_rules').delete().eq('event_id', params.id);

            // Create eligibility rule
            if (rules.min_invoice_total) {
                await supabase.from('event_rules').insert({
                    event_id: params.id,
                    rule_type: 'eligibility',
                    priority: 10,
                    is_active: true,
                    conditions: {
                        min_invoice_total: parseInt(rules.min_invoice_total) || 0,
                    },
                });
            }

            // Create turn calculation rule
            const formula = rules.turn_formula_type === 'fixed'
                ? { type: 'fixed', value: parseInt(rules.fixed_turns) || 1 }
                : {
                    type: 'step',
                    steps: (rules.steps || []).map((s: { min: string; max: string; turns: string }) => ({
                        min: parseInt(s.min) || 0,
                        max: s.max ? parseInt(s.max) : null,
                        turns: parseInt(s.turns) || 1,
                    })),
                };

            await supabase.from('event_rules').insert({
                event_id: params.id,
                rule_type: 'turn_calculation',
                priority: 5,
                is_active: true,
                formula,
            });
        }

        return NextResponse.json({ success: true, data: event });
    } catch (error) {
        console.error('Event PUT error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}

// DELETE - Remove event and related data
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createAdminClient();

        // Delete related data first (cascade would be better but doing manual for safety)
        await supabase.from('spin_logs').delete().eq('event_id', params.id);
        await supabase.from('invoice_sessions').delete().eq('event_id', params.id);
        await supabase.from('branch_prize_inventory').delete().match({ prize_id: params.id }); // This needs fixing
        await supabase.from('event_prizes').delete().eq('event_id', params.id);
        await supabase.from('event_rules').delete().eq('event_id', params.id);

        // Delete the event
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Event delete error:', error);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi xóa sự kiện' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Event DELETE error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}
