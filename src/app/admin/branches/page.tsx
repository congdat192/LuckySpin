'use client';

import { useEffect, useState } from 'react';
import { Building2, Plus, Edit, Trash2, Check, X, Loader2, RefreshCw } from 'lucide-react';

interface Branch {
    id: string;
    code: string;
    name: string;
    kiotviet_branch_id: string | null;
    is_active: boolean;
}

export default function BranchesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ code: '', name: '', kiotviet_branch_id: '' });
    const [isAdding, setIsAdding] = useState(false);

    const fetchBranches = async () => {
        try {
            const response = await fetch('/api/admin/branches');
            const data = await response.json();
            if (data.success) {
                setBranches(data.data || []);
            } else {
                console.error('Error:', data.error);
            }
        } catch {
            console.error('Error fetching branches');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncFromKiotViet = async () => {
        setSyncing(true);
        try {
            const response = await fetch('/api/admin/branches/sync', {
                method: 'POST',
            });
            const data = await response.json();
            if (data.success) {
                alert(`Đồng bộ thành công!\nTổng: ${data.data.total} chi nhánh\nMới: ${data.data.created}\nCập nhật: ${data.data.updated}`);
                await fetchBranches();
            } else {
                alert('Lỗi: ' + data.error);
            }
        } catch {
            alert('Lỗi khi đồng bộ');
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleEdit = (branch: Branch) => {
        setEditingId(branch.id);
        setEditForm({
            code: branch.code,
            name: branch.name,
            kiotviet_branch_id: branch.kiotviet_branch_id || '',
        });
    };

    const handleSave = async (id: string) => {
        setSaving(true);
        try {
            const response = await fetch(`/api/admin/branches/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const data = await response.json();
            if (data.success) {
                await fetchBranches();
                setEditingId(null);
            } else {
                alert('Lỗi: ' + data.error);
            }
        } catch {
            alert('Lỗi khi lưu');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setIsAdding(false);
    };

    const handleAddBranch = () => {
        setIsAdding(true);
        setEditForm({
            code: `CN${String(branches.length + 1).padStart(2, '0')}`,
            name: '',
            kiotviet_branch_id: '',
        });
    };

    const handleSaveNew = async () => {
        if (!editForm.code || !editForm.name) {
            alert('Vui lòng nhập mã và tên chi nhánh');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/admin/branches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const data = await response.json();
            if (data.success) {
                await fetchBranches();
                setIsAdding(false);
                setEditForm({ code: '', name: '', kiotviet_branch_id: '' });
            } else {
                alert('Lỗi: ' + data.error);
            }
        } catch {
            alert('Lỗi khi tạo chi nhánh');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa chi nhánh này?')) return;

        try {
            const response = await fetch(`/api/admin/branches/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                await fetchBranches();
            } else {
                alert('Lỗi: ' + data.error);
            }
        } catch {
            alert('Lỗi khi xóa');
        }
    };

    const handleToggleActive = async (branch: Branch) => {
        try {
            const response = await fetch(`/api/admin/branches/${branch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !branch.is_active }),
            });
            const data = await response.json();
            if (data.success) {
                await fetchBranches();
            }
        } catch {
            console.error('Error toggling status:');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý chi nhánh</h1>
                    <p className="text-gray-600">Cấu hình các chi nhánh và liên kết với KiotViet</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSyncFromKiotViet}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Đang đồng bộ...' : 'Sync từ KiotViet'}
                    </button>
                    <button
                        onClick={handleAddBranch}
                        disabled={isAdding}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm chi nhánh
                    </button>
                </div>
            </div>

            {branches.length === 0 && !isAdding ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Chưa có chi nhánh nào</p>
                    <button
                        onClick={handleAddBranch}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm chi nhánh đầu tiên
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mã</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tên chi nhánh</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">KiotViet Branch ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {/* Add new row */}
                            {isAdding && (
                                <tr className="bg-indigo-50">
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={editForm.code}
                                            onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                            className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg font-mono"
                                            placeholder="CN01"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                                            placeholder="Tên chi nhánh"
                                            autoFocus
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={editForm.kiotviet_branch_id}
                                            onChange={(e) => setEditForm({ ...editForm, kiotviet_branch_id: e.target.value })}
                                            placeholder="VD: 123456"
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Hoạt động
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={handleSaveNew}
                                                disabled={saving}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Existing rows */}
                            {branches.map((branch) => (
                                <tr key={branch.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        {editingId === branch.id ? (
                                            <input
                                                type="text"
                                                value={editForm.code}
                                                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                                className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg font-mono"
                                            />
                                        ) : (
                                            <span className="font-mono font-medium text-gray-900">{branch.code}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === branch.id ? (
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                                            />
                                        ) : (
                                            <span className="text-gray-900">{branch.name}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === branch.id ? (
                                            <input
                                                type="text"
                                                value={editForm.kiotviet_branch_id}
                                                onChange={(e) => setEditForm({ ...editForm, kiotviet_branch_id: e.target.value })}
                                                placeholder="VD: 123456"
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                                            />
                                        ) : (
                                            <span className="text-gray-600 font-mono">
                                                {branch.kiotviet_branch_id || '-'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleActive(branch)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${branch.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {branch.is_active ? 'Hoạt động' : 'Tạm dừng'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {editingId === branch.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleSave(branch.id)}
                                                    disabled={saving}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                                                >
                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(branch)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(branch.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Hướng dẫn:</strong> Nhập <code className="bg-blue-100 px-1 rounded">KiotViet Branch ID</code> để liên kết
                    chi nhánh với dữ liệu từ KiotViet. ID này lấy từ KiotViet Admin.
                </p>
            </div>
        </div>
    );
}
