import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - List issued vouchers with pagination and filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const campaignId = searchParams.get('campaign_id');

        const supabase = createAdminClient();

        let query = supabase
            .from('issued_vouchers')
            .select('*, voucher_campaigns(name, code)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (campaignId) {
            query = query.eq('campaign_id', campaignId);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching issued vouchers:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch issued vouchers' },
            { status: 500 }
        );
    }
}
