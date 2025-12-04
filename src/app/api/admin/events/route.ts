import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - List all events
export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data: events, error } = await supabase
            .from('events')
            .select(`
        *,
        spin_logs(count),
        event_prizes(count)
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Events fetch error:', error);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi lấy danh sách sự kiện' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: events,
        });
    } catch (error) {
        console.error('Events API error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}

// POST - Create new event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, slug, description, start_date, end_date, rules, prizes } = body;

        // Validate required fields
        if (!name || !slug || !start_date || !end_date) {
            return NextResponse.json(
                { success: false, error: 'Thiếu thông tin bắt buộc' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Create event
        const { data: event, error: eventError } = await supabase
            .from('events')
            .insert({
                name,
                slug,
                description,
                start_date,
                end_date,
                status: 'draft',
            })
            .select()
            .single();

        if (eventError) {
            console.error('Event creation error:', eventError);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi tạo sự kiện' },
                { status: 500 }
            );
        }

        // Create rules if provided
        if (rules) {
            const rulesToInsert = [];

            // Eligibility rule
            if (rules.min_invoice_total) {
                rulesToInsert.push({
                    event_id: event.id,
                    rule_type: 'eligibility',
                    conditions: {
                        min_invoice_total: parseInt(rules.min_invoice_total),
                    },
                });
            }

            // Turn calculation rule
            if (rules.turn_formula_type === 'fixed') {
                rulesToInsert.push({
                    event_id: event.id,
                    rule_type: 'turn_calculation',
                    formula: {
                        type: 'fixed',
                        value: parseInt(rules.fixed_turns) || 1,
                    },
                });
            } else if (rules.turn_formula_type === 'step' && rules.steps) {
                rulesToInsert.push({
                    event_id: event.id,
                    rule_type: 'turn_calculation',
                    formula: {
                        type: 'step',
                        steps: rules.steps.map((s: { min: string; max: string; turns: string }) => ({
                            min: parseInt(s.min) || 0,
                            max: s.max ? parseInt(s.max) : null,
                            turns: parseInt(s.turns) || 1,
                        })),
                    },
                });
            }

            if (rulesToInsert.length > 0) {
                await supabase.from('event_rules').insert(rulesToInsert);
            }
        }

        // Create prizes if provided
        if (prizes && prizes.length > 0) {
            const prizesToInsert = prizes.map((p: {
                name: string;
                prize_type: string;
                value: string;
                description: string;
                default_weight: string;
                color: string;
            }, idx: number) => ({
                event_id: event.id,
                name: p.name,
                prize_type: p.prize_type,
                value: p.value ? parseFloat(p.value) : null,
                description: p.description || null,
                default_weight: parseInt(p.default_weight) || 10,
                color: p.color,
                display_order: idx,
            }));

            await supabase.from('event_prizes').insert(prizesToInsert);
        }

        return NextResponse.json({
            success: true,
            data: event,
        });
    } catch (error) {
        console.error('Event creation API error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}
