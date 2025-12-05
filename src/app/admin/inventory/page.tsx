'use client';

import { useEffect, useState } from 'react';
import { Package, Save, AlertTriangle, Calendar, Download, Upload, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

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

interface ImportPreviewRow {
    branch_code: string;
    prize_name: string;
    remaining_quantity: number;
    initial_quantity: number;
    branch_id?: string;
    prize_id?: string;
    status: 'valid' | 'warning' | 'error';
    message?: string;
    current_remaining?: number;
    current_initial?: number;
}

export default function InventoryPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [inventory, setInventory] = useState<Map<string, InventoryItem>>(new Map());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);

    // Import preview states
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<ImportPreviewRow[]>([]);
    const [importStatus, setImportStatus] = useState<'parsing' | 'ready' | 'importing' | 'done'>('ready');
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0, successCount: 0, errorCount: 0 });

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
                body: JSON.stringify({ items, event_id: selectedEventId }),
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

    const handleExport = () => {
        // Prepare data for Excel
        const data = [
            ['branch_code', 'prize_name', 'remaining_quantity', 'initial_quantity'],
        ];

        branches.forEach(branch => {
            prizes.forEach(prize => {
                const key = getInventoryKey(branch.id, prize.id);
                const item = inventory.get(key);
                data.push([
                    branch.code,
                    prize.name,
                    String(item?.remaining_quantity || 0),
                    String(item?.initial_quantity || 0),
                ]);
            });
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Set column widths
        ws['!cols'] = [
            { wch: 15 }, // branch_code
            { wch: 25 }, // prize_name
            { wch: 20 }, // remaining_quantity
            { wch: 18 }, // initial_quantity
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

        // Generate filename and download
        const eventName = events.find(e => e.id === selectedEventId)?.name || 'inventory';
        const filename = `inventory_${eventName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    const handleImport = async (file: File) => {
        setImportStatus('parsing');
        setShowPreview(true);
        setPreviewData([]);
        setImportProgress({ current: 0, total: 0, successCount: 0, errorCount: 0 });

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { header: 1 });

            if (jsonData.length < 2) {
                setPreviewData([]);
                setImportStatus('ready');
                return;
            }

            // Parse headers (first row)
            const headerRow = jsonData[0] as string[];
            const headers = headerRow.map(h => String(h || '').trim().toLowerCase());
            const branchCodeIdx = headers.indexOf('branch_code');
            const prizeNameIdx = headers.indexOf('prize_name');
            const remainingIdx = headers.indexOf('remaining_quantity');
            const initialIdx = headers.indexOf('initial_quantity');

            if (branchCodeIdx === -1 || prizeNameIdx === -1) {
                setPreviewData([]);
                setImportStatus('ready');
                return;
            }

            // Create lookup maps
            const branchMap = new Map(branches.map(b => [b.code.toLowerCase(), b]));
            const prizeMap = new Map(prizes.map(p => [p.name.toLowerCase().trim(), p]));

            // Parse and validate data rows
            const previewRows: ImportPreviewRow[] = [];
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i] as (string | number)[];
                if (!row || row.length === 0) continue;

                const branchCode = String(row[branchCodeIdx] || '').trim();
                const prizeName = String(row[prizeNameIdx] || '').trim();

                if (!branchCode || !prizeName) continue;

                const branch = branchMap.get(branchCode.toLowerCase());
                const prize = prizeMap.get(prizeName.toLowerCase());

                const newRemaining = parseInt(String(row[remainingIdx] || 0)) || 0;
                const newInitial = parseInt(String(row[initialIdx] || 0)) || 0;

                // Get current inventory values
                const invKey = branch && prize ? `${branch.id}-${prize.id}` : '';
                const currentInv = invKey ? inventory.get(invKey) : undefined;

                let status: 'valid' | 'warning' | 'error' = 'valid';
                let message = '';

                if (!branch) {
                    status = 'error';
                    message = `Chi nhánh "${branchCode}" không tồn tại`;
                } else if (!prize) {
                    status = 'error';
                    message = `Quà "${prizeName}" không tồn tại trong sự kiện này`;
                } else if (newRemaining > newInitial) {
                    status = 'warning';
                    message = 'Còn lại > Tổng';
                }

                previewRows.push({
                    branch_code: branchCode,
                    prize_name: prizeName,
                    remaining_quantity: newRemaining,
                    initial_quantity: newInitial,
                    branch_id: branch?.id,
                    prize_id: prize?.id,
                    status,
                    message,
                    current_remaining: currentInv?.remaining_quantity,
                    current_initial: currentInv?.initial_quantity,
                });
            }

            setPreviewData(previewRows);
            setImportProgress({ current: 0, total: previewRows.filter(r => r.status !== 'error').length, successCount: 0, errorCount: 0 });
            setImportStatus('ready');
        } catch (error) {
            console.error('Parse error:', error);
            setImportStatus('ready');
        }
    };

    const handleConfirmImport = async () => {
        const validRows = previewData.filter(r => r.status !== 'error');
        if (validRows.length === 0) return;

        setImportStatus('importing');
        setImportProgress({ current: 0, total: validRows.length, successCount: 0, errorCount: 0 });

        let successCount = 0;
        let errorCount = 0;

        // Process in batches for progress updates
        const batchSize = 5;
        for (let i = 0; i < validRows.length; i += batchSize) {
            const batch = validRows.slice(i, i + batchSize);

            const response = await fetch('/api/admin/inventory/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rows: batch.map(r => ({
                        branch_code: r.branch_code,
                        prize_name: r.prize_name,
                        remaining_quantity: r.remaining_quantity,
                        initial_quantity: r.initial_quantity,
                    })),
                    event_id: selectedEventId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                successCount += data.data.successCount;
                errorCount += data.data.errorCount;
            } else {
                errorCount += batch.length;
            }

            setImportProgress({
                current: Math.min(i + batchSize, validRows.length),
                total: validRows.length,
                successCount,
                errorCount,
            });

            // Small delay for UI update
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        setImportStatus('done');

        // Refresh inventory data
        const inventoryResponse = await fetch(`/api/admin/inventory?event_id=${selectedEventId}`);
        const inventoryData = await inventoryResponse.json();
        if (inventoryData.success && inventoryData.data) {
            const invMap = new Map<string, InventoryItem>();
            inventoryData.data.forEach((item: InventoryItem & { id?: string }) => {
                const key = `${item.branch_id}-${item.prize_id}`;
                invMap.set(key, item);
            });
            setInventory(invMap);
        }
    };

    const closePreview = () => {
        setShowPreview(false);
        setPreviewData([]);
        setImportStatus('ready');
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
                <div className="flex items-center gap-2">
                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        disabled={!selectedEventId || branches.length === 0 || prizes.length === 0}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        title="Export ra file CSV"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>

                    {/* Import Button */}
                    <label
                        className={`flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer ${!selectedEventId || importing ? 'opacity-50 pointer-events-none' : ''
                            }`}
                        title="Import từ file Excel (.xlsx)"
                    >
                        <Upload className="w-4 h-4" />
                        {importing ? 'Đang import...' : 'Import'}
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            disabled={!selectedEventId || importing}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    handleImport(file);
                                    e.target.value = ''; // Reset file input
                                }
                            }}
                        />
                    </label>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedEventId || branches.length === 0 || prizes.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
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

            {/* Import Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Xem trước Import</h2>
                                <p className="text-sm text-gray-500">
                                    {importStatus === 'parsing' && 'Đang đọc file...'}
                                    {importStatus === 'ready' && `${previewData.length} dòng dữ liệu`}
                                    {importStatus === 'importing' && 'Đang import...'}
                                    {importStatus === 'done' && 'Hoàn tất!'}
                                </p>
                            </div>
                            {importStatus !== 'importing' && (
                                <button onClick={closePreview} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>

                        {/* Progress Bar */}
                        {(importStatus === 'importing' || importStatus === 'done') && (
                            <div className="px-4 py-3 bg-gray-50 border-b">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-600">
                                        {importStatus === 'importing' ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Đang xử lý {importProgress.current}/{importProgress.total}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-green-600">
                                                <CheckCircle className="w-4 h-4" />
                                                Hoàn tất
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-gray-600">
                                        ✅ {importProgress.successCount} | ❌ {importProgress.errorCount}
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${importStatus === 'done' ? 'bg-green-500' : 'bg-indigo-600'}`}
                                        style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        <div className="flex-1 overflow-auto p-4">
                            {importStatus === 'parsing' ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                </div>
                            ) : previewData.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    Không có dữ liệu hoặc file không đúng format
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-gray-600">Trạng thái</th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-600">Chi nhánh</th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-600">Quà</th>
                                            <th className="px-3 py-2 text-center font-medium text-gray-600">Hiện tại</th>
                                            <th className="px-3 py-2 text-center font-medium text-gray-600">→</th>
                                            <th className="px-3 py-2 text-center font-medium text-gray-600">Mới</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {previewData.map((row, idx) => (
                                            <tr key={idx} className={row.status === 'error' ? 'bg-red-50' : row.status === 'warning' ? 'bg-yellow-50' : ''}>
                                                <td className="px-3 py-2">
                                                    {row.status === 'valid' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                                    {row.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                                    {row.status === 'error' && (
                                                        <span className="flex items-center gap-1">
                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                            <span className="text-xs text-red-600">{row.message}</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 font-medium">{row.branch_code}</td>
                                                <td className="px-3 py-2">{row.prize_name}</td>
                                                <td className="px-3 py-2 text-center text-gray-500">
                                                    {row.current_remaining ?? '-'} / {row.current_initial ?? '-'}
                                                </td>
                                                <td className="px-3 py-2 text-center text-gray-400">→</td>
                                                <td className="px-3 py-2 text-center font-medium">
                                                    <span className={row.status === 'warning' ? 'text-yellow-700' : ''}>
                                                        {row.remaining_quantity} / {row.initial_quantity}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                            <div className="text-sm text-gray-600">
                                {previewData.length > 0 && (
                                    <>
                                        <span className="inline-flex items-center gap-1 mr-3">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            {previewData.filter(r => r.status === 'valid').length} hợp lệ
                                        </span>
                                        <span className="inline-flex items-center gap-1 mr-3">
                                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                            {previewData.filter(r => r.status === 'warning').length} cảnh báo
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <XCircle className="w-4 h-4 text-red-500" />
                                            {previewData.filter(r => r.status === 'error').length} lỗi
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {importStatus === 'done' ? (
                                    <button
                                        onClick={closePreview}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Đóng
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={closePreview}
                                            disabled={importStatus === 'importing'}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleConfirmImport}
                                            disabled={importStatus !== 'ready' || previewData.filter(r => r.status !== 'error').length === 0}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {importStatus === 'importing' && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Xác nhận Import
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
