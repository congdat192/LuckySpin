import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getVoucherCampaigns } from '@/lib/kiotviet-voucher';

// GET - Sync and get voucher campaigns from KiotViet
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sync = searchParams.get('sync') === 'true';

        const supabase = createAdminClient();

        if (sync) {
            // Sync from KiotViet
            const kiotvietCampaigns = await getVoucherCampaigns({ isActive: true });

            // Upsert campaigns
            for (const campaign of kiotvietCampaigns) {
                await supabase
                    .from('voucher_campaigns')
                    .upsert({
                        kiotviet_campaign_id: campaign.id,
                        code: campaign.code,
                        name: campaign.name,
                        value: campaign.price,
                        start_date: campaign.startDate,
                        end_date: campaign.endDate,
                        expire_days: campaign.expireTime,
                        is_active: campaign.isActive,
                        synced_at: new Date().toISOString(),
                    }, {
                        onConflict: 'kiotviet_campaign_id',
                    });
            }
        }

        // Get all campaigns from database (newest first by code - PHVC000440 > PHVC000439)
        const { data: campaigns, error } = await supabase
            .from('voucher_campaigns')
            .select('*')
            .order('code', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: campaigns,
        });
    } catch (error) {
        console.error('Error fetching voucher campaigns:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch voucher campaigns' },
            { status: 500 }
        );
    }
}

// PATCH - Update campaign conditions text
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, conditions_text } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Campaign ID is required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('voucher_campaigns')
            .update({ conditions_text })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Error updating voucher campaign:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update voucher campaign' },
            { status: 500 }
        );
    }
}
