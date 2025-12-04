'use client';

import { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';

interface ConnectionStatus {
    configured: boolean;
    connected: boolean;
    retailer?: string;
    error?: string;
}

export default function SettingsPage() {
    const [status, setStatus] = useState<ConnectionStatus | null>(null);
    const [testing, setTesting] = useState(false);

    const checkConnection = async () => {
        setTesting(true);
        try {
            const response = await fetch('/api/admin/settings/kiotviet-status');
            const data = await response.json();
            setStatus(data);
        } catch (error) {
            setStatus({
                configured: false,
                connected: false,
                error: 'Không thể kiểm tra kết nối',
            });
        } finally {
            setTesting(false);
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
                <p className="text-gray-600">Cấu hình kết nối và tích hợp</p>
            </div>

            {/* KiotViet Connection */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Tích hợp KiotViet</h2>
                </div>

                <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            {status === null || testing ? (
                                <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                            ) : status.connected ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : status.configured ? (
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <div>
                                <p className="font-medium text-gray-900">
                                    {status === null || testing
                                        ? 'Đang kiểm tra...'
                                        : status.connected
                                            ? 'Đã kết nối'
                                            : status.configured
                                                ? 'Đã cấu hình nhưng chưa kết nối'
                                                : 'Chưa cấu hình'}
                                </p>
                                {status?.retailer && (
                                    <p className="text-sm text-gray-500">Retailer: {status.retailer}</p>
                                )}
                                {status?.error && (
                                    <p className="text-sm text-red-500">{status.error}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={checkConnection}
                            disabled={testing}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                            Kiểm tra
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-2">
                            Cấu hình KiotViet API
                        </p>
                        <p className="text-sm text-blue-700 mb-3">
                            Thông tin kết nối được cấu hình qua biến môi trường (environment variables) để đảm bảo bảo mật.
                        </p>
                        <div className="bg-white rounded p-3 font-mono text-xs text-gray-700 space-y-1">
                            <p>KIOTVIET_CLIENT_ID=your_client_id</p>
                            <p>KIOTVIET_CLIENT_SECRET=your_client_secret</p>
                            <p>KIOTVIET_RETAILER=your_retailer_name</p>
                        </div>
                        <div className="flex gap-4 mt-3">
                            <a
                                href="https://www.kiotviet.vn/huong-dan-ket-noi-api/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                                Hướng dẫn lấy API key
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    {/* Where to configure */}
                    <div className="text-sm text-gray-600">
                        <p className="font-medium mb-1">Nơi cấu hình:</p>
                        <ul className="list-disc ml-5 space-y-1">
                            <li><strong>Local:</strong> File <code className="bg-gray-100 px-1 rounded">.env.local</code></li>
                            <li><strong>Production:</strong> Vercel Dashboard → Settings → Environment Variables</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Other Settings */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt khác</h2>
                <p className="text-gray-500 text-sm">Chưa có cài đặt bổ sung.</p>
            </section>
        </div>
    );
}
