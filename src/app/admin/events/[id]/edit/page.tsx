'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface PrizeInput {
    id: string;
    name: string;
    prize_type: 'voucher' | 'physical' | 'discount' | 'no_prize';
    value: string;
    description: string;
    default_weight: string;
    color: string;
}

interface RuleInput {
    min_invoice_total: string;
    turn_formula_type: 'fixed' | 'step';
    fixed_turns: string;
    steps: { min: string; max: string; turns: string }[];
}

const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Basic info
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState<'draft' | 'active' | 'paused' | 'ended'>('draft');

    // Rules
    const [rules, setRules] = useState<RuleInput>({
        min_invoice_total: '500000',
        turn_formula_type: 'fixed',
        fixed_turns: '1',
        steps: [
            { min: '500000', max: '999999', turns: '1' },
            { min: '1000000', max: '', turns: '2' },
        ],
    });

    // Prizes
    const [prizes, setPrizes] = useState<PrizeInput[]>([]);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await fetch(`/api/admin/events/${eventId}`);
                const data = await response.json();

                if (data.success && data.data) {
                    const event = data.data;
                    setName(event.name || '');
                    setSlug(event.slug || '');
                    setDescription(event.description || '');
                    setStartDate(event.start_date?.split('T')[0] || '');
                    setEndDate(event.end_date?.split('T')[0] || '');
                    setStatus(event.status || 'draft');

                    // Load rules
                    if (event.event_rules && event.event_rules.length > 0) {
                        const rule = event.event_rules[0];
                        setRules({
                            min_invoice_total: String(rule.min_invoice_total || 500000),
                            turn_formula_type: rule.turn_formula?.type || 'fixed',
                            fixed_turns: String(rule.turn_formula?.fixed_turns || 1),
                            steps: rule.turn_formula?.steps || [
                                { min: '500000', max: '999999', turns: '1' },
                                { min: '1000000', max: '', turns: '2' },
                            ],
                        });
                    }

                    // Load prizes
                    if (event.event_prizes && event.event_prizes.length > 0) {
                        setPrizes(event.event_prizes.map((p: { id: string; name: string; prize_type: string; value: number; description: string; default_weight: number; color: string }) => ({
                            id: p.id,
                            name: p.name || '',
                            prize_type: p.prize_type || 'voucher',
                            value: String(p.value || 0),
                            description: p.description || '',
                            default_weight: String(p.default_weight || 0),
                            color: p.color || '#3B82F6',
                        })));
                    }
                }
            } catch {
                console.error('Error fetching event:');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    const addPrize = () => {
        const newId = Date.now().toString();
        const colorIndex = prizes.length % defaultColors.length;
        setPrizes([
            ...prizes,
            {
                id: newId,
                name: '',
                prize_type: 'voucher',
                value: '',
                description: '',
                default_weight: '10',
                color: defaultColors[colorIndex],
            },
        ]);
    };

    const removePrize = (id: string) => {
        setPrizes(prizes.filter((p) => p.id !== id));
    };

    const updatePrize = (id: string, field: keyof PrizeInput, value: string) => {
        setPrizes(prizes.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    };

    const addStep = () => {
        setRules({
            ...rules,
            steps: [...rules.steps, { min: '', max: '', turns: '' }],
        });
    };

    const removeStep = (idx: number) => {
        setRules({
            ...rules,
            steps: rules.steps.filter((_, i) => i !== idx),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch(`/api/admin/events/${eventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    slug,
                    description,
                    start_date: startDate,
                    end_date: endDate,
                    status,
                    prizes: prizes.map(p => ({
                        id: p.id, // Preserve prize ID
                        name: p.name,
                        prize_type: p.prize_type,
                        value: p.value,
                        description: p.description,
                        default_weight: p.default_weight,
                        color: p.color,
                    })),
                }),
            });

            const data = await response.json();

            if (data.success) {
                router.push('/admin/events');
            } else {
                alert('Lỗi: ' + data.error);
                setSaving(false);
            }
        } catch {
            alert('Lỗi khi cập nhật sự kiện');
            setSaving(false);
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
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/admin/events"
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sự kiện</h1>
                    <p className="text-gray-600">{name}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tên sự kiện *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Slug (URL)
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">
                                    /spin/
                                </span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trạng thái
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as typeof status)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="draft">Nháp</option>
                                <option value="active">Đang chạy</option>
                                <option value="paused">Tạm dừng</option>
                                <option value="ended">Kết thúc</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ngày bắt đầu
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ngày kết thúc
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>
                </section>

                {/* Rules */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Điều kiện tham gia</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Giá trị hóa đơn tối thiểu
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={rules.min_invoice_total}
                                    onChange={(e) => setRules({ ...rules, min_invoice_total: e.target.value })}
                                    className="w-48 px-4 py-2 border border-gray-300 rounded-lg"
                                />
                                <span className="text-gray-500">VNĐ</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cách tính số lượt quay
                            </label>
                            <div className="flex gap-4 mb-3">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="turn_formula"
                                        checked={rules.turn_formula_type === 'fixed'}
                                        onChange={() => setRules({ ...rules, turn_formula_type: 'fixed' })}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    <span>Cố định</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="turn_formula"
                                        checked={rules.turn_formula_type === 'step'}
                                        onChange={() => setRules({ ...rules, turn_formula_type: 'step' })}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    <span>Theo bậc thang</span>
                                </label>
                            </div>

                            {rules.turn_formula_type === 'fixed' ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={rules.fixed_turns}
                                        onChange={(e) => setRules({ ...rules, fixed_turns: e.target.value })}
                                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg"
                                        min="1"
                                    />
                                    <span className="text-gray-500">lượt / hóa đơn</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {rules.steps.map((step, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={step.min}
                                                onChange={(e) => {
                                                    const newSteps = [...rules.steps];
                                                    newSteps[idx].min = e.target.value;
                                                    setRules({ ...rules, steps: newSteps });
                                                }}
                                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                placeholder="Từ"
                                            />
                                            <span className="text-gray-400">-</span>
                                            <input
                                                type="number"
                                                value={step.max}
                                                onChange={(e) => {
                                                    const newSteps = [...rules.steps];
                                                    newSteps[idx].max = e.target.value;
                                                    setRules({ ...rules, steps: newSteps });
                                                }}
                                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                placeholder="Đến (∞)"
                                            />
                                            <span className="text-gray-400">→</span>
                                            <input
                                                type="number"
                                                value={step.turns}
                                                onChange={(e) => {
                                                    const newSteps = [...rules.steps];
                                                    newSteps[idx].turns = e.target.value;
                                                    setRules({ ...rules, steps: newSteps });
                                                }}
                                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                placeholder="Lượt"
                                            />
                                            <span className="text-gray-500 text-sm">lượt</span>
                                            {rules.steps.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeStep(idx)}
                                                    className="p-1 text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addStep}
                                        className="text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        + Thêm bậc
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Prizes */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Danh sách quà</h2>
                        <button
                            type="button"
                            onClick={addPrize}
                            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm quà
                        </button>
                    </div>

                    <div className="space-y-3">
                        {prizes.map((prize) => (
                            <div
                                key={prize.id}
                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                                <input
                                    type="color"
                                    value={prize.color}
                                    onChange={(e) => updatePrize(prize.id, 'color', e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer flex-shrink-0"
                                />
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                                    <input
                                        type="text"
                                        value={prize.name}
                                        onChange={(e) => updatePrize(prize.id, 'name', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Tên quà"
                                    />
                                    <select
                                        value={prize.prize_type}
                                        onChange={(e) => updatePrize(prize.id, 'prize_type', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="voucher">Voucher</option>
                                        <option value="physical">Quà vật lý</option>
                                        <option value="discount">Giảm giá</option>
                                        <option value="no_prize">Không trúng</option>
                                    </select>
                                    {prize.prize_type === 'voucher' || prize.prize_type === 'discount' ? (
                                        <input
                                            type="number"
                                            value={prize.value}
                                            onChange={(e) => updatePrize(prize.id, 'value', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Giá trị (VNĐ)"
                                        />
                                    ) : prize.prize_type === 'physical' ? (
                                        <input
                                            type="text"
                                            value={prize.description}
                                            onChange={(e) => updatePrize(prize.id, 'description', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Mô tả quà"
                                        />
                                    ) : (
                                        <div />
                                    )}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={prize.default_weight}
                                            onChange={(e) => updatePrize(prize.id, 'default_weight', e.target.value)}
                                            className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-center"
                                            min="0"
                                        />
                                        <span className="text-gray-500 text-sm">%</span>
                                        <button
                                            type="button"
                                            onClick={() => removePrize(prize.id)}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg ml-auto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Tổng tỉ lệ:{' '}
                            <span
                                className={`font-semibold ${prizes.reduce((sum, p) => sum + parseInt(p.default_weight || '0'), 0) !== 100
                                    ? 'text-orange-600'
                                    : 'text-green-600'
                                    }`}
                            >
                                {prizes.reduce((sum, p) => sum + parseInt(p.default_weight || '0'), 0)}%
                            </span>
                        </p>
                    </div>
                </section>

                {/* Submit */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href="/admin/events"
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        Hủy
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    );
}
