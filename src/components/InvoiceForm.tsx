'use client';

import { useState } from 'react';
import { Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';

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
    reason?: string;
}

interface InvoiceFormProps {
    onValidated: (result: ValidationResult) => void;
    disabled?: boolean;
}

export default function InvoiceForm({ onValidated, disabled }: InvoiceFormProps) {
    const [invoiceCode, setInvoiceCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ValidationResult | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!invoiceCode.trim()) {
            setError('Vui lòng nhập mã hóa đơn');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/invoice/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoice_code: invoiceCode.trim() }),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || 'Đã xảy ra lỗi');
                return;
            }

            setResult(data.data);

            if (data.data.is_eligible && data.data.remaining_turns > 0) {
                onValidated(data.data);
            }
        } catch {
            setError('Không thể kết nối đến máy chủ');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        value={invoiceCode}
                        onChange={(e) => setInvoiceCode(e.target.value.toUpperCase())}
                        placeholder="Nhập mã hóa đơn (VD: HD001234)"
                        disabled={disabled || loading}
                        className="w-full px-4 py-3 pr-12 text-lg font-mono bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={disabled || loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-gray-900 transition disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-200">{error}</p>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className={`mt-4 p-4 rounded-xl border ${result.is_eligible && result.remaining_turns > 0
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-orange-500/20 border-orange-500/50'
                    }`}>
                    {result.is_eligible && result.remaining_turns > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-green-400">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-semibold">Hóa đơn hợp lệ!</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-white/80">
                                <div>
                                    <p className="text-white/50">Khách hàng</p>
                                    <p className="font-medium">{result.customer.name || 'Khách lẻ'}</p>
                                </div>
                                <div>
                                    <p className="text-white/50">Chi nhánh</p>
                                    <p className="font-medium">{result.branch.name}</p>
                                </div>
                                <div>
                                    <p className="text-white/50">Giá trị HĐ</p>
                                    <p className="font-medium">{formatCurrency(result.invoice_total)}</p>
                                </div>
                                <div>
                                    <p className="text-white/50">Số lượt quay</p>
                                    <p className="font-medium text-yellow-400 text-lg">{result.remaining_turns}</p>
                                </div>
                            </div>
                        </div>
                    ) : !result.is_eligible ? (
                        <div className="text-orange-200">
                            <p className="font-semibold mb-1">Hóa đơn không đủ điều kiện quay</p>
                            <p className="text-sm opacity-80">{result.reason || 'Giá trị hóa đơn chưa đạt mức tối thiểu'}</p>
                        </div>
                    ) : (
                        <div className="text-orange-200">
                            <p className="font-semibold mb-1">Hóa đơn đã sử dụng hết lượt quay</p>
                            <p className="text-sm opacity-80">
                                Đã quay {result.total_turns - result.remaining_turns}/{result.total_turns} lượt
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
