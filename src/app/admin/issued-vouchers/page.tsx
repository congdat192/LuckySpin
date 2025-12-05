'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Ticket, RefreshCw, Mail, Loader2, ChevronLeft, ChevronRight, Filter, X, Eye } from 'lucide-react';

interface EmailData {
    voucher_code: string;
    value: string;
    expire_date: string;
    conditions: string;
    qr_code_url: string | null;
    recipient_email: string;
    sent_at: string;
    subject: string;
}

interface IssuedVoucher {
    id: string;
    voucher_code: string;
    customer_name: string | null;
    customer_phone: string | null;
    customer_email: string | null;
    value: number;
    release_date: string;
    expire_date: string;
    status: string;
    email_sent: boolean;
    email_data: EmailData | null;
    created_at: string;
    voucher_campaigns: {
        name: string;
        code: string;
    };
}

// Default email template for preview
const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px;">
        <tr>
            <td style="text-align: center; padding-bottom: 20px;">
                <h1 style="color: #c41e3a; margin: 0; font-size: 28px;">🎄 MÓN QUÀ GIÁNG SINH 🎁</h1>
                <p style="color: #333; margin: 15px 0; font-size: 16px; line-height: 1.5;">
                    Cảm ơn bạn đã tin chọn <strong>Mắt Kính Tâm Đức</strong>. Chúc mừng bạn đã quay trúng phần quà đặc biệt:
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 0 20px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #165b33 0%, #0d4a28 100%); border-radius: 16px; border: 3px dashed #ffd700; padding: 25px;">
                    <tr>
                        <td style="width: 60%; vertical-align: top; padding-right: 15px;">
                            <p style="color: #ffd700; margin: 0 0 5px; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Gift Voucher</p>
                            <p style="color: #ffffff; margin: 0; font-size: 48px; font-weight: bold;">{{value}}đ</p>
                            <p style="color: #cccccc; margin: 10px 0 0; font-size: 14px;">HSD: {{expire_date}}</p>
                        </td>
                        <td style="width: 40%; text-align: right; vertical-align: middle;">
                            <img src="{{qr_code}}" alt="QR Code" width="120" height="120" style="background: #ffffff; padding: 8px; border-radius: 8px;" />
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding: 0 20px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border: 2px solid #e5e5e5; border-radius: 12px; padding: 15px 20px;">
                    <tr>
                        <td>
                            <p style="color: #666; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Mã ưu đãi:</p>
                            <p style="color: #c41e3a; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">{{voucher_code}}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding: 0 20px 25px; text-align: center;">
                <a href="https://matkinhtamduc.com" style="display: inline-block; background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-size: 18px; font-weight: bold;">
                    ❄️ SỬ DỤNG NGAY 🎄
                </a>
            </td>
        </tr>
        <tr>
            <td style="text-align: center; padding: 0 20px;">
                <p style="color: #999; margin: 0; font-size: 12px; line-height: 1.6;">
                    *Điều kiện: {{conditions}}
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;

export default function IssuedVouchersPage() {
    const [vouchers, setVouchers] = useState<IssuedVoucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [previewVoucher, setPreviewVoucher] = useState<IssuedVoucher | null>(null);
    const [emailTemplate, setEmailTemplate] = useState<string>(DEFAULT_TEMPLATE);

    const fetchVouchers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '20');
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const response = await fetch(`/api/admin/issued-vouchers?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setVouchers(data.data);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    // Fetch email template from settings
    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await fetch('/api/admin/settings?key=email_template');
                const data = await response.json();
                if (data.success && data.data?.template) {
                    setEmailTemplate(data.data.template);
                }
            } catch (error) {
                console.error('Error fetching template:', error);
            }
        };
        fetchTemplate();
    }, []);

    useEffect(() => {
        fetchVouchers();
    }, [fetchVouchers]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            issued: 'bg-blue-100 text-blue-700',
            used: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
            reissued: 'bg-yellow-100 text-yellow-700',
        };
        const labels: Record<string, string> = {
            issued: 'Đã phát hành',
            used: 'Đã sử dụng',
            cancelled: 'Đã hủy',
            reissued: 'Đã cấp lại',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const renderEmailPreview = (emailData: EmailData) => {
        return emailTemplate
            .replace(/\{\{voucher_code\}\}/g, emailData.voucher_code)
            .replace(/\{\{value\}\}/g, emailData.value)
            .replace(/\{\{expire_date\}\}/g, emailData.expire_date)
            .replace(/\{\{conditions\}\}/g, emailData.conditions)
            .replace(/\{\{qr_code\}\}/g, emailData.qr_code_url || 'https://via.placeholder.com/150?text=QR');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Ticket className="w-6 h-6 text-green-600" />
                            <h1 className="text-xl font-bold">Voucher đã phát hành</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-2 border rounded-lg text-sm"
                            >
                                <option value="all">Tất cả</option>
                                <option value="issued">Đã phát hành</option>
                                <option value="used">Đã sử dụng</option>
                                <option value="cancelled">Đã hủy</option>
                                <option value="reissued">Đã cấp lại</option>
                            </select>
                        </div>

                        <button
                            onClick={fetchVouchers}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Làm mới
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    </div>
                ) : vouchers.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center">
                        <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Chưa có voucher nào được phát hành</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-xl shadow overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Mã voucher</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Đợt PH</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Giá trị</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Khách hàng</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">Ngày PH</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">Hết hạn</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">Email</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {vouchers.map((voucher) => (
                                        <tr key={voucher.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono font-medium text-purple-600">
                                                {voucher.voucher_code}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {voucher.voucher_campaigns?.code || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                {formatCurrency(voucher.value)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-gray-900">{voucher.customer_name || '-'}</div>
                                                <div className="text-xs text-gray-500">{voucher.customer_phone}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 text-xs">
                                                {formatDate(voucher.release_date)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 text-xs">
                                                {formatDate(voucher.expire_date)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {voucher.email_sent ? (
                                                    <button
                                                        onClick={() => setPreviewVoucher(voucher)}
                                                        className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded"
                                                        title="Xem email đã gửi"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                        <Eye className="w-3 h-3" />
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(voucher.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-6">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-gray-600">
                                    Trang {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Email Preview Modal */}
            {previewVoucher && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                            <div>
                                <h2 className="font-bold text-lg">Email đã gửi</h2>
                                {previewVoucher.email_data && (
                                    <p className="text-sm text-gray-500">
                                        Gửi đến: {previewVoucher.email_data.recipient_email} • {formatDate(previewVoucher.email_data.sent_at)}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setPreviewVoucher(null)}
                                className="p-2 hover:bg-gray-200 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-auto max-h-[calc(90vh-80px)]">
                            {previewVoucher.email_data ? (
                                <div className="p-4 bg-gray-100">
                                    <div className="bg-white rounded-lg shadow">
                                        <iframe
                                            srcDoc={renderEmailPreview(previewVoucher.email_data)}
                                            className="w-full h-[600px] border-0"
                                            title="Email Preview"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>Không có dữ liệu email để hiển thị</p>
                                    <p className="text-sm mt-2">Email này được gửi trước khi tính năng lưu log được bật</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
