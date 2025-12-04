'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Plus,
    Calendar,
    Play,
    Pause,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    Clock,
    XCircle,
    Loader2
} from 'lucide-react';

interface Event {
    id: string;
    name: string;
    slug: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'active' | 'paused' | 'ended';
    total_spins?: number;
    total_prizes?: number;
}

const statusConfig = {
    draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-700', icon: Clock },
    active: { label: 'Đang chạy', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    paused: { label: 'Tạm dừng', color: 'bg-yellow-100 text-yellow-700', icon: Pause },
    ended: { label: 'Kết thúc', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/admin/events');
            const data = await response.json();
            if (data.success) {
                setEvents(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleStatusChange = async (eventId: string, newStatus: string) => {
        setActionLoading(eventId);
        try {
            const response = await fetch(`/api/admin/events/${eventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            if (data.success) {
                await fetchEvents();
            } else {
                alert('Lỗi: ' + data.error);
            }
        } catch (error) {
            alert('Lỗi khi cập nhật trạng thái');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (eventId: string, eventName: string) => {
        if (!confirm(`Bạn có chắc muốn xóa sự kiện "${eventName}"?\n\nHành động này không thể hoàn tác!`)) {
            return;
        }

        setActionLoading(eventId);
        try {
            const response = await fetch(`/api/admin/events/${eventId}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                await fetchEvents();
            } else {
                alert('Lỗi: ' + data.error);
            }
        } catch (error) {
            alert('Lỗi khi xóa sự kiện');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý sự kiện</h1>
                <Link
                    href="/admin/events/new"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    Tạo sự kiện mới
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Chưa có sự kiện nào</p>
                    <Link
                        href="/admin/events/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus className="w-5 h-5" />
                        Tạo sự kiện đầu tiên
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                    Tên sự kiện
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                    Thời gian
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                    Lượt quay
                                </th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {events.map((event) => {
                                const status = statusConfig[event.status];
                                const StatusIcon = status.icon;
                                const isLoading = actionLoading === event.id;

                                return (
                                    <tr key={event.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{event.name}</p>
                                                <p className="text-sm text-gray-500">/{event.slug}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">
                                                {formatDate(event.start_date)} - {formatDate(event.end_date)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">
                                                {event.total_spins?.toLocaleString() || '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {isLoading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                                ) : (
                                                    <>
                                                        <Link
                                                            href={`/admin/events/${event.id}/edit`}
                                                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>

                                                        {event.status === 'draft' && (
                                                            <button
                                                                onClick={() => handleStatusChange(event.id, 'active')}
                                                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                                                                title="Kích hoạt"
                                                            >
                                                                <Play className="w-4 h-4" />
                                                            </button>
                                                        )}

                                                        {event.status === 'active' && (
                                                            <button
                                                                onClick={() => handleStatusChange(event.id, 'paused')}
                                                                className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg"
                                                                title="Tạm dừng"
                                                            >
                                                                <Pause className="w-4 h-4" />
                                                            </button>
                                                        )}

                                                        {event.status === 'paused' && (
                                                            <button
                                                                onClick={() => handleStatusChange(event.id, 'active')}
                                                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                                                                title="Tiếp tục"
                                                            >
                                                                <Play className="w-4 h-4" />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => handleDelete(event.id, event.name)}
                                                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
