import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Event, EventPrize } from '@/types';

// GET - Get active event with prizes
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        const supabase = createAdminClient();

        let query = supabase
            .from('events')
            .select(`
        *,
        prizes:event_prizes(*)
      `)
            .eq('status', 'active');

        if (slug) {
            query = query.eq('slug', slug);
        }

        const { data: events, error } = await query.order('created_at', { ascending: false }).limit(1);

        if (error) {
            console.error('Event fetch error:', error);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi lấy thông tin sự kiện' },
                { status: 500 }
            );
        }

        if (!events || events.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Không có sự kiện nào đang diễn ra' },
                { status: 404 }
            );
        }

        const event = events[0] as Event & { prizes: EventPrize[] };

        // Sort prizes by display_order (handle null/undefined)
        const sortedPrizes = (event.prizes || [])
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        return NextResponse.json({
            success: true,
            data: {
                id: event.id,
                name: event.name,
                slug: event.slug,
                description: event.description,
                start_date: event.start_date,
                end_date: event.end_date,
                theme_config: event.theme_config,
                prizes: sortedPrizes.map(p => ({
                    id: p.id,
                    name: p.name,
                    image_url: p.image_url,
                    type: p.prize_type,
                    color: p.color,
                    text_color: p.text_color || '#ffffff',
                    text_effect: p.text_effect || 'none',
                })),
            },
        });
    } catch (error) {
        console.error('Event API error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}
