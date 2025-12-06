'use client';

import { useState, useEffect, useCallback } from 'react';
import SpinWheel from '@/components/SpinWheel';
import InvoiceForm from '@/components/InvoiceForm';
import { Gift, Sparkles, Trophy, RotateCcw, ChevronLeft, ChevronRight, History, TreePine, ChevronDown } from 'lucide-react';

interface Prize {
    id: string;
    name: string;
    color: string;
    image_url?: string | null;
    text_color?: string;
    text_effect?: 'none' | 'shadow' | 'outline' | 'glow' | 'gold';
    type: string;
}

interface EventData {
    id: string;
    name: string;
    description?: string;
    prizes: Prize[];
    theme_config?: {
        background_color?: string;
        primary_color?: string;
        prize_display_mode?: 'both' | 'image' | 'text';
    };
}

interface ValidationResult {
    session_id: string;
    is_eligible: boolean;
    total_turns: number;
    remaining_turns: number;
    invoice_code: string;
    customer: {
        name: string | null;
        phone: string | null;
    };
    branch: {
        code: string;
        name: string;
    };
    invoice_total: number;
}

interface SpinHistoryItem {
    id: string;
    customer_name: string | null;
    branch_name: string;
    prize_id?: string;
    prize_name: string;
    prize_type: string;
    prize_value?: number | null;
    prize_description?: string | null;
    spun_at: string;
    voucher?: {
        code: string;
        value: number;
        expire_date: string;
        conditions: string | null;
    } | null;
}

interface HistoryPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// Snowflake component
const snowChars = ['❄', '❅', '❆', '✻', '✼', '❉'];
function Snowflake({ style, char }: { style: React.CSSProperties; char?: string }) {
    return (
        <div
            style={{
                position: 'fixed',
                top: '-30px',
                color: '#fff',
                textShadow: '0 0 5px rgba(255,255,255,0.9), 0 0 10px rgba(200,200,255,0.7)',
                zIndex: 50,
                pointerEvents: 'none',
                ...style,
            }}
        >
            {char || '❄'}
        </div>
    );
}

