'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Gift, Edit2, Save, X, Loader2 } from 'lucide-react';

interface VoucherCampaign {
    id: string;
    kiotviet_campaign_id: number;
    code: string;
    name: string;
    value: number;
    start_date: string;
    end_date: string;
    expire_days: number;
    conditions_text: string | null;
    is_active: boolean;
    synced_at: string;
}

export default function VoucherCampaignsPage() {
    const [campaigns, setCampaigns] = useState<VoucherCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editConditions, setEditConditions] = useState('');
    const [saving, setSaving] = useState(false);

    const [syncMessage, setSyncMessage] = useState('');

    const fetchCampaigns = async (sync: boolean = false) => {
        try {
            if (sync) setSyncing(true);
            else setLoading(true);
            setSyncMessage('');

            const response = await fetch(`/api/admin/voucher-campaigns?sync=${sync}`);
            const data = await response.json();

            if (data.success) {
                // Sort by code descending (PHVC000440 > PHVC000133)
                const sorted = [...data.data].sort((a: VoucherCampaign, b: VoucherCampaign) => b.code.localeCompare(a.code));
                setCampaigns(sorted);
                if (sync) {
                    setSyncMessage(`✅ Đã đồng bộ ${data.data.length} đợt phát hành`);
                }
            } else {
                setSyncMessage('❌ Lỗi: ' + (data.error || 'Không thể đồng bộ'));
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            setSyncMessage('❌ Lỗi kết nối');
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleEdit = (campaign: VoucherCampaign) => {
        setEditingId(campaign.id);
        setEditConditions(campaign.conditions_text || '');
    };

    const handleSave = async (id: string) => {
        setSaving(true);
        try {
            const response = await fetch('/api/admin/voucher-campaigns', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, conditions_text: editConditions }),
            });

            if (response.ok) {
                setCampaigns(prev => prev.map(c =>
                    c.id === id ? { ...c, conditions_text: editConditions } : c
                ));
                setEditingId(null);
            }
        } catch (error) {
            console.error('Error saving conditions:', error);
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('vi-VN');
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
                            <Gift className="w-6 h-6 text-purple-600" />
                            <h1 className="text-xl font-bold">Quản lý Đợt phát hành Voucher</h1>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchCampaigns(true)}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Đang đồng bộ...' : 'Đồng bộ từ KiotViet'}
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {syncMessage && (
                    <div className={`mb-4 px-4 py-3 rounded-lg ${syncMessage.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {syncMessage}
                    </div>
                )}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center">
                        <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Chưa có đợt phát hành nào</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Nhấn &quot;Đồng bộ từ KiotViet&quot; để lấy danh sách đợt phát hành
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Mã</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tên đợt phát hành</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Mệnh giá</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Thời hạn</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Điều kiện sử dụng</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Trạng thái</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono text-sm">{campaign.code}</td>
                                        <td className="px-4 py-3 font-medium">{campaign.name}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-green-600">
                                            {formatCurrency(campaign.value)}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-500">
                                            {campaign.expire_days ? `${campaign.expire_days} ngày` :
                                                `${formatDate(campaign.start_date)} - ${formatDate(campaign.end_date)}`}
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            {editingId === campaign.id ? (
                                                <textarea
                                                    value={editConditions}
                                                    onChange={(e) => setEditConditions(e.target.value)}
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                    rows={2}
                                                    placeholder="Nhập điều kiện sử dụng..."
                                                />
                                            ) : (
                                                <span className="text-sm text-gray-600 line-clamp-2">
                                                    {campaign.conditions_text || <span className="text-gray-400 italic">Chưa có</span>}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs ${campaign.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {campaign.is_active ? 'Hoạt động' : 'Tạm dừng'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {editingId === campaign.id ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleSave(campaign.id)}
                                                        disabled={saving}
                                                        className="p-1 text-green-600 hover:text-green-800"
                                                    >
                                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1 text-gray-600 hover:text-gray-800"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEdit(campaign)}
                                                    className="p-1 text-blue-600 hover:text-blue-800"
                                                    title="Sửa điều kiện"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 text-sm text-gray-500">
                    Cập nhật lần cuối: {campaigns[0]?.synced_at
                        ? new Date(campaigns[0].synced_at).toLocaleString('vi-VN')
                        : '-'}
                </div>
            </main>
        </div>
    );
}
