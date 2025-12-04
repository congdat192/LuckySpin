'use client';

import { useEffect, useState } from 'react';
import {
    TrendingUp,
    Gift,
    Calendar,
    AlertTriangle,
    Activity
} from 'lucide-react';

interface DashboardStats {
    total_spins_today: number;
    total_prizes_given_today: number;
    active_events: number;
    low_inventory_alerts: {
        prize_name: string;
        branch_name: string;
        remaining: number;
    }[];
}

interface RecentActivity {
    id: string;
    customer_name: string | null;
    prize_name: string;
    branch_name: string;
    spun_at: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        total_spins_today: 0,
        total_prizes_given_today: 0,
        active_events: 0,
        low_inventory_alerts: [],
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await fetch('/api/admin/dashboard');
                const data = await response.json();
                if (data.success) {
                    setStats({
                        total_spins_today: data.data.total_spins_today,
                        total_prizes_given_today: data.data.total_prizes_given_today,
                        active_events: data.data.active_events,
                        low_inventory_alerts: data.data.low_inventory_alerts || [],
                    });
                    setRecentActivity(data.data.recent_activity || []);
                }
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Lượt quay hôm nay"
                    value={stats.total_spins_today}
                    icon={TrendingUp}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Quà đã phát hôm nay"
                    value={stats.total_prizes_given_today}
                    icon={Gift}
                    color="bg-green-500"
                />
                <StatCard
                    title="Sự kiện đang chạy"
                    value={stats.active_events}
                    icon={Calendar}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Cảnh báo tồn kho"
                    value={stats.low_inventory_alerts.length}
                    icon={AlertTriangle}
                    color="bg-orange-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Inventory Alerts */}
                {stats.low_inventory_alerts.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            Cảnh báo sắp hết quà
                        </h2>
                        <div className="space-y-3">
                            {stats.low_inventory_alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{alert.prize_name}</p>
                                        <p className="text-sm text-gray-600">{alert.branch_name}</p>
                                    </div>
                                    <span className="text-orange-600 font-bold">
                                        Còn {alert.remaining}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Hoạt động gần đây
                    </h2>
                    <div className="space-y-3">
                        {recentActivity.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {activity.customer_name || 'Khách lẻ'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {activity.prize_name} • {activity.branch_name}
                                    </p>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {new Date(activity.spun_at).toLocaleString('vi-VN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: 'Asia/Ho_Chi_Minh'
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    color
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}
