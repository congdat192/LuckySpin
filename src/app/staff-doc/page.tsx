'use client';

import React, { useState } from 'react';
import {
    Book,
    Gift,
    MessageCircle,
    PlayCircle,
    HelpCircle,
    ChevronRight,
    Menu,
    X,
    Smartphone,
    CheckCircle2,
    AlertCircle,
    ShoppingBag
} from 'lucide-react';

export default function StaffDocPage() {
    const [activeSection, setActiveSection] = useState('intro');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const sections = [
        { id: 'intro', title: 'Giới thiệu chương trình', icon: Book },
        { id: 'process', title: 'Quy trình phục vụ', icon: PlayCircle },
        { id: 'rules', title: 'Thể lệ & Điều kiện', icon: AlertCircle },
        { id: 'prizes', title: 'Hướng dẫn trao quà', icon: Gift },
        { id: 'script', title: 'Kịch bản tư vấn', icon: MessageCircle },
        { id: 'faq', title: 'Xử lý tình huống', icon: HelpCircle },
    ];

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        setIsMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="min-h-screen bg-blue-50 flex">
            {/* Sidebar Navigation */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-blue-100 transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0
            `}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-blue-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900">Lucky Spin</h1>
                                <p className="text-xs text-gray-500">Dành cho Nhân viên</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                                        ${activeSection === section.id
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {section.title}
                                    {activeSection === section.id && (
                                        <ChevronRight className="w-4 h-4 ml-auto" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="fixed top-4 right-4 z-50 md:hidden p-2 bg-white rounded-lg shadow-lg border border-gray-200"
            >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-y-auto h-screen">
                <div className="max-w-3xl mx-auto px-6 py-12 space-y-16">

                    {/* Intro */}
                    <section id="intro" className="scroll-mt-12">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg mb-8">
                            <h1 className="text-3xl font-bold mb-4">Vòng Quay May Mắn 🎁</h1>
                            <p className="text-blue-100 text-lg leading-relaxed">
                                Chương trình tri ân khách hàng đặc biệt của Mắt Kính Tâm Đức.
                                Giúp tăng trải nghiệm mua sắm và tỉ lệ quay lại của khách hàng.
                            </p>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-4">Điểm nổi bật</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">100% Trúng quà</h3>
                                </div>
                                <p className="text-sm text-gray-600">Khách hàng luôn nhận được quà (Voucher hoặc Hiện vật) khi tham gia.</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Thao tác đơn giản</h3>
                                </div>
                                <p className="text-sm text-gray-600">Khách chỉ cần nhập Mã hóa đơn trên điện thoại để quay.</p>
                            </div>
                        </div>
                    </section>

                    {/* Process */}
                    <section id="process" className="scroll-mt-12 border-t border-blue-200 pt-12">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <PlayCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Quy trình phục vụ khách</h2>
                        </div>

                        <div className="relative border-l-2 border-blue-200 ml-3 space-y-10 pb-4">
                            <div className="relative pl-8">
                                <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Bước 1: Xuất hóa đơn & Thông báo</h3>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <p className="text-gray-600 mb-2">Sau khi thanh toán và xuất hóa đơn trên KiotViet, hãy thông báo ngay cho khách:</p>
                                    <p className="text-blue-700 font-medium italic">"Dạ với hóa đơn này, anh/chị được tham gia Vòng Quay May Mắn với cơ hội trúng Voucher lên đến 500k ạ!"</p>
                                </div>
                            </div>

                            <div className="relative pl-8">
                                <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Bước 2: Hướng dẫn quét mã</h3>
                                <p className="text-gray-600 mb-2">Mời khách quét mã QR đặt tại quầy thu ngân hoặc truy cập vào đường link chương trình.</p>
                                <div className="bg-gray-100 p-3 rounded text-sm text-gray-600">
                                    💡 Nếu khách không rành công nghệ, bạn có thể xin phép mượn điện thoại để thao tác giúp khách.
                                </div>
                            </div>

                            <div className="relative pl-8">
                                <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Bước 3: Nhập mã & Quay thưởng</h3>
                                <p className="text-gray-600">Hướng dẫn khách nhập chính xác <strong>Mã hóa đơn</strong> (in trên phiếu tính tiền) vào ô nhập liệu và nhấn nút QUAY.</p>
                            </div>

                            <div className="relative pl-8">
                                <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Bước 4: Trao quà</h3>
                                <ul className="list-disc list-inside text-gray-600 space-y-2">
                                    <li><strong>Nếu trúng Hiện vật:</strong> Trao quà ngay tại quầy và chụp hình lưu niệm (nếu khách đồng ý).</li>
                                    <li><strong>Nếu trúng Voucher:</strong> Hướng dẫn khách kiểm tra Email để nhận mã Voucher cho lần mua sau.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Rules */}
                    <section id="rules" className="scroll-mt-12 border-t border-blue-200 pt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Thể lệ & Điều kiện</h2>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-gray-200">
                                <h4 className="font-bold text-gray-900 mb-2">Điều kiện tham gia</h4>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500">✓</span> Hóa đơn mua hàng trong ngày.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500">✓</span> Đạt giá trị tối thiểu (thường là 300k - 500k tùy sự kiện).
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500">✓</span> Mỗi hóa đơn chỉ được tham gia 1 lần.
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-200">
                                <h4 className="font-bold text-gray-900 mb-2">Quy định về Voucher</h4>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500">•</span> Voucher được gửi qua Email.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500">•</span> Có hạn sử dụng (thường là 30-60 ngày).
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500">•</span> Áp dụng cho lần mua hàng tiếp theo.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Prizes */}
                    <section id="prizes" className="scroll-mt-12 border-t border-blue-200 pt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                                <Gift className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Hướng dẫn trao quà</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-pink-600 mb-2">🎁 Đối với Quà hiện vật (Gấu bông, Nón, Áo...)</h3>
                                <p className="text-gray-600 text-sm mb-3">Nhân viên lấy quà từ kho quà tặng tại cửa hàng và trao trực tiếp cho khách.</p>
                                <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800">
                                    <strong>Lưu ý:</strong> Kiểm tra kỹ quà trước khi trao (không rách, lỗi). Nếu hết quà, báo ngay cho Quản lý.
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-blue-600 mb-2">🎫 Đối với Voucher</h3>
                                <p className="text-gray-600 text-sm mb-3">Hệ thống tự động gửi. Nhân viên nhắc khách:</p>
                                <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                                    <li>Kiểm tra Email (cả mục Spam/Quảng cáo).</li>
                                    <li>Chụp màn hình mã Voucher lại để dễ sử dụng lần sau.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section id="faq" className="scroll-mt-12 border-t border-blue-200 pt-12 pb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                                <HelpCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Xử lý tình huống thường gặp</h2>
                        </div>

                        <div className="space-y-4">
                            <details className="group bg-white border border-gray-200 rounded-lg p-4 cursor-pointer">
                                <summary className="font-bold text-gray-900 flex items-center justify-between">
                                    Khách nhập mã báo "Hóa đơn không hợp lệ"?
                                    <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                                </summary>
                                <div className="mt-3 text-gray-600 text-sm pl-4 border-l-2 border-gray-200">
                                    <p>Kiểm tra lại:</p>
                                    1. Khách có nhập đúng từng ký tự không? (Phân biệt chữ hoa/thường).<br />
                                    2. Hóa đơn có phải vừa xuất không? (Đôi khi hệ thống cần 1-2 phút để đồng bộ).<br />
                                    3. Tổng tiền có đủ điều kiện không?
                                </div>
                            </details>

                            <details className="group bg-white border border-gray-200 rounded-lg p-4 cursor-pointer">
                                <summary className="font-bold text-gray-900 flex items-center justify-between">
                                    Khách không có Email để nhận Voucher?
                                    <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                                </summary>
                                <div className="mt-3 text-gray-600 text-sm pl-4 border-l-2 border-gray-200">
                                    <p>Có thể hỗ trợ khách dùng Email của người thân. Nếu khách hoàn toàn không dùng Email, hãy liên hệ Quản lý để có phương án xử lý linh hoạt (ví dụ ghi nhận thủ công).</p>
                                </div>
                            </details>

                            <details className="group bg-white border border-gray-200 rounded-lg p-4 cursor-pointer">
                                <summary className="font-bold text-gray-900 flex items-center justify-between">
                                    Mạng bị lỗi, không vào được trang quay?
                                    <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                                </summary>
                                <div className="mt-3 text-gray-600 text-sm pl-4 border-l-2 border-gray-200">
                                    <p>Xin lỗi khách và giải thích do sự cố mạng. Hóa đơn của khách vẫn có giá trị tham gia trong ngày. Khách có thể về nhà và tự quay sau.</p>
                                </div>
                            </details>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
