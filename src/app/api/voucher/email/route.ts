import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

interface EmailVoucherRequest {
    voucher_id: string;
    email: string;
}

// Default email template (fallback)
const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td style="background: linear-gradient(135deg, #c41e3a 0%, #165b33 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎄 Chúc Mừng Giáng Sinh! 🎄</h1>
                <p style="color: #ffd700; margin: 10px 0 0;">Bạn đã trúng thưởng từ LuckySpin</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px; text-align: center;">
                <h2 style="color: #333; margin: 0 0 10px;">Voucher của bạn</h2>
                <div style="background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%); padding: 20px 30px; border-radius: 12px; display: inline-block; margin: 20px 0;">
                    <p style="margin: 0; font-size: 36px; font-weight: bold; color: #333; letter-spacing: 3px;">
                        {{voucher_code}}
                    </p>
                </div>
                <p style="font-size: 24px; color: #c41e3a; font-weight: bold; margin: 20px 0;">
                    Trị giá: {{value}}đ
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 0 30px 30px;">
                <table width="100%" style="background-color: #f9f9f9; border-radius: 8px; padding: 20px;">
                    <tr>
                        <td style="padding: 10px;">
                            <p style="margin: 0 0 10px; color: #666;">
                                <strong>📅 Hạn sử dụng:</strong> {{expire_date}}
                            </p>
                            <p style="margin: 0; color: #666;">
                                <strong>📋 Điều kiện:</strong> {{conditions}}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="background-color: #165b33; padding: 20px; text-align: center;">
                <p style="color: #ffffff; margin: 0; font-size: 14px;">
                    Cảm ơn bạn đã tham gia LuckySpin! 🎁
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;

const DEFAULT_SUBJECT = '🎁 Voucher {{value}}đ - Chúc mừng bạn đã trúng thưởng!';

// POST - Send voucher to customer email
export async function POST(request: NextRequest) {
    try {
        const body: EmailVoucherRequest = await request.json();
        const { voucher_id, email } = body;

        if (!voucher_id || !email) {
            return NextResponse.json(
                { success: false, error: 'Voucher ID and email are required' },
                { status: 400 }
            );
        }

        // Check Resend API key
        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Email service not configured' },
                { status: 500 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get voucher details
        const { data: voucher, error: voucherError } = await supabase
            .from('issued_vouchers')
            .select('*, voucher_campaigns(*)')
            .eq('id', voucher_id)
            .single();

        if (voucherError || !voucher) {
            return NextResponse.json(
                { success: false, error: 'Voucher not found' },
                { status: 404 }
            );
        }

        // Get email template from settings
        const { data: templateSetting } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'email_template')
            .single();

        const emailTemplate = templateSetting?.value?.template || DEFAULT_TEMPLATE;
        const emailSubject = templateSetting?.value?.subject || DEFAULT_SUBJECT;

        const campaign = voucher.voucher_campaigns;
        const expireDate = voucher.expire_date
            ? new Date(voucher.expire_date).toLocaleDateString('vi-VN')
            : 'Không giới hạn';
        const valueFormatted = new Intl.NumberFormat('vi-VN').format(voucher.value);

        // Replace placeholders in template
        const htmlContent = emailTemplate
            .replace(/\{\{voucher_code\}\}/g, voucher.voucher_code)
            .replace(/\{\{value\}\}/g, valueFormatted)
            .replace(/\{\{expire_date\}\}/g, expireDate)
            .replace(/\{\{conditions\}\}/g, campaign?.conditions_text || 'Không có điều kiện đặc biệt');

        const subject = emailSubject
            .replace(/\{\{value\}\}/g, valueFormatted)
            .replace(/\{\{voucher_code\}\}/g, voucher.voucher_code);

        // Initialize Resend inside function
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Send email via Resend
        const { error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'LuckySpin <noreply@luckyspin.vn>',
            to: email,
            subject,
            html: htmlContent,
        });

        if (emailError) {
            console.error('Resend error:', emailError);
            throw new Error('Failed to send email');
        }

        // Update voucher record
        await supabase
            .from('issued_vouchers')
            .update({
                customer_email: email,
                email_sent: true,
                email_sent_at: new Date().toISOString(),
            })
            .eq('id', voucher_id);

        return NextResponse.json({
            success: true,
            message: 'Voucher sent to email successfully',
        });
    } catch (error) {
        console.error('Error sending voucher email:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send voucher email' },
            { status: 500 }
        );
    }
}
