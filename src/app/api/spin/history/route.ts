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
                issued_voucher_id,
                prize:event_prizes(id, name, prize_type, value, description),
                branch:branches(name)
            `)
            .order('spun_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Spin history error:', error);
            // If issued_voucher_id column doesn't exist, fallback to simpler query
            if (error.message?.includes('issued_voucher_id')) {
                const { data: fallbackLogs, error: fallbackError } = await supabase
                    .from('spin_logs')
                    .select(`
                        id,
                        customer_name,
                        spun_at,
                        prize:event_prizes(id, name, prize_type, value, description),
                        branch:branches(name)
                    `)
                    .order('spun_at', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (fallbackError) {
                    return NextResponse.json(
                        { success: false, error: 'Lỗi khi lấy lịch sử' },
                        { status: 500 }
                    );
                }

                const transformedLogs = (fallbackLogs || []).map(log => {
                    const prize = log.prize as unknown as {
                        id: string;
                        name: string;
                        prize_type: string;
                        value: number | null;
                        description: string | null;
                    } | null;

                    return {
                        id: log.id,
                        customer_name: log.customer_name,
                        branch_name: (log.branch as unknown as { name: string } | null)?.name,
                        prize_id: prize?.id,
                        prize_name: prize?.name,
                        prize_type: prize?.prize_type,
                        prize_value: prize?.value,
                        prize_description: prize?.description,
                        spun_at: log.spun_at,
                        voucher: null,
                    };
                });

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
            }
            return NextResponse.json(
                { success: false, error: 'Lỗi khi lấy lịch sử' },
                { status: 500 }
            );
        }

        // Get voucher details for logs that have issued_voucher_id
        const voucherIds = (logs || [])
            .filter(log => log.issued_voucher_id)
            .map(log => log.issued_voucher_id);

        let vouchersMap: Record<string, { voucher_code: string; value: number; expire_date: string; conditions_text: string | null }> = {};

        if (voucherIds.length > 0) {
            const { data: vouchers } = await supabase
                .from('issued_vouchers')
                .select('id, voucher_code, value, expire_date, voucher_campaigns(conditions_text)')
                .in('id', voucherIds);

            vouchers?.forEach(v => {
                vouchersMap[v.id] = {
                    voucher_code: v.voucher_code,
                    value: v.value,
                    expire_date: v.expire_date,
                    conditions_text: (v.voucher_campaigns as unknown as { conditions_text: string | null } | null)?.conditions_text || null,
                };
            });
        }

        const transformedLogs = (logs || []).map(log => {
            const prize = log.prize as unknown as {
                id: string;
                name: string;
                prize_type: string;
                value: number | null;
                description: string | null;
            } | null;

            const voucher = log.issued_voucher_id ? vouchersMap[log.issued_voucher_id] : null;

            return {
                id: log.id,
                customer_name: log.customer_name,
                branch_name: (log.branch as unknown as { name: string } | null)?.name,
                prize_id: prize?.id,
                prize_name: prize?.name,
                prize_type: prize?.prize_type,
                prize_value: prize?.value,
                prize_description: prize?.description,
                spun_at: log.spun_at,
                voucher: voucher ? {
                    code: voucher.voucher_code,
                    value: voucher.value,
                    expire_date: voucher.expire_date,
                    conditions: voucher.conditions_text,
                } : null,
            };
        });

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
