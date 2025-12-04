import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - Get inventory for an event
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('event_id');

        if (!eventId) {
            return NextResponse.json(
                { success: false, error: 'Missing event_id' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get prizes for this event
        const { data: prizes } = await supabase
            .from('event_prizes')
            .select('id')
            .eq('event_id', eventId);

        if (!prizes || prizes.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        const prizeIds = prizes.map(p => p.id);

        // Get inventory for these prizes
        const { data: inventory, error } = await supabase
            .from('branch_prize_inventory')
            .select('*')
            .in('prize_id', prizeIds);

        if (error) {
            console.error('Inventory fetch error:', error);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi lấy tồn kho' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: inventory || [] });
    } catch (error) {
        console.error('Inventory API error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}

// POST - Save/update inventory
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { items, event_id } = body;

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { success: false, error: 'Invalid data' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get event_id from first prize if not provided
        let eventId = event_id;
        if (!eventId && items.length > 0 && items[0].prize_id) {
            const { data: prize } = await supabase
                .from('event_prizes')
                .select('event_id')
                .eq('id', items[0].prize_id)
                .single();
            eventId = prize?.event_id;
        }

        // Upsert each inventory item
        for (const item of items) {
            const { branch_id, prize_id, initial_quantity, remaining_quantity } = item;

            if (!branch_id || !prize_id) continue;

            // Check if exists
            const { data: existing } = await supabase
                .from('branch_prize_inventory')
                .select('id')
                .eq('branch_id', branch_id)
                .eq('prize_id', prize_id)
                .single();

            if (existing) {
                // Update
                await supabase
                    .from('branch_prize_inventory')
                    .update({
                        initial_quantity: initial_quantity || 0,
                        remaining_quantity: remaining_quantity || 0,
                    })
                    .eq('id', existing.id);
            } else {
                // Insert with event_id
                await supabase
                    .from('branch_prize_inventory')
                    .insert({
                        branch_id,
                        prize_id,
                        event_id: eventId,
                        initial_quantity: initial_quantity || 0,
                        remaining_quantity: remaining_quantity || 0,
                    });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Inventory save error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}
