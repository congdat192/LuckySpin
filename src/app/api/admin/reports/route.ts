import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - Get spin logs for reports
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const branchId = searchParams.get('branch_id');
        const dateFrom = searchParams.get('date_from');
        const dateTo = searchParams.get('date_to');
        const limit = parseInt(searchParams.get('limit') || '100');

        const supabase = createAdminClient();

        let query = supabase
            .from('spin_logs')
            .select(`
                id,
                turn_index,
                customer_name,
                customer_phone,
                spun_at,
                session:invoice_sessions(invoice_code),
                prize:event_prizes(name, prize_type, value),
                branch:branches(code, name),
                event:events(name)
            `)
            .order('spun_at', { ascending: false })
            .limit(limit);

        if (branchId) {
            query = query.eq('branch_id', branchId);
        }

        if (dateFrom) {
            query = query.gte('spun_at', `${dateFrom}T00:00:00`);
        }

        if (dateTo) {
            query = query.lte('spun_at', `${dateTo}T23:59:59`);
        }

        const { data: logs, error } = await query;

        if (error) {
            console.error('Reports fetch error:', error);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi lấy dữ liệu' },
                { status: 500 }
            );
        }

        // Transform and filter by search
        const transformedLogs = (logs || []).map(log => ({
            id: log.id,
            invoice_code: (log.session as unknown as { invoice_code: string } | null)?.invoice_code || '',
            customer_name: log.customer_name,
            customer_phone: log.customer_phone,
            branch_code: (log.branch as unknown as { code: string } | null)?.code,
            branch_name: (log.branch as unknown as { name: string } | null)?.name,
            prize_name: (log.prize as unknown as { name: string } | null)?.name,
            prize_type: (log.prize as unknown as { prize_type: string } | null)?.prize_type,
            prize_value: (log.prize as unknown as { value: number } | null)?.value,
            event_name: (log.event as unknown as { name: string } | null)?.name,
            spun_at: log.spun_at,
        })).filter(log => {
            if (!search) return true;
            const searchLower = search.toLowerCase();
            return (
                log.invoice_code?.toLowerCase().includes(searchLower) ||
                log.customer_name?.toLowerCase().includes(searchLower) ||
                log.customer_phone?.includes(search)
            );
        });

        return NextResponse.json({
            success: true,
            data: transformedLogs,
        });
    } catch (error) {
        console.error('Reports API error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}
