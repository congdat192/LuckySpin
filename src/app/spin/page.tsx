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
                            🎁 Nhập mã hóa đơn để nhận quà 🎁
                        </p>
                        <InvoiceForm onValidated={handleValidated} />
                    </div>
                ) : (
                    <div className="mb-6">
                        {/* Tra cứu lại button */}
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={handleNewInvoice}
                                className="text-white/70 hover:text-white text-xs flex items-center gap-1 transition"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Tra cứu lại</span>
                            </button>
                        </div>
                        {/* Customer info card */}
                        <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-white/10 backdrop-blur rounded-xl px-6 py-4 border border-yellow-400/30 w-full">
                            <div className="text-sm text-white/70">
                                <span className="text-yellow-200 font-semibold">🎅 {session.customer.name || 'Khách hàng'}</span>
                            </div>
                            <div className="h-6 w-px bg-white/20 hidden sm:block" />
                            <div className="text-sm">
                                <span className="text-white/60">HD:</span>{' '}
                                <span className="text-white font-mono">{session.invoice_code}</span>
                            </div>
                            <div className="h-6 w-px bg-white/20 hidden sm:block" />
                            <div className="text-sm">
                                <span className="text-white/60">Giá trị:</span>{' '}
                                <span className="text-green-300 font-semibold">
                                    {new Intl.NumberFormat('vi-VN').format(session.invoice_total)}đ
                                </span>
                            </div>
                            <div className="h-6 w-px bg-white/20 hidden sm:block" />
                            <div className="text-sm">
                                <span className="text-white/60">CN:</span>{' '}
                                <span className="text-white">{session.branch.name}</span>
                            </div>
                            <div className="h-6 w-px bg-white/20" />
                            <div className="text-yellow-300 font-bold">
                                🎁 {session.remaining_turns} lượt
                            </div>
                        </div>
                    </div>
                )}

                {/* Spin Wheel */}
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-3xl scale-110" />
                        <SpinWheel
                            prizes={event.prizes}
                            isSpinning={isSpinning}
                            targetIndex={targetIndex}
                            onSpinComplete={handleSpinComplete}
                            canSpin={!!session && session.remaining_turns > 0 && !showResult}
                            onSpin={handleSpin}
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
                    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
                        <div className="bg-gradient-to-b from-red-800 to-green-900 rounded-t-3xl p-6 max-w-md mx-auto text-center border-t-4 border-x-4 border-yellow-400 shadow-2xl">
                            {wonPrize.type === 'no_prize' ? (
                                <>
                                    <div className="text-6xl mb-4">❄️</div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Chúc bạn may mắn lần sau!</h3>
                                    <p className="text-white/70 mb-6">🎄 Hãy thử lại với hóa đơn khác nhé 🎄</p>
                                </>
                            ) : wonPrize.type === 'voucher' && voucherInfo ? (
                                <>
                                    <div className="text-5xl mb-3">🎫</div>
                                    <h3 className="text-xl font-bold text-yellow-300 mb-2">🎅 Chúc mừng Giáng sinh! 🎅</h3>
                                    <p className="text-lg font-semibold text-white mb-3">{wonPrize.name}</p>

                                    {/* Voucher Code Display */}
                                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 mb-4">
                                        <p className="text-sm text-yellow-900 mb-1">Mã voucher của bạn</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <p className="text-2xl font-bold text-white tracking-widest">
                                                {voucherInfo.voucher_code}
                                            </p>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(voucherInfo.voucher_code)}
                                                className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition"
                                                title="Sao chép mã"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>

                                    {/* Voucher Details */}
                                    <div className="text-left bg-white/10 rounded-xl p-3 mb-4 text-sm">
                                        <p className="text-white mb-1">
                                            <span className="text-yellow-400">💰 Giá trị:</span> {new Intl.NumberFormat('vi-VN').format(voucherInfo.value)}đ
                                        </p>
                                        {voucherInfo.expire_date && (
                                            <p className="text-white mb-1">
                                                <span className="text-yellow-400">📅 Hết hạn:</span> {new Date(voucherInfo.expire_date).toLocaleDateString('vi-VN')}
                                            </p>
                                        )}
                                        {voucherInfo.conditions && (
                                            <p className="text-white/80">
                                                <span className="text-yellow-400">📋 Điều kiện:</span> {voucherInfo.conditions}
                                            </p>
                                        )}
                                    </div>

                                    {/* Email Form */}
                                    {!emailSent ? (
                                        <div className="mb-4">
                                            <p className="text-white/70 text-sm mb-2">Nhận voucher qua email:</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="email"
                                                    value={voucherEmail}
                                                    onChange={(e) => setVoucherEmail(e.target.value)}
                                                    placeholder="email@example.com"
                                                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 text-sm"
                                                />
                                                <button
                                                    onClick={handleSendVoucherEmail}
                                                    disabled={!voucherEmail || sendingEmail}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-sm font-medium"
                                                >
                                                    {sendingEmail ? '...' : '📧 Gửi'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-4 p-3 bg-green-600/30 rounded-xl border border-green-400/50">
                                            <p className="text-green-300 text-sm">✅ Đã gửi voucher đến email của bạn!</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="text-6xl mb-4">🎁</div>
                                    <h3 className="text-xl font-bold text-yellow-300 mb-2">🎅 Chúc mừng Giáng sinh! 🎅</h3>
                                    <p className="text-2xl font-bold text-white mb-4">{wonPrize.name}</p>
                                    <p className="text-yellow-100/70 mb-6">🎄 Vui lòng liên hệ nhân viên để nhận quà 🎄</p>
                                </>
                            )}

                            <div className="flex gap-3">
                                {session && session.remaining_turns > 0 ? (
                                    <button
                                        onClick={handlePlayAgain}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:opacity-90 transition border-2 border-yellow-400"
                                    >
                                        🎁 Quay tiếp ({session.remaining_turns} lượt)
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleNewInvoice}
                                        className="flex-1 px-4 py-3 bg-white/20 text-white font-medium rounded-xl hover:bg-white/30 transition"
                                    >
                                        🎄 Nhập hóa đơn khác
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* History Prize Detail Modal */}
                {selectedHistoryItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-gradient-to-b from-red-800 to-green-900 rounded-2xl p-6 max-w-md w-full text-center border-4 border-yellow-400 shadow-2xl">
                            <div className="text-5xl mb-4">🎁</div>
                            <h3 className="text-2xl font-bold text-yellow-300 mb-2">
                                {selectedHistoryItem.prize_name}
                            </h3>

                            {selectedHistoryItem.voucher ? (
                                <>
                                    <div className="bg-yellow-400 text-gray-900 px-6 py-4 rounded-xl my-4 shadow-lg">
                                        <p className="text-sm text-gray-700 mb-1">Mã Voucher</p>
                                        <p className="text-2xl font-bold tracking-wider">
                                            {selectedHistoryItem.voucher.code}
                                        </p>
                                    </div>
                                    <p className="text-xl font-bold text-white mb-3">
                                        Trị giá: {new Intl.NumberFormat('vi-VN').format(selectedHistoryItem.voucher.value)}đ
                                    </p>
                                    <div className="text-left bg-white/10 rounded-lg p-4 text-sm text-white/80 space-y-2">
                                        <p>
                                            <span className="text-yellow-300">📅 Hết hạn:</span>{' '}
                                            {new Date(selectedHistoryItem.voucher.expire_date).toLocaleDateString('vi-VN')}
                                        </p>
                                        {selectedHistoryItem.voucher.conditions && (
                                            <p>
                                                <span className="text-yellow-300">📋 Điều kiện:</span>{' '}
                                                {selectedHistoryItem.voucher.conditions}
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-white/80 my-4">
                                    {selectedHistoryItem.prize_type === 'physical' && selectedHistoryItem.prize_description && (
                                        <p>{selectedHistoryItem.prize_description}</p>
                                    )}
                                    {selectedHistoryItem.prize_value && (
                                        <p className="text-xl font-bold text-white mt-2">
                                            Trị giá: {new Intl.NumberFormat('vi-VN').format(selectedHistoryItem.prize_value)}đ
                                        </p>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedHistoryItem(null)}
                                className="mt-4 w-full px-6 py-3 bg-white/20 text-white font-medium rounded-xl hover:bg-white/30 transition"
                            >
                                Đóng
                            </button>
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
