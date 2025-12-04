import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - Get public spin history
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '5');
        const offset = (page - 1) * limit;

        const supabase = createAdminClient();

        // Get total count
        const { count } = await supabase
            .from('spin_logs')
            .select('id', { count: 'exact', head: true });

        // Get logs with pagination
        const { data: logs, error } = await supabase
            .from('spin_logs')
            .select(`
                id,
                customer_name,
                spun_at,
                prize:event_prizes(name, prize_type),
                branch:branches(name)
            `)
            .order('spun_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Spin history error:', error);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi lấy lịch sử' },
                { status: 500 }
            );
        }

        const transformedLogs = (logs || []).map(log => ({
            id: log.id,
            customer_name: log.customer_name,
            branch_name: (log.branch as unknown as { name: string } | null)?.name,
            prize_name: (log.prize as unknown as { name: string } | null)?.name,
            prize_type: (log.prize as unknown as { prize_type: string } | null)?.prize_type,
            spun_at: log.spun_at,
        }));

        return NextResponse.json({
            success: true,
            data: {
                logs: transformedLogs,
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit),
                },
            },
        });
    } catch (error) {
        console.error('Spin history API error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}
