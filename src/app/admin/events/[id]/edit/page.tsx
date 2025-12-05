'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, ImagePlus, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PrizeInput {
    id: string;
    name: string;
    prize_type: 'voucher' | 'physical' | 'discount' | 'no_prize';
    value: string;
    description: string;
    default_weight: string;
    color: string;
    text_color: string;
    text_effect: 'none' | 'shadow' | 'outline' | 'glow' | 'gold';
    voucher_campaign_id: string;
    image_url: string;
}

interface VoucherCampaign {
    id: string;
    name: string;
    value: number;
    code: string;
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
    const [uploadingPrizeId, setUploadingPrizeId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Voucher Campaigns
    const [voucherCampaigns, setVoucherCampaigns] = useState<VoucherCampaign[]>([]);

    // Prize display mode
    const [prizeDisplayMode, setPrizeDisplayMode] = useState<'both' | 'image' | 'text'>('both');

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

                    // Load theme config
                    if (event.theme_config?.prize_display_mode) {
                        setPrizeDisplayMode(event.theme_config.prize_display_mode);
                    }

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
                        setPrizes(event.event_prizes.map((p: { id: string; name: string; prize_type: string; value: number; description: string; default_weight: number; color: string; text_color?: string; text_effect?: string; voucher_campaign_id?: string; image_url?: string }) => ({
                            id: p.id,
                            name: p.name || '',
                            prize_type: p.prize_type || 'voucher',
                            value: String(p.value || 0),
                            description: p.description || '',
                            default_weight: String(p.default_weight || 0),
                            color: p.color || '#3B82F6',
                            text_color: p.text_color || '#ffffff',
                            text_effect: (p.text_effect as PrizeInput['text_effect']) || 'none',
                            voucher_campaign_id: p.voucher_campaign_id || '',
                            image_url: p.image_url || '',
                        })));
                    }

