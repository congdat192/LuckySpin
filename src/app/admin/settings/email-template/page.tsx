'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Save, Loader2, RotateCcw, Eye } from 'lucide-react';

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td style="background: linear-gradient(135deg, #c41e3a 0%, #165b33 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎄 Chúc Mừng Giáng Sinh! 🎄</h1>
                <p style="color: #ffd700; margin: 10px 0 0;">Bạn đã trúng thưởng từ LuckySpin</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px; text-align: center;">
                <h2 style="color: #333; margin: 0 0 10px;">Voucher của bạn</h2>
                <div style="background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%); padding: 20px 30px; border-radius: 12px; display: inline-block; margin: 20px 0;">
                    <p style="margin: 0; font-size: 36px; font-weight: bold; color: #333; letter-spacing: 3px;">
                        {{voucher_code}}
                    </p>
                </div>
                <p style="font-size: 24px; color: #c41e3a; font-weight: bold; margin: 20px 0;">
                    Trị giá: {{value}}đ
                </p>
                <div style="margin: 20px 0;">
                    <p style="color: #666; margin: 0 0 10px; font-size: 14px;">Quét mã QR để sử dụng:</p>
                    <img src="{{qr_code}}" alt="QR Voucher" style="width: 150px; height: 150px; border: 3px solid #ffd700; border-radius: 8px;" />
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding: 0 30px 30px;">
                <table width="100%" style="background-color: #f9f9f9; border-radius: 8px; padding: 20px;">
                    <tr>
                        <td style="padding: 10px;">
                            <p style="margin: 0 0 10px; color: #666;">
                                <strong>📅 Hạn sử dụng:</strong> {{expire_date}}
                            </p>
                            <p style="margin: 0; color: #666;">
                                <strong>📋 Điều kiện:</strong> {{conditions}}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="background-color: #165b33; padding: 20px; text-align: center;">
                <p style="color: #ffffff; margin: 0; font-size: 14px;">
                    Cảm ơn bạn đã tham gia LuckySpin! 🎁
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;

export default function EmailTemplatePage() {
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [subject, setSubject] = useState('🎁 Voucher {{value}}đ - Chúc mừng bạn đã trúng thưởng!');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await fetch('/api/admin/settings?key=email_template');
                const data = await response.json();
                if (data.success && data.data) {
                    setTemplate(data.data.template || DEFAULT_TEMPLATE);
                    if (data.data.subject) {
                        setSubject(data.data.subject);
                    }
                }
            } catch (error) {
                console.error('Error fetching template:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'email_template',
                    value: { template, subject },
                }),
            });
            const data = await response.json();
            if (data.success) {
                setMessage('✅ Đã lưu template thành công!');
            } else {
                setMessage('❌ Lỗi: ' + data.error);
            }
        } catch {
            setMessage('❌ Lỗi kết nối');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setTemplate(DEFAULT_TEMPLATE);
        setSubject('🎁 Voucher {{value}}đ - Chúc mừng bạn đã trúng thưởng!');
        setMessage('');
    };

    const previewHtml = template
        .replace(/\{\{voucher_code\}\}/g, 'XMAS-ABC123XY')
        .replace(/\{\{value\}\}/g, '100.000')
        .replace(/\{\{expire_date\}\}/g, '31/12/2024')
        .replace(/\{\{conditions\}\}/g, 'Áp dụng cho hóa đơn từ 500.000đ')
        .replace(/\{\{qr_code\}\}/g, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=XMAS-ABC123XY');

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/settings" className="text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Mail className="w-6 h-6 text-purple-600" />
                            <h1 className="text-xl font-bold">Template Email Voucher</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            <Eye className="w-4 h-4" />
                            {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Mặc định
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Lưu
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {message && (
                    <div className={`mb-4 px-4 py-3 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Biến có thể sử dụng</h2>
                    <div className="flex flex-wrap gap-2">
                        {['{{voucher_code}}', '{{value}}', '{{expire_date}}', '{{conditions}}', '{{qr_code}}'].map(v => (
                            <code key={v} className="px-2 py-1 bg-gray-100 rounded text-sm">{v}</code>
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">💡 <code>{'{{qr_code}}'}</code> sẽ tự động tạo mã QR chứa voucher code</p>
                </div>

                <div className={`grid ${showPreview ? 'grid-cols-2 gap-6' : 'grid-cols-1'}`}>
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl shadow p-6">
                            <label className="block font-semibold mb-2">Tiêu đề email</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="Tiêu đề email..."
                            />
                        </div>

                        <div className="bg-white rounded-xl shadow p-6">
                            <label className="block font-semibold mb-2">Nội dung HTML</label>
                            <textarea
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                className="w-full h-[500px] px-4 py-3 border rounded-lg font-mono text-sm"
                                placeholder="HTML template..."
                            />
                        </div>
                    </div>

                    {showPreview && (
                        <div className="bg-white rounded-xl shadow p-6">
                            <h2 className="font-semibold mb-4">Xem trước</h2>
                            <div className="border rounded-lg overflow-hidden">
                                <iframe
                                    srcDoc={previewHtml}
                                    className="w-full h-[600px]"
                                    title="Email Preview"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
