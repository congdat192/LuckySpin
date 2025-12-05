import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getInvoiceByCode } from '@/lib/kiotviet';
import {
    cancelVoucher,
    createVoucher,
    releaseVoucher,
    generateVoucherCode,
    calculateExpireDate
} from '@/lib/kiotviet-voucher';

interface ReissueVoucherRequest {
    original_voucher_id: string;
    invoice_code: string; // Hóa đơn đã sử dụng voucher gốc
}

// POST - Reissue voucher when original invoice is cancelled
export async function POST(request: NextRequest) {
    try {
        const body: ReissueVoucherRequest = await request.json();
        const { original_voucher_id, invoice_code } = body;

        if (!original_voucher_id || !invoice_code) {
            return NextResponse.json(
                { success: false, error: 'Original voucher ID and invoice code are required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get original voucher
        const { data: originalVoucher, error: voucherError } = await supabase
            .from('issued_vouchers')
            .select('*, voucher_campaigns(*)')
            .eq('id', original_voucher_id)
            .single();

        if (voucherError || !originalVoucher) {
            return NextResponse.json(
                { success: false, error: 'Original voucher not found' },
                { status: 404 }
            );
        }

        if (originalVoucher.status === 'reissued') {
            return NextResponse.json(
                { success: false, error: 'This voucher has already been reissued' },
                { status: 400 }
            );
        }

        // Check if invoice is cancelled
        const invoice = await getInvoiceByCode(invoice_code);

        if (!invoice) {
            return NextResponse.json(
                { success: false, error: 'Invoice not found' },
                { status: 404 }
            );
        }

        // Status 4 = Đã hủy
        if (invoice.status !== 4) {
            return NextResponse.json(
                { success: false, error: 'Invoice has not been cancelled. Only cancelled invoices are eligible for voucher reissue.' },
                { status: 400 }
            );
        }

        const campaign = originalVoucher.voucher_campaigns;

        // Cancel old voucher in KiotViet (if still active)
        try {
            await cancelVoucher(campaign.kiotviet_campaign_id, originalVoucher.voucher_code);
        } catch (e) {
            // Voucher might already be used/cancelled, continue anyway
            console.warn('Could not cancel old voucher:', e);
        }

        // Generate new voucher code
        const newVoucherCode = generateVoucherCode('XMAS');

        // Create new voucher in KiotViet
        await createVoucher(campaign.kiotviet_campaign_id, newVoucherCode);

        // Release new voucher
        const releaseDate = new Date();
        await releaseVoucher(campaign.kiotviet_campaign_id, newVoucherCode, releaseDate);

        // Calculate expire date
        const expireDate = campaign.expire_days
            ? calculateExpireDate(campaign.expire_days, releaseDate)
            : campaign.end_date ? new Date(campaign.end_date) : null;

        // Update original voucher status
        await supabase
            .from('issued_vouchers')
            .update({ status: 'reissued' })
            .eq('id', original_voucher_id);

        // Create new voucher record
        const { data: newVoucher, error: insertError } = await supabase
            .from('issued_vouchers')
            .insert({
                campaign_id: originalVoucher.campaign_id,
                spin_log_id: originalVoucher.spin_log_id,
                voucher_code: newVoucherCode,
                customer_name: originalVoucher.customer_name,
                customer_phone: originalVoucher.customer_phone,
                customer_email: originalVoucher.customer_email,
                value: campaign.value,
                release_date: releaseDate.toISOString(),
                expire_date: expireDate?.toISOString(),
                status: 'issued',
                original_voucher_id: original_voucher_id,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({
            success: true,
            data: {
                voucher_code: newVoucherCode,
                value: campaign.value,
                expire_date: expireDate?.toISOString(),
                conditions: campaign.conditions_text,
                old_voucher_code: originalVoucher.voucher_code,
            },
        });
    } catch (error) {
        console.error('Error reissuing voucher:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to reissue voucher' },
            { status: 500 }
        );
    }
}
