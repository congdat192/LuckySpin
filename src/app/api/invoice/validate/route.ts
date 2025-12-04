import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getInvoiceByCode } from '@/lib/kiotviet';
import { processEventRules } from '@/lib/spin-logic';
import type { Event, EventRule, Branch, InvoiceSession } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { invoice_code, event_id } = body;

        if (!invoice_code) {
            return NextResponse.json(
                { success: false, error: 'Mã hóa đơn không được để trống' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get active event (or specific event if provided)
        let eventQuery = supabase
            .from('events')
            .select('*')
            .eq('status', 'active');

        if (event_id) {
            eventQuery = eventQuery.eq('id', event_id);
        }

        const { data: events, error: eventError } = await eventQuery.limit(1);

        if (eventError || !events || events.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Không có sự kiện nào đang diễn ra' },
                { status: 404 }
            );
        }

        const event = events[0] as Event;

        // Check if invoice already used in this event
        const { data: existingSession } = await supabase
            .from('invoice_sessions')
            .select('*, branch:branches(*)')
            .eq('event_id', event.id)
            .eq('invoice_code', invoice_code)
            .single();

        if (existingSession) {
            const session = existingSession as InvoiceSession & { branch: Branch };
            return NextResponse.json({
                success: true,
                data: {
                    session_id: session.id,
                    is_eligible: session.is_valid,
                    total_turns: session.total_turns,
                    remaining_turns: session.total_turns - session.used_turns,
                    invoice_code: invoice_code,
                    customer: {
                        name: session.customer_name,
                        phone: session.customer_phone,
                    },
                    branch: {
                        code: session.branch?.code,
                        name: session.branch?.name,
                    },
                    invoice_total: session.invoice_total,
                    reason: session.invalid_reason,
                },
            });
        }

        // Fetch invoice from KiotViet
        let invoice;
        try {
            invoice = await getInvoiceByCode(invoice_code);
        } catch (error) {
            console.error('KiotViet API error:', error);
            return NextResponse.json(
                { success: false, error: 'Không thể kết nối với hệ thống KiotViet' },
                { status: 502 }
            );
        }

        if (!invoice) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy hóa đơn này' },
                { status: 404 }
            );
        }

        // Check invoice date is within event date range
        const invoiceDate = new Date(invoice.purchaseDate);
        const eventStart = new Date(event.start_date);
        const eventEnd = new Date(event.end_date);

        if (invoiceDate < eventStart || invoiceDate > eventEnd) {
            const formatDate = (d: Date) => d.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            return NextResponse.json({
                success: false,
                error: `Hóa đơn phát sinh ngày ${formatDate(invoiceDate)} không nằm trong thời gian chương trình (${formatDate(eventStart)} - ${formatDate(eventEnd)})`
            }, { status: 400 });
        }

        // Find branch by KiotViet branch ID
        const { data: branch } = await supabase
            .from('branches')
            .select('*')
            .eq('kiotviet_branch_id', invoice.branchId.toString())
            .single();

        if (!branch) {
            return NextResponse.json(
                { success: false, error: 'Chi nhánh không tồn tại trong hệ thống' },
                { status: 404 }
            );
        }

        // Get event rules
        const { data: rules } = await supabase
            .from('event_rules')
            .select('*')
            .eq('event_id', event.id)
            .eq('is_active', true);

        // Process rules
        const result = processEventRules(
            (rules || []) as EventRule[],
            invoice,
            branch.code
        );

        // Create session
        const { data: newSession, error: sessionError } = await supabase
            .from('invoice_sessions')
            .insert({
                event_id: event.id,
                invoice_code: invoice_code,
                customer_phone: invoice.customer?.contactNumber || null,
                customer_name: invoice.customerName || invoice.customer?.name || null,
                branch_id: branch.id,
                invoice_total: invoice.total,
                invoice_data: invoice,
                total_turns: result.eligible ? result.turns : 0,
                used_turns: 0,
                is_valid: result.eligible,
                invalid_reason: result.reason || null,
            })
            .select()
            .single();

        if (sessionError) {
            console.error('Session creation error:', sessionError);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi tạo phiên quay thưởng' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                session_id: newSession.id,
                is_eligible: result.eligible,
                total_turns: result.eligible ? result.turns : 0,
                remaining_turns: result.eligible ? result.turns : 0,
                invoice_code: invoice_code,
                customer: {
                    name: invoice.customerName || invoice.customer?.name || null,
                    phone: invoice.customer?.contactNumber || null,
                },
                branch: {
                    code: branch.code,
                    name: branch.name,
                },
                invoice_total: invoice.total,
                reason: result.reason,
            },
        });
    } catch (error) {
        console.error('Validate invoice error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi, vui lòng thử lại' },
            { status: 500 }
        );
    }
}
