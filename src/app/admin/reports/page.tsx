'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Calendar } from 'lucide-react';

interface SpinLog {
    id: string;
    invoice_code: string;
    customer_name: string | null;
    customer_phone: string | null;
    branch_code: string;
    branch_name: string;
    prize_name: string;
    prize_type: string;
    prize_value: number | null;
    event_name: string;
    spun_at: string;
}

interface Branch {
    id: string;
    code: string;
    name: string;
}

export default function ReportsPage() {
    const [logs, setLogs] = useState<SpinLog[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        branch: '',
        dateFrom: '',
        dateTo: '',
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.set('search', filters.search);
            if (filters.branch) params.set('branch_id', filters.branch);
            if (filters.dateFrom) params.set('date_from', filters.dateFrom);
            if (filters.dateTo) params.set('date_to', filters.dateTo);

            const response = await fetch(`/api/admin/reports?${params}`);
            const data = await response.json();
            if (data.success) {
                setLogs(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await fetch('/api/admin/branches');
                const data = await response.json();
                if (data.success) {
                    setBranches(data.data.filter((b: Branch & { is_active?: boolean }) => b.is_active !== false));
                }
            } catch (error) {
                console.error('Error fetching branches:', error);
            }
        };
        fetchBranches();
    }, []);

    const handleExport = () => {
        // TODO: Export to Excel
        alert('Đang xuất file Excel...');
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPrizeTypeLabel = (type: string) => {
        const labels: Record<string, { text: string; color: string }> = {
            voucher: { text: 'Voucher', color: 'bg-green-100 text-green-700' },
            physical: { text: 'Quà vật lý', color: 'bg-blue-100 text-blue-700' },
            discount: { text: 'Giảm giá', color: 'bg-purple-100 text-purple-700' },
            no_prize: { text: 'Không trúng', color: 'bg-gray-100 text-gray-700' },
        };
        return labels[type] || { text: type, color: 'bg-gray-100 text-gray-700' };
    };

    // Summary stats
    const stats = {
        total: logs.length,
        won: logs.filter(l => l.prize_type !== 'no_prize').length,
        winRate: logs.length > 0 ? Math.round((logs.filter(l => l.prize_type !== 'no_prize').length / logs.length) * 100) : 0,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <Download className="w-5 h-5" />
                    Xuất Excel
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Tổng lượt quay</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Lượt trúng thưởng</p>
                    <p className="text-2xl font-bold text-green-600">{stats.won}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Tỉ lệ trúng</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.winRate}%</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo mã HĐ, SĐT, tên KH..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <select
                        value={filters.branch}
                        onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Tất cả chi nhánh</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.code} - {branch.name}</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Chưa có dữ liệu quay thưởng</p>
                        <p className="text-sm text-gray-400 mt-1">Dữ liệu sẽ hiển thị khi có người quay thưởng</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                    Thời gian
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                    Mã hóa đơn
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                    Khách hàng
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                    Chi nhánh
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                    Kết quả
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {logs.map((log) => {
                                const prizeType = getPrizeTypeLabel(log.prize_type);
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatDateTime(log.spun_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-sm font-medium text-gray-900">
                                                {log.invoice_code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {log.customer_name || 'Khách lẻ'}
                                                </p>
                                                {log.customer_phone && (
                                                    <p className="text-xs text-gray-500">{log.customer_phone}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {log.branch_name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${prizeType.color}`}>
                                                {log.prize_name}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