export default function SpinPage() {
    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [session, setSession] = useState<ValidationResult | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [targetIndex, setTargetIndex] = useState<number | null>(null);
    const [wonPrize, setWonPrize] = useState<Prize | null>(null);
    const [currentTurn, setCurrentTurn] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Voucher state
    const [voucherInfo, setVoucherInfo] = useState<{
        voucher_id: string;
        voucher_code: string;
        value: number;
        expire_date: string;
        conditions: string;
    } | null>(null);
    const [voucherEmail, setVoucherEmail] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // History state
    const [history, setHistory] = useState<SpinHistoryItem[]>([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPagination, setHistoryPagination] = useState<HistoryPagination | null>(null);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<SpinHistoryItem | null>(null);

    // Snowflakes
    const [snowflakes, setSnowflakes] = useState<{ id: number; char: string; style: React.CSSProperties }[]>([]);

    useEffect(() => {
        // Generate snowflakes with animation
        const flakes = Array.from({ length: 40 }, (_, i) => {
            const duration = Math.random() * 5 + 6; // 6-11s
            const delay = Math.random() * 5;
            const size = Math.random() * 12 + 14; // 14-26px

            return {
                id: i,
                char: snowChars[Math.floor(Math.random() * snowChars.length)],
                style: {
                    left: `${Math.random() * 100}%`,
                    fontSize: `${size}px`,
                    opacity: Math.random() * 0.4 + 0.6,
                    animation: `snowfall ${duration}s linear ${delay}s infinite`,
                },
            };
        });
        setSnowflakes(flakes);
    }, []);

    // Fetch history
    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const response = await fetch(`/api/spin/history?page=${historyPage}&limit=5`);
            const data = await response.json();
            if (data.success) {
                setHistory(data.data.logs);
                setHistoryPagination(data.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setHistoryLoading(false);
        }
    }, [historyPage]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Fetch active event
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await fetch('/api/event');
                const data = await response.json();

                if (data.success) {
                    setEvent(data.data);
                } else {
                    setError(data.error);
                }
            } catch {
                setError('Không thể tải thông tin sự kiện');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, []);

    const handleValidated = (result: ValidationResult) => {
        setSession(result);
        setCurrentTurn(result.total_turns - result.remaining_turns + 1);
    };

    const handleSpin = async () => {
        if (!session || isSpinning || !event) return;

        setIsSpinning(true);
        setShowResult(false);
        setWonPrize(null);

        try {
            const response = await fetch('/api/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: session.session_id,
                    turn_index: currentTurn,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setTargetIndex(data.data.prize_index);
                const prize = event.prizes.find(p => p.id === data.data.prize.id);
                setWonPrize(prize || data.data.prize);
                setSession(prev => prev ? {
                    ...prev,
                    remaining_turns: data.data.remaining_turns,
                } : null);

                // Store voucher info if present
                if (data.data.voucher) {
                    setVoucherInfo(data.data.voucher);
                }
            } else {
                alert(data.error);
                setIsSpinning(false);
            }
        } catch {
            alert('Đã xảy ra lỗi, vui lòng thử lại');
            setIsSpinning(false);
        }
    };

    const handleSpinComplete = () => {
        setIsSpinning(false);
        setShowResult(true);
        setCurrentTurn(prev => prev + 1);
        fetchHistory();
    };

    const handlePlayAgain = () => {
        setShowResult(false);
        setWonPrize(null);
        setTargetIndex(null);
        setVoucherInfo(null);
        setVoucherEmail('');
        setEmailSent(false);
    };

    const handleSendVoucherEmail = async () => {
        if (!voucherInfo || !voucherEmail) return;

        setSendingEmail(true);
        try {
            const response = await fetch('/api/voucher/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voucher_id: voucherInfo.voucher_id,
                    email: voucherEmail,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setEmailSent(true);
            } else {
                alert(data.error || 'Không thể gửi email');
            }
        } catch {
            alert('Đã xảy ra lỗi khi gửi email');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleNewInvoice = () => {
        setSession(null);
        setShowResult(false);
        setWonPrize(null);
        setTargetIndex(null);
        setCurrentTurn(0);
        // Reset voucher states to prevent email being sent to wrong voucher
        setVoucherInfo(null);
        setVoucherEmail('');
        setEmailSent(false);
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${hours}:${minutes} ${day}/${month}/${year}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-green-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p>Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-green-900 flex items-center justify-center p-4">
                <div className="text-center text-white bg-white/10 backdrop-blur rounded-2xl p-8 max-w-md border border-white/20">
                    <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h1 className="text-2xl font-bold mb-2">Chưa có sự kiện</h1>
                    <p className="text-white/70">{error || 'Hiện không có chương trình quay thưởng nào đang diễn ra.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0c1a0c] py-8 px-4 relative overflow-hidden">
            {/* Christmas gradient overlay */}
            <div className="fixed inset-0 bg-gradient-to-b from-red-950/80 via-transparent to-green-950/60 pointer-events-none z-0" />

            {/* Bokeh lights effect */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-20 left-10 w-32 h-32 bg-red-500/20 rounded-full blur-3xl" />
                <div className="absolute top-40 right-20 w-40 h-40 bg-green-500/15 rounded-full blur-3xl" />
                <div className="absolute bottom-40 left-1/4 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-1/3 w-36 h-36 bg-red-500/15 rounded-full blur-3xl" />
            </div>

            {/* Snowfall */}
            <div className="fixed inset-0 pointer-events-none z-[5]">
                {snowflakes.map((flake) => (
                    <Snowflake key={flake.id} style={flake.style} char={flake.char} />
                ))}
            </div>

            {/* Christmas decorations */}
            <div className="fixed bottom-0 left-2 text-5xl sm:text-7xl opacity-40 z-0">🎄</div>
            <div className="fixed bottom-0 right-2 text-5xl sm:text-7xl opacity-40 z-0">🎄</div>
            <div className="fixed top-10 left-10 text-2xl opacity-50 z-0 animate-pulse">⭐</div>
            <div className="fixed top-20 right-16 text-xl opacity-40 z-0 animate-pulse" style={{ animationDelay: '0.5s' }}>✨</div>
            <div className="fixed bottom-32 left-8 text-xl opacity-30 z-0">🎁</div>
            <div className="fixed bottom-24 right-12 text-xl opacity-30 z-0">🎁</div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <TreePine className="w-6 h-6 text-green-400 hidden sm:block" />
                        <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                            🎅 {event.name} 🎁
                        </h1>
                        <TreePine className="w-6 h-6 text-green-400 hidden sm:block" />
                    </div>
                    {event.description && (
                        <p className="text-yellow-200/90 text-sm sm:text-base mt-1">{event.description}</p>
                    )}
                    <div className="flex justify-center gap-1 sm:gap-2 mt-2">
                        <span className="text-lg sm:text-2xl">❄️</span>
                        <span className="text-lg sm:text-2xl">🎄</span>
                        <span className="text-lg sm:text-2xl">⭐</span>
                        <span className="text-lg sm:text-2xl">🎄</span>
                        <span className="text-lg sm:text-2xl">❄️</span>
                    </div>
                </div>

                {/* Invoice Form or Session Info */}
                {!session ? (
                    <div className="mb-6">
                        <p className="text-center text-sm sm:text-base text-yellow-100 mb-3">
                            🎁 Nhập mã hóa đơn để tra cứu 🎁
                        </p>
                        <InvoiceForm onValidated={handleValidated} />
                    </div>
                ) : (
                    <div className="mb-6">
                        {/* Compact customer info with inline reset button */}
                        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-white/10 backdrop-blur rounded-lg px-4 py-2 border border-yellow-400/30 text-xs sm:text-sm">
                            <span className="text-yellow-200 font-semibold">🎅 {session.customer.name || 'Khách hàng'}</span>
                            <span className="text-white/40">|</span>
                            <span className="text-white font-mono">{session.invoice_code}</span>
                            <span className="text-white/40">|</span>
                            <span className="text-green-300 font-semibold">{new Intl.NumberFormat('vi-VN').format(session.invoice_total)}đ</span>
                            <span className="text-white/40">|</span>
                            <span className="text-white">{session.branch.name}</span>
                            <span className="text-white/40">|</span>
                            <span className="text-yellow-300 font-bold">🎁 {session.remaining_turns} lượt</span>
                            <span className="text-white/40">|</span>
                            <button
                                onClick={handleNewInvoice}
                                className="text-white/70 hover:text-white flex items-center gap-1 transition"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Tra cứu lại</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Spin Wheel */}
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-3xl scale-110" />
                        <SpinWheel
                            key={session?.session_id || 'default'}
                            prizes={event.prizes}
                            isSpinning={isSpinning}
                            targetIndex={targetIndex}
                            onSpinComplete={handleSpinComplete}
                            canSpin={!!session && session.remaining_turns > 0 && !showResult}
                            onSpin={handleSpin}
                            prizeDisplayMode={event.theme_config?.prize_display_mode || 'both'}
                        />
                    </div>

                    {/* No more turns */}
                    {session && session.remaining_turns === 0 && !showResult && (
                        <div className="text-center">
                            <p className="text-yellow-100/70 mb-4">Bạn đã hết lượt quay cho hóa đơn này</p>
                            <button
                                onClick={handleNewInvoice}
                                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition border border-white/30"
                            >
                                🎁 Nhập hóa đơn khác
                            </button>
                        </div>
                    )}
                </div>

                {/* Spin History */}
                <div className="mt-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <History className="w-5 h-5 text-yellow-400" />
                        <h2 className="text-xl font-bold text-white">🎄 Lịch sử quay thưởng</h2>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl overflow-hidden border border-green-500/30">
                        <table className="w-full text-sm">
                            <thead className="bg-green-900/50">
                                <tr>
                                    <th className="px-3 py-3 text-left text-yellow-200 font-medium w-24">Thời gian</th>
                                    <th className="px-3 py-3 text-left text-yellow-200 font-medium hidden sm:table-cell">Chi nhánh</th>
                                    <th className="px-3 py-3 text-left text-yellow-200 font-medium">Khách hàng</th>
                                    <th className="px-3 py-3 text-left text-yellow-200 font-medium">Quà tặng 🎁</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {historyLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                                <span>Đang tải...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                                            🎄 Chưa có lượt quay nào
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/5">
                                            <td className="px-3 py-3 text-white/70 text-xs whitespace-nowrap">{formatDateTime(item.spun_at)}</td>
                                            <td className="px-3 py-3 text-white/70 hidden sm:table-cell max-w-[80px] truncate">{item.branch_name}</td>
                                            <td className="px-3 py-3 text-white max-w-[80px] truncate">{item.customer_name || 'Khách'}</td>
                                            <td className="px-3 py-3">
                                                <button
                                                    onClick={() => item.prize_type !== 'no_prize' && setSelectedHistoryItem(item)}
                                                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium max-w-[100px] truncate ${item.prize_type === 'no_prize'
                                                        ? 'bg-gray-500/30 text-gray-300'
                                                        : 'bg-red-500/30 text-yellow-200 hover:bg-red-500/50 cursor-pointer'
                                                        }`}
                                                >
                                                    {item.prize_type === 'no_prize' ? '❄️' : '🎁'} {item.prize_name}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {historyPagination && historyPagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 p-4 border-t border-white/10">
                                <button
                                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                    disabled={historyPage === 1}
                                    className="p-2 text-white/70 hover:text-white disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-white/70 text-sm">
                                    Trang {historyPage} / {historyPagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setHistoryPage(p => Math.min(historyPagination.totalPages, p + 1))}
                                    disabled={historyPage === historyPagination.totalPages}
                                    className="p-2 text-white/70 hover:text-white disabled:opacity-30"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Result Modal - Bottom Sheet */}
                {showResult && wonPrize && (
                    <div
                        className="fixed inset-0 z-50 flex items-end justify-center bg-[#1a472a]/90"
                        onClick={(e) => e.target === e.currentTarget && (session && session.remaining_turns > 0 ? handlePlayAgain() : handleNewInvoice())}
                    >
                        <div className="w-full max-w-md mx-auto animate-slide-up">
                            {/* Main modal with green gradient header */}
                            <div className="bg-gradient-to-b from-green-100 via-white to-white rounded-t-3xl overflow-hidden shadow-2xl relative">
                                {/* Close button */}
                                <button
                                    onClick={session && session.remaining_turns > 0 ? handlePlayAgain : handleNewInvoice}
                                    className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition z-10"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>

                                {/* Corner decorations */}
                                <div className="absolute top-3 left-3 text-2xl">🎄</div>
                                <div className="absolute top-2 right-14 text-lg">❄️</div>

                                {/* Content */}
                                <div className="p-6 pt-10">
                                    {/* Header */}
                                    <div className="text-center mb-5">
                                        <p className="text-gray-600 text-sm mb-2">🎄Mắt Kính Tâm Đức</p>
                                        <h2 className="text-2xl font-bold italic mb-2">
                                            <span className="text-red-500">MERRY</span>{' '}
                                            <span className="text-green-600">CHRISTMAS</span>{' '}
                                            <span>🎄</span>
                                        </h2>
                                    </div>

                                    {wonPrize.type === 'no_prize' ? (
                                        <>
                                            <p className="text-green-600 font-semibold text-center mb-4">Chúc bạn may mắn lần sau!</p>
                                            <div className="text-6xl text-center mb-4">❄️</div>
                                        </>
                                    ) : wonPrize.type === 'voucher' && voucherInfo ? (
                                        <>
                                            <div className="text-center mb-4">
                                                <p className="text-green-600 font-semibold">Bạn nhận được</p>
                                                <p className="text-2xl font-bold text-red-500 drop-shadow-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>{wonPrize.name}</p>
                                            </div>

                                            {/* Voucher Code Card */}
                                            <div className="bg-white border-2 border-dashed border-amber-400 rounded-2xl p-4 mb-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-4xl">🎅</div>
                                                    <div className="flex-1">
                                                        <p className="text-gray-400 text-sm mb-2">Mã ưu đãi độc quyền</p>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-wider">
                                                                {voucherInfo.voucher_code}
                                                            </p>
                                                            <button
                                                                onClick={() => navigator.clipboard.writeText(voucherInfo.voucher_code)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-md"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                                Copy
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Voucher Details */}
                                            <div className="bg-green-50 rounded-2xl p-4 mb-4 space-y-3">
                                                <div className="flex items-center gap-3 text-gray-700">
                                                    <span className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472a4.265 4.265 0 01.264-.521z" clipRule="evenodd" fillRule="evenodd" /></svg>
                                                    </span>
                                                    <span>Trị giá:</span>
                                                    <span className="font-bold text-red-500">{new Intl.NumberFormat('vi-VN').format(voucherInfo.value)}đ</span>
                                                </div>
                                                {voucherInfo.expire_date && (
                                                    <div className="flex items-center gap-3 text-gray-700">
                                                        <span className="w-7 h-7 bg-gray-300 rounded flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        </span>
                                                        <span>Hết hạn:</span>
                                                        <span className="font-bold">{new Date(voucherInfo.expire_date).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                )}
                                                {voucherInfo.conditions && (
                                                    <div className="flex items-start gap-3 text-gray-600">
                                                        <span className="w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                                        </span>
                                                        <span>{voucherInfo.conditions}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Email Form */}
                                            <div className="mb-4">
                                                <p className="text-gray-700 font-semibold mb-2">Nhận voucher qua email:</p>
                                                {!emailSent ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="email"
                                                            value={voucherEmail}
                                                            onChange={(e) => setVoucherEmail(e.target.value)}
                                                            placeholder="Nhập email của bạn..."
                                                            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder:text-gray-400 focus:border-green-500 focus:outline-none"
                                                        />
                                                        <button
                                                            onClick={handleSendVoucherEmail}
                                                            disabled={!voucherEmail || sendingEmail}
                                                            className="px-5 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 transition font-semibold flex items-center gap-1"
                                                        >
                                                            {sendingEmail ? '...' : 'Gửi'}
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-green-100 rounded-xl border border-green-300 text-center">
                                                        <p className="text-green-700 text-sm">Đã gửi voucher đến email của bạn!</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Physical Prize */}
                                            <div className="text-center mb-4">
                                                <p className="text-green-600 font-semibold">Bạn nhận được</p>
                                                <p className="text-2xl font-bold text-red-500 drop-shadow-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>{wonPrize.name}</p>
                                            </div>

                                            {/* Prize Display Card */}
                                            <div className="bg-white border-2 border-dashed border-amber-400 rounded-2xl p-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-4xl">🎁</div>
                                                    <div className="flex-1">
                                                        <p className="text-gray-400 text-sm mb-1">Phần thưởng của bạn</p>
                                                        <p className="text-xl font-bold text-gray-800">{wonPrize.name}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Instructions */}
                                            <div className="bg-green-50 rounded-2xl p-4 mb-4 text-center">
                                                <p className="text-gray-700">🎅 Vui lòng liên hệ nhân viên để nhận quà 🎅</p>
                                            </div>
                                        </>
                                    )}

                                    {/* Action Button */}
                                    <button
                                        onClick={session && session.remaining_turns > 0 ? handlePlayAgain : handleNewInvoice}
                                        className="w-full px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition flex items-center justify-center gap-2 border border-gray-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        {session && session.remaining_turns > 0
                                            ? `Quay tiếp (${session.remaining_turns} lượt)`
                                            : 'Nhập hóa đơn khác'
                                        }
                                    </button>
                                </div>

                                {/* Bottom decorations */}
                                <div className="absolute bottom-4 left-4 text-2xl">🎄</div>
                                <div className="absolute bottom-4 right-4 text-2xl">🎁</div>
                            </div>
                        </div>
                    </div>
                )}


                {/* History Prize Detail Modal */}
                {selectedHistoryItem && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a472a]/90"
                        onClick={(e) => e.target === e.currentTarget && setSelectedHistoryItem(null)}
                    >
                        <div className="w-full max-w-md mx-auto">
                            {/* Main modal with green gradient header */}
                            <div className="bg-gradient-to-b from-green-100 via-white to-white rounded-3xl overflow-hidden shadow-2xl relative">
                                {/* Close button */}
                                <button
                                    onClick={() => setSelectedHistoryItem(null)}
                                    className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition z-10"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>

                                {/* Corner decorations */}
                                <div className="absolute top-3 left-3 text-2xl">🎄</div>
                                <div className="absolute top-2 right-14 text-lg">❄️</div>

                                {/* Content */}
                                <div className="p-6 pt-10">
                                    {/* Header */}
                                    <div className="text-center mb-5">
                                        <p className="text-gray-600 text-sm mb-2">🎄Mắt Kính Tâm Đức</p>
                                        <h2 className="text-2xl font-bold italic mb-2">
                                            <span className="text-red-500">MERRY</span>{' '}
                                            <span className="text-green-600">CHRISTMAS</span>{' '}
                                            <span>🎄</span>
                                        </h2>
                                    </div>

                                    {/* Prize Name */}
                                    <div className="text-center mb-4">
                                        <p className="text-green-600 font-semibold">Bạn nhận được</p>
                                        <p className="text-2xl font-bold text-red-500 drop-shadow-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>{selectedHistoryItem.prize_name}</p>
                                    </div>

                                    {selectedHistoryItem.voucher ? (
                                        <>
                                            {/* Voucher Code Card */}
                                            <div className="bg-white border-2 border-dashed border-amber-400 rounded-2xl p-4 mb-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-4xl">🎅</div>
                                                    <div className="flex-1">
                                                        <p className="text-gray-400 text-sm mb-2">Mã ưu đãi độc quyền</p>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-wider">
                                                                {selectedHistoryItem.voucher.code}
                                                            </p>
                                                            <button
                                                                onClick={() => navigator.clipboard.writeText(selectedHistoryItem.voucher!.code)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-md"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                                Copy
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Voucher Details */}
                                            <div className="bg-green-50 rounded-2xl p-4 space-y-3">
                                                <div className="flex items-center gap-3 text-gray-700">
                                                    <span className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472a4.265 4.265 0 01.264-.521z" clipRule="evenodd" fillRule="evenodd" /></svg>
                                                    </span>
                                                    <span>Trị giá:</span>
                                                    <span className="font-bold text-red-500">{new Intl.NumberFormat('vi-VN').format(selectedHistoryItem.voucher.value)}đ</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-700">
                                                    <span className="w-7 h-7 bg-gray-300 rounded flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    </span>
                                                    <span>Hết hạn:</span>
                                                    <span className="font-bold">{new Date(selectedHistoryItem.voucher.expire_date).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                {selectedHistoryItem.voucher.conditions && (
                                                    <div className="flex items-start gap-3 text-gray-600">
                                                        <span className="w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                                        </span>
                                                        <span>{selectedHistoryItem.voucher.conditions}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Physical Prize Card */}
                                            <div className="bg-white border-2 border-dashed border-amber-400 rounded-2xl p-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-4xl">🎁</div>
                                                    <div className="flex-1">
                                                        <p className="text-gray-400 text-sm mb-1">Phần thưởng của bạn</p>
                                                        <p className="text-xl font-bold text-gray-800">{selectedHistoryItem.prize_name}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Instructions */}
                                            <div className="bg-green-50 rounded-2xl p-4 text-center">
                                                <p className="text-gray-700">🎅 Vui lòng liên hệ nhân viên để nhận quà 🎅</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Bottom decorations */}
                                <div className="absolute bottom-4 left-4 text-2xl">🎄</div>
                                <div className="absolute bottom-4 right-4 text-2xl">🎁</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Terms and Conditions Accordion */}
                <TermsAccordion />

                {/* Footer */}
                <footer className="mt-12 pt-8 border-t border-white/10 text-center">
                    <p className="text-white/50 text-sm">
                        © {new Date().getFullYear()} Bản quyền thuộc về{' '}
                        <a
                            href="https://matkinhtamduc.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-yellow-400/80 hover:text-yellow-400 transition"
                        >
                            Mắt Kính Tâm Đức
                        </a>
                        {' '}- matkinhtamduc.com
                    </p>
                </footer>
            </div>
        </div>
    );
}

// Terms and Conditions Accordion Component
function TermsAccordion() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const terms = [
        {
            title: '1. Điều kiện tham gia',
            content: `• Chương trình áp dụng cho tất cả khách hàng mua hàng tại hệ thống Mắt Kính Tâm Đức.
            • Mỗi hóa đơn mua hàng hợp lệ sẽ được tham gia quay thưởng theo giá trị hóa đơn.
            • Hóa đơn phải được thanh toán đầy đủ và không áp dụng cho đơn hàng đã hoàn trả.
            • Mỗi hóa đơn chỉ được sử dụng một lần để tham gia chương trình.`
        },
        {
            title: '2. Quy định về giải thưởng',
            content: `• Giải thưởng được xác định ngẫu nhiên bởi hệ thống.
            • Voucher giảm giá có thời hạn sử dụng và điều kiện áp dụng riêng.
            • Quà tặng vật lý cần liên hệ nhân viên cửa hàng để nhận.
            • Giải thưởng không được quy đổi thành tiền mặt.
            • Mỗi voucher chỉ được sử dụng một lần và không cộng gộp với các chương trình khác.`
        },
        {
            title: '3. Thời gian và phạm vi áp dụng',
            content: `• Chương trình có thời hạn theo từng đợt khuyến mãi.
            • Áp dụng tại tất cả chi nhánh thuộc hệ thống Mắt Kính Tâm Đức.
            • Ban tổ chức có quyền kết thúc chương trình sớm khi hết quà tặng.
            • Thời gian áp dụng voucher được ghi rõ trên từng mã voucher.`
        },
        {
            title: '4. Quy định chung',
            content: `• Ban tổ chức có quyền từ chối các trường hợp gian lận hoặc vi phạm điều khoản.
            • Trong trường hợp phát sinh tranh chấp, quyết định của Ban tổ chức là quyết định cuối cùng.
            • Bằng việc tham gia chương trình, khách hàng đồng ý với các điều khoản trên.
            • Mọi thắc mắc xin liên hệ nhân viên cửa hàng hoặc hotline để được hỗ trợ.`
        }
    ];

    return (
        <div className="mt-12">
            <h2 className="text-xl font-bold text-white text-center mb-4 flex items-center justify-center gap-2">
                📜 Điều kiện & Điều khoản
            </h2>
            <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
                {terms.map((term, index) => (
                    <div key={index} className="border-b border-white/10 last:border-b-0">
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition"
                        >
                            <span className="text-yellow-200 font-medium text-sm">{term.title}</span>
                            <ChevronDown
                                className={`w-5 h-5 text-white/50 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>
                        <div
                            className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                                }`}
                        >
                            <div className="px-4 pb-4 text-white/70 text-sm whitespace-pre-line">
                                {term.content}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
