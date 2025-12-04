'use client';

import { useEffect, useState } from 'react';
import { Package, Save, AlertTriangle, Calendar } from 'lucide-react';

interface Event {
    id: string;
    name: string;
    status: string;
}

interface Branch {
    id: string;
    code: string;
    name: string;
}

interface Prize {
    id: string;
    name: string;
    color: string;
    prize_type: string;
}

interface InventoryItem {
    branch_id: string;
    prize_id: string;
    initial_quantity: number;
    remaining_quantity: number;
    weight_override: number | null;
}

export default function InventoryPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [inventory, setInventory] = useState<Map<string, InventoryItem>>(new Map());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch events on mount
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('/api/admin/events');
                const data = await response.json();
                if (data.success && data.data) {
                    setEvents(data.data);
                    // Auto-select first active event
                    const activeEvent = data.data.find((e: Event) => e.status === 'active');
                    if (activeEvent) {
                        setSelectedEventId(activeEvent.id);
                    } else if (data.data.length > 0) {
                        setSelectedEventId(data.data[0].id);
                    }
                }
            } catch {
                console.error('Error fetching events:');
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // Fetch branches and prizes when event is selected
    useEffect(() => {
        if (!selectedEventId) {
            setPrizes([]);
            setBranches([]);
            return;
        }

        const fetchEventData = async () => {
            setLoading(true);
            try {
                // Fetch event details with prizes using admin API
                const eventResponse = await fetch(`/api/admin/events/${selectedEventId}`);
                const eventData = await eventResponse.json();

                if (eventData.success && eventData.data) {
                    // Filter out "no_prize" type
                    const eventPrizes = (eventData.data.event_prizes || []).filter(
                        (p: Prize) => p.prize_type !== 'no_prize'
                    );
                    setPrizes(eventPrizes);
                } else {
                    setPrizes([]);
                }

                // Fetch branches from API - only active ones
                const branchesResponse = await fetch('/api/admin/branches');
                const branchesData = await branchesResponse.json();

                if (branchesData.success && branchesData.data) {
                    // Filter only active branches
                    const activeBranches = branchesData.data.filter((b: Branch & { is_active?: boolean }) => b.is_active !== false);
                    setBranches(activeBranches);
                } else {
                    setBranches([]);
                }

                // Fetch existing inventory from API
                const inventoryResponse = await fetch(`/api/admin/inventory?event_id=${selectedEventId}`);
                const inventoryData = await inventoryResponse.json();

                if (inventoryData.success && inventoryData.data) {
                    const invMap = new Map<string, InventoryItem>();
                    inventoryData.data.forEach((item: InventoryItem & { id?: string }) => {
                        const key = `${item.branch_id}-${item.prize_id}`;
                        invMap.set(key, item);
                    });
                    setInventory(invMap);
                } else {
                    setInventory(new Map());
                }
            } catch {
                console.error('Error fetching event data:');
            } finally {
                setLoading(false);
            }
        };

        fetchEventData();
    }, [selectedEventId]);

    const getInventoryKey = (branchId: string, prizeId: string) => `${branchId}-${prizeId}`;

    const updateInventory = (branchId: string, prizeId: string, field: keyof InventoryItem, value: number | null) => {
        const key = getInventoryKey(branchId, prizeId);
        const current = inventory.get(key) || {
            branch_id: branchId,
            prize_id: prizeId,
            initial_quantity: 0,
            remaining_quantity: 0,
            weight_override: null,
        };

        const newInventory = new Map(inventory);
        newInventory.set(key, { ...current, [field]: value });
        setInventory(newInventory);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const items = Array.from(inventory.values());
            const response = await fetch('/api/admin/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            const data = await response.json();
            if (data.success) {
                alert('Đã lưu thành công!');
            } else {
                alert('Lỗi: ' + data.error);
            }
        } catch {
            alert('Lỗi khi lưu');
        } finally {
            setSaving(false);
        }
    };

    if (loading && events.length === 0) {
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
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý tồn kho</h1>
                    <p className="text-gray-600">Cấu hình số lượng quà cho từng chi nhánh theo sự kiện</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !selectedEventId || branches.length === 0 || prizes.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>

            {/* Event Selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <label className="text-sm font-medium text-gray-700">Chọn sự kiện:</label>
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">-- Chọn sự kiện --</option>
                        {events.map((event) => (
                            <option key={event.id} value={event.id}>
                                {event.name} {event.status === 'active' ? '(Đang chạy)' : `(${event.status})`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Empty States */}
            {!selectedEventId && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Vui lòng chọn một sự kiện để quản lý tồn kho</p>
                </div>
            )}

            {selectedEventId && events.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Chưa có sự kiện nào</p>
                    <p className="text-sm text-gray-500">
                        Vui lòng <a href="/admin/events/new" className="text-indigo-600 hover:underline">tạo sự kiện</a> trước
                    </p>
                </div>
            )}

            {selectedEventId && branches.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Chưa có chi nhánh nào</p>
                    <p className="text-sm text-gray-500">
                        Vui lòng <a href="/admin/branches" className="text-indigo-600 hover:underline">tạo chi nhánh</a> trước
                    </p>
                </div>
            )}

            {selectedEventId && prizes.length === 0 && branches.length > 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Sự kiện chưa có quà tặng</p>
                    <p className="text-sm text-gray-500">
                        Vui lòng <a href={`/admin/events/${selectedEventId}/edit`} className="text-indigo-600 hover:underline">thêm quà</a> cho sự kiện này
                    </p>
                </div>
            )}

            {/* Inventory Matrix */}
            {selectedEventId && branches.length > 0 && prizes.length > 0 && (
                <>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-900 z-10">
                                        Quà tặng
                                    </th>
                                    {branches.map((branch) => (
                                        <th
                                            key={branch.id}
                                            className="px-4 py-3 text-center text-sm font-semibold text-gray-900 min-w-[120px]"
                                        >
                                            {branch.code}
                                            <div className="font-normal text-xs text-gray-500">{branch.name}</div>
                                            <div className="font-normal text-xs text-indigo-600 mt-1">Còn lại / Tổng</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {prizes.map((prize) => (
                                    <tr key={prize.id} className="hover:bg-gray-50">
                                        <td className="sticky left-0 bg-white px-4 py-3 z-10">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded"
                                                    style={{ backgroundColor: prize.color }}
                                                />
                                                <span className="font-medium text-gray-900">{prize.name}</span>
                                            </div>
                                        </td>
                                        {branches.map((branch) => {
                                            const key = getInventoryKey(branch.id, prize.id);
                                            const item = inventory.get(key);
                                            const remaining = item?.remaining_quantity || 0;
                                            const initial = item?.initial_quantity || 0;
                                            const isLow = remaining > 0 && remaining <= initial * 0.2;

                                            return (
                                                <td key={branch.id} className="px-2 py-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                value={remaining || ''}
                                                                onChange={(e) =>
                                                                    updateInventory(
                                                                        branch.id,
                                                                        prize.id,
                                                                        'remaining_quantity',
                                                                        parseInt(e.target.value) || 0
                                                                    )
                                                                }
                                                                className={`w-16 px-2 py-1 text-center border rounded text-sm ${isLow ? 'border-orange-400 bg-orange-50' : 'border-gray-300'
                                                                    }`}
                                                                placeholder="0"
                                                            />
                                                            <span className="text-gray-400 text-xs">/</span>
                                                            <input
                                                                type="number"
                                                                value={initial || ''}
                                                                onChange={(e) =>
                                                                    updateInventory(
                                                                        branch.id,
                                                                        prize.id,
                                                                        'initial_quantity',
                                                                        parseInt(e.target.value) || 0
                                                                    )
                                                                }
                                                                className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        {isLow && (
                                                            <div className="flex items-center justify-center gap-1 text-orange-600 text-xs">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                Sắp hết
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex gap-2">
                            <Package className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium">Hướng dẫn:</p>
                                <ul className="list-disc ml-4 mt-1 space-y-1">
                                    <li>Số bên trái: Số lượng còn lại (tự động giảm khi khách trúng)</li>
                                    <li>Số bên phải: Số lượng ban đầu (total)</li>
                                    <li>Ô màu cam: Sắp hết quà (&lt;20%)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