                    // Fetch voucher campaigns
                    const campaignsRes = await fetch('/api/admin/voucher-campaigns');
                    const campaignsData = await campaignsRes.json();
                    if (campaignsData.success) {
                        setVoucherCampaigns(campaignsData.data);
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
                text_color: '#ffffff',
                text_effect: 'none',
                voucher_campaign_id: '',
                image_url: '',
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

    const handleImageUpload = async (prizeId: string, file: File) => {
        setUploadingPrizeId(prizeId);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                updatePrize(prizeId, 'image_url', data.data.url);
            } else {
                alert(data.error || 'Lỗi upload ảnh');
            }
        } catch {
            alert('Đã xảy ra lỗi khi upload ảnh');
        } finally {
            setUploadingPrizeId(null);
        }
    };

    const removeImage = (prizeId: string) => {
        updatePrize(prizeId, 'image_url', '');
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
                    theme_config: {
                        prize_display_mode: prizeDisplayMode,
                    },
                    rules: {
                        min_invoice_total: rules.min_invoice_total,
                        turn_formula_type: rules.turn_formula_type,
                        fixed_turns: rules.fixed_turns,
                        steps: rules.steps,
                    },
                    prizes: prizes.map(p => ({
                        id: p.id,
                        name: p.name,
                        prize_type: p.prize_type,
                        value: p.value,
                        description: p.description,
                        default_weight: p.default_weight,
                        color: p.color,
                        text_color: p.text_color,
                        text_effect: p.text_effect,
                        voucher_campaign_id: p.voucher_campaign_id || null,
                        image_url: p.image_url || null,
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
        <div className="max-w-6xl mx-auto">
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
                                Mô tả
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="VD: Chào đón Giáng sinh 2024"
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
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold text-gray-900">Danh sách quà</h2>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-500">Hiển thị:</label>
                                <select
                                    value={prizeDisplayMode}
                                    onChange={(e) => setPrizeDisplayMode(e.target.value as 'both' | 'image' | 'text')}
                                    className="text-xs px-2 py-1 border border-gray-300 rounded-lg"
                                >
                                    <option value="both">Ảnh + Text</option>
                                    <option value="image">Chỉ ảnh</option>
                                    <option value="text">Chỉ text</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={addPrize}
                            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm quà
                        </button>
                    </div>

                    {/* Column Headers */}
                    <div className="grid grid-cols-[50px_40px_140px_100px_1fr_80px_40px] gap-2 px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 mb-2">
                        <div>Ảnh</div>
                        <div></div>
                        <div>Tên quà</div>
                        <div>Loại</div>
                        <div>Đợt phát hành / Mô tả</div>
                        <div className="text-center">Tỉ lệ</div>
                        <div></div>
                    </div>

                    <div className="space-y-2">
                        {prizes.map((prize) => (
                            <div
                                key={prize.id}
                                className="grid grid-cols-[50px_40px_40px_80px_140px_100px_1fr_80px_40px] gap-2 items-center p-2 bg-gray-50 rounded-lg"
                            >
                                {/* Image Upload */}
                                <div className="relative group">
                                    {prize.image_url ? (
                                        <div className="relative w-12 h-12">
                                            <Image
                                                src={prize.image_url}
                                                alt={prize.name}
                                                width={48}
                                                height={48}
                                                className="w-12 h-12 object-cover rounded-lg border border-gray-300 cursor-pointer transition hover:opacity-80"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(prize.id)}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            {/* Hover Preview */}
                                            <div className="hidden group-hover:block absolute left-full ml-2 top-0 z-50 pointer-events-none">
                                                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-1">
                                                    <Image
                                                        src={prize.image_url}
                                                        alt={prize.name}
                                                        width={120}
                                                        height={120}
                                                        className="w-28 h-28 object-cover rounded-lg"
                                                    />
                                                    <p className="text-xs text-center text-gray-500 mt-1 px-1 truncate max-w-28">{prize.name || 'Ảnh quà'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition">
                                            {uploadingPrizeId === prize.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                            ) : (
                                                <ImagePlus className="w-4 h-4 text-gray-400" />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageUpload(prize.id, file);
                                                }}
                                                disabled={uploadingPrizeId === prize.id}
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* Segment Color */}
                                <div className="flex flex-col items-center gap-0.5">
                                    <input
                                        type="color"
                                        value={prize.color}
                                        onChange={(e) => updatePrize(prize.id, 'color', e.target.value)}
                                        className="w-8 h-6 rounded cursor-pointer"
                                        title="Màu segment"
                                    />
                                    <span className="text-[9px] text-gray-400">Nền</span>
                                </div>

                                {/* Text Color */}
                                <div className="flex flex-col items-center gap-0.5">
                                    <input
                                        type="color"
                                        value={prize.text_color}
                                        onChange={(e) => updatePrize(prize.id, 'text_color', e.target.value)}
                                        className="w-8 h-6 rounded cursor-pointer"
                                        title="Màu chữ"
                                    />
                                    <span className="text-[9px] text-gray-400">Chữ</span>
                                </div>

                                {/* Text Effect */}
                                <select
                                    value={prize.text_effect}
                                    onChange={(e) => updatePrize(prize.id, 'text_effect', e.target.value)}
                                    className="w-20 px-1 py-1 border border-gray-300 rounded text-xs"
                                    title="Hiệu ứng chữ"
                                >
                                    <option value="none">Thường</option>
                                    <option value="shadow">Đổ bóng</option>
                                    <option value="outline">Viền đen</option>
                                    <option value="glow">Phát sáng</option>
                                    <option value="gold">Vàng kim</option>
                                </select>
                                <input
                                    type="text"
                                    value={prize.name}
                                    onChange={(e) => updatePrize(prize.id, 'name', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Tên quà"
                                />
                                <select
                                    value={prize.prize_type}
                                    onChange={(e) => updatePrize(prize.id, 'prize_type', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="voucher">Voucher</option>
                                    <option value="physical">Quà vật lý</option>
                                    <option value="discount">Giảm giá</option>
                                    <option value="no_prize">Không trúng</option>
                                </select>
                                <div className="min-w-0">
                                    {prize.prize_type === 'voucher' ? (
                                        <div className="flex items-center gap-1">
                                            <select
                                                value={prize.voucher_campaign_id}
                                                onChange={(e) => updatePrize(prize.id, 'voucher_campaign_id', e.target.value)}
                                                className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-lg text-sm truncate"
                                            >
                                                <option value="">-- Chọn đợt PH --</option>
                                                {voucherCampaigns.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.code} - {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {prize.voucher_campaign_id && (
                                                <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                                    {new Intl.NumberFormat('vi-VN').format(
                                                        voucherCampaigns.find(c => c.id === prize.voucher_campaign_id)?.value || 0
                                                    )}đ
                                                </span>
                                            )}
                                        </div>
                                    ) : prize.prize_type === 'discount' ? (
                                        <input
                                            type="number"
                                            value={prize.value}
                                            onChange={(e) => updatePrize(prize.id, 'value', e.target.value)}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                                            placeholder="Giá trị (VNĐ)"
                                        />
                                    ) : prize.prize_type === 'physical' ? (
                                        <input
                                            type="text"
                                            value={prize.description}
                                            onChange={(e) => updatePrize(prize.id, 'description', e.target.value)}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                                            placeholder="Mô tả quà"
                                        />
                                    ) : (
                                        <span className="text-gray-400 text-sm">—</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-center gap-0.5">
                                    <input
                                        type="number"
                                        value={prize.default_weight}
                                        onChange={(e) => updatePrize(prize.id, 'default_weight', e.target.value)}
                                        className="w-12 px-1 py-1.5 border border-gray-300 rounded-lg text-sm text-center"
                                        min="0"
                                    />
                                    <span className="text-gray-500 text-xs">%</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removePrize(prize.id)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
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
