'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Ticket, RefreshCw, Mail, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

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
    created_at: string;
    voucher_campaigns: {
        name: string;
        code: string;
    };
}

export default function IssuedVouchersPage() {
    const [vouchers, setVouchers] = useState<IssuedVoucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('all');

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
                                                    <Mail className="w-4 h-4 text-green-500 mx-auto" />
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
        </div>
    );
}
