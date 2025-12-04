'use client';

import { useState, useEffect, useCallback } from 'react';
import SpinWheel from '@/components/SpinWheel';
import InvoiceForm from '@/components/InvoiceForm';
import { Gift, Sparkles, Trophy, RotateCcw, ChevronLeft, ChevronRight, History } from 'lucide-react';

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
    prize_name: string;
    prize_type: string;
    spun_at: string;
}

interface HistoryPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

    // History state
    const [history, setHistory] = useState<SpinHistoryItem[]>([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPagination, setHistoryPagination] = useState<HistoryPagination | null>(null);

    // Fetch history
    const fetchHistory = useCallback(async () => {
        try {
            const response = await fetch(`/api/spin/history?page=${historyPage}&limit=5`);
            const data = await response.json();
            if (data.success) {
                setHistory(data.data.logs);
                setHistoryPagination(data.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
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
    };

    const handleNewInvoice = () => {
        setSession(null);
        setShowResult(false);
        setWonPrize(null);
        setTargetIndex(null);
        setCurrentTurn(0);
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p>Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
                <div className="text-center text-white bg-white/10 backdrop-blur rounded-2xl p-8 max-w-md">
                    <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h1 className="text-2xl font-bold mb-2">Chưa có sự kiện</h1>
                    <p className="text-white/70">{error || 'Hiện không có chương trình quay thưởng nào đang diễn ra.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                        <h1 className="text-3xl md:text-4xl font-bold text-white">{event.name}</h1>
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                    </div>
                    {event.description && (
                        <p className="text-white/70">{event.description}</p>
                    )}
                </div>

                {/* Invoice Form or Session Info */}
                {!session ? (
                    <div className="mb-8">
                        <h2 className="text-center text-lg text-white/80 mb-4">
                            Nhập mã hóa đơn để tham gia quay thưởng
                        </h2>
                        <InvoiceForm onValidated={handleValidated} />
                    </div>
                ) : (
                    <div className="mb-6 text-center">
                        <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-white/10 backdrop-blur rounded-xl px-6 py-4">
                            <div className="text-sm text-white/70">
                                <span className="text-white font-semibold">{session.customer.name || 'Khách hàng'}</span>
                            </div>
                            <div className="h-6 w-px bg-white/20 hidden sm:block" />
                            <div className="text-sm">
                                <span className="text-white/60">HD:</span>{' '}
                                <span className="text-white font-mono">{session.invoice_code}</span>
                            </div>
                            <div className="h-6 w-px bg-white/20 hidden sm:block" />
                            <div className="text-sm">
                                <span className="text-white/60">Giá trị:</span>{' '}
                                <span className="text-green-400 font-semibold">
                                    {new Intl.NumberFormat('vi-VN').format(session.invoice_total)}đ
                                </span>
                            </div>
                            <div className="h-6 w-px bg-white/20 hidden sm:block" />
                            <div className="text-sm">
                                <span className="text-white/60">CN:</span>{' '}
                                <span className="text-white">{session.branch.name}</span>
                            </div>
                            <div className="h-6 w-px bg-white/20" />
                            <div className="text-yellow-400 font-bold">
                                {session.remaining_turns} lượt
                            </div>
                            <button
                                onClick={handleNewInvoice}
                                className="text-white/70 hover:text-white p-1"
                                title="Đổi hóa đơn"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Spin Wheel */}
                <div className="flex flex-col items-center gap-8">
                    <SpinWheel
                        prizes={event.prizes}
                        isSpinning={isSpinning}
                        targetIndex={targetIndex}
                        onSpinComplete={handleSpinComplete}
                    />

                    {/* Spin Button */}
                    {session && session.remaining_turns > 0 && !showResult && (
                        <button
                            onClick={handleSpin}
                            disabled={isSpinning}
                            className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold text-xl rounded-full shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                        >
                            {isSpinning ? 'Đang quay...' : 'QUAY NGAY!'}
                        </button>
                    )}

                    {/* No more turns */}
                    {session && session.remaining_turns === 0 && !showResult && (
                        <div className="text-center">
                            <p className="text-white/70 mb-4">Bạn đã hết lượt quay cho hóa đơn này</p>
                            <button
                                onClick={handleNewInvoice}
                                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition"
                            >
                                Nhập hóa đơn khác
                            </button>
                        </div>
                    )}
                </div>

                {/* Spin History */}
                <div className="mt-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <History className="w-5 h-5 text-yellow-400" />
                        <h2 className="text-xl font-bold text-white">Lịch sử quay thưởng</h2>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-white/80 font-medium">Thời gian</th>
                                    <th className="px-4 py-3 text-left text-white/80 font-medium hidden sm:table-cell">Chi nhánh</th>
                                    <th className="px-4 py-3 text-left text-white/80 font-medium">Khách hàng</th>
                                    <th className="px-4 py-3 text-left text-white/80 font-medium">Quà</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                                            Chưa có lượt quay nào
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/5">
                                            <td className="px-4 py-3 text-white/70">{formatDateTime(item.spun_at)}</td>
                                            <td className="px-4 py-3 text-white/70 hidden sm:table-cell">{item.branch_name}</td>
                                            <td className="px-4 py-3 text-white">{item.customer_name || 'Khách'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.prize_type === 'no_prize'
                                                        ? 'bg-gray-500/30 text-gray-300'
                                                        : 'bg-yellow-500/30 text-yellow-300'
                                                    }`}>
                                                    {item.prize_name}
                                                </span>
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

                {/* Result Modal */}
                {showResult && wonPrize && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 max-w-sm w-full text-center transform animate-bounce-in">
                            {wonPrize.type === 'no_prize' ? (
                                <>
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                                        <Gift className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Chúc bạn may mắn lần sau!</h3>
                                    <p className="text-white/70 mb-6">Hãy thử lại với hóa đơn khác nhé</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: wonPrize.color }}>
                                        <Trophy className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-yellow-400 mb-2">🎉 Chúc mừng! 🎉</h3>
                                    <p className="text-2xl font-bold text-white mb-4">{wonPrize.name}</p>
                                    <p className="text-white/70 mb-6">Vui lòng liên hệ nhân viên để nhận quà</p>
                                </>
                            )}

                            <div className="flex gap-3">
                                {session && session.remaining_turns > 0 ? (
                                    <button
                                        onClick={handlePlayAgain}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold rounded-xl hover:opacity-90 transition"
                                    >
                                        Quay tiếp ({session.remaining_turns} lượt)
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleNewInvoice}
                                        className="flex-1 px-4 py-3 bg-white/20 text-white font-medium rounded-xl hover:bg-white/30 transition"
                                    >
                                        Nhập hóa đơn khác
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
        </div>
    );
}
