import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
    createVoucher,
    releaseVoucher,
    generateVoucherCode,
    calculateExpireDate
} from '@/lib/kiotviet-voucher';

interface IssueVoucherRequest {
    campaign_id: string;
    spin_log_id: string;
    customer_name?: string;
    customer_phone?: string;
}

// POST - Issue voucher for spin winner
export async function POST(request: NextRequest) {
    try {
        const body: IssueVoucherRequest = await request.json();
        const { campaign_id, spin_log_id, customer_name, customer_phone } = body;

        if (!campaign_id || !spin_log_id) {
            return NextResponse.json(
                { success: false, error: 'Campaign ID and Spin Log ID are required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get campaign details
        const { data: campaign, error: campaignError } = await supabase
            .from('voucher_campaigns')
            .select('*')
            .eq('id', campaign_id)
            .single();

        if (campaignError || !campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Generate unique voucher code
        const voucherCode = generateVoucherCode('XMAS');

        // Create voucher in KiotViet
        await createVoucher(campaign.kiotviet_campaign_id, voucherCode);

        // Release voucher in KiotViet
        const releaseDate = new Date();
        await releaseVoucher(campaign.kiotviet_campaign_id, voucherCode, releaseDate);

        // Calculate expire date
        const expireDate = campaign.expire_days
            ? calculateExpireDate(campaign.expire_days, releaseDate)
            : campaign.end_date ? new Date(campaign.end_date) : null;

        // Save to database
        const { data: issuedVoucher, error: insertError } = await supabase
            .from('issued_vouchers')
            .insert({
                campaign_id,
                spin_log_id,
                voucher_code: voucherCode,
                customer_name,
                customer_phone,
                value: campaign.value,
                release_date: releaseDate.toISOString(),
                expire_date: expireDate?.toISOString(),
                status: 'issued',
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({
            success: true,
            data: {
                voucher_code: voucherCode,
                value: campaign.value,
                expire_date: expireDate?.toISOString(),
                conditions: campaign.conditions_text,
                campaign_name: campaign.name,
            },
        });
    } catch (error) {
        console.error('Error issuing voucher:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to issue voucher' },
            { status: 500 }
        );
    }
}
