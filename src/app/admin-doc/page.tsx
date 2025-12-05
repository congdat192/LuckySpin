'use client';

import React, { useState } from 'react';
import {
    Book,
    Gift,
    Settings,
    Users,
    BarChart3,
    Ticket,
    Mail,
    ShieldCheck,
    HelpCircle,
    ChevronRight,
    Menu,
    X,
    LayoutDashboard,
    Store,
    Database,
    PlayCircle
} from 'lucide-react';

export default function AdminDocPage() {
    const [activeSection, setActiveSection] = useState('intro');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const sections = [
        { id: 'intro', title: 'Giới thiệu chung', icon: Book },
        { id: 'flow', title: 'Quy trình hoạt động', icon: PlayCircle },
        { id: 'access', title: 'Truy cập & Đăng nhập', icon: ShieldCheck },
        { id: 'events', title: 'Quản lý Sự kiện & Quà', icon: Gift },
        { id: 'inventory', title: 'Quản lý Kho & Chi nhánh', icon: Store },
        { id: 'vouchers', title: 'Hệ thống Voucher', icon: Ticket },
        { id: 'email', title: 'Cấu hình Email & QR', icon: Mail },
        { id: 'reports', title: 'Báo cáo & Thống kê', icon: BarChart3 },
        { id: 'faq', title: 'Câu hỏi thường gặp', icon: HelpCircle },
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
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Navigation */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0
            `}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white">
                                <Book className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900">Lucky Spin</h1>
                                <p className="text-xs text-gray-500">Tài liệu hướng dẫn</p>
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
                                            ? 'bg-green-50 text-green-700'
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

                    <div className="p-4 border-t border-gray-100">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-xs text-blue-700 font-medium mb-1">Cần hỗ trợ kỹ thuật?</p>
                            <p className="text-xs text-blue-600">Liên hệ IT Admin để được giải đáp.</p>
                        </div>
                    </div>
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
                <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">

                    {/* Intro */}
                    <section id="intro" className="scroll-mt-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-6">Hướng dẫn quản trị Lucky Spin</h1>
                        <p className="text-xl text-gray-600 leading-relaxed mb-8">
                            Chào mừng đến với hệ thống quản trị Vòng Quay May Mắn. Tài liệu này sẽ giúp bạn hiểu rõ cách vận hành,
                            cấu hình sự kiện và quản lý quà tặng cho chuỗi cửa hàng Mắt Kính Tâm Đức.
                        </p>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                                    <Store className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Đa chi nhánh</h3>
                                <p className="text-sm text-gray-500">Đồng bộ dữ liệu và quản lý kho quà riêng biệt cho từng chi nhánh KiotViet.</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                                    <Ticket className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Tự động Voucher</h3>
                                <p className="text-sm text-gray-500">Tự động phát hành voucher KiotViet và gửi email kèm QR code cho khách.</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Kiểm soát chặt chẽ</h3>
                                <p className="text-sm text-gray-500">Xác thực hóa đơn, giới hạn lượt quay và báo cáo chi tiết minh bạch.</p>
                            </div>
                        </div>
                    </section>

                    {/* Flow */}
                    <section id="flow" className="scroll-mt-12 border-t border-gray-200 pt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <PlayCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Quy trình hoạt động</h2>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="p-6 space-y-8">
                                <div className="flex gap-4">
                                    <div className="flex-none w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">1</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Khách mua hàng</h4>
                                        <p className="text-gray-600">Khách hàng mua sắm tại cửa hàng và nhận hóa đơn thanh toán.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-none w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">2</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Truy cập trang quay thưởng</h4>
                                        <p className="text-gray-600">Khách truy cập vào đường link chương trình (hoặc quét QR tại quầy) và nhập <strong>Mã hóa đơn</strong>.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-none w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">3</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Hệ thống kiểm tra</h4>
                                        <p className="text-gray-600">Hệ thống tự động kết nối KiotViet để kiểm tra:</p>
                                        <ul className="list-disc list-inside text-sm text-gray-500 mt-2 ml-2 space-y-1">
                                            <li>Hóa đơn có tồn tại không?</li>
                                            <li>Giá trị hóa đơn có đủ điều kiện không?</li>
                                            <li>Hóa đơn đã được sử dụng chưa?</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-none w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">4</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Quay thưởng & Nhận quà</h4>
                                        <p className="text-gray-600">Khách thực hiện quay. Nếu trúng Voucher, hệ thống sẽ tự động gửi email chứa mã Voucher và QR code cho khách.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Access */}
                    <section id="access" className="scroll-mt-12 border-t border-gray-200 pt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Truy cập & Đăng nhập</h2>
                        </div>
                        <div className="prose text-gray-600">
                            <p>Để vào trang quản trị, truy cập đường dẫn: <code>/login</code></p>
                            <p className="mt-2">Hệ thống hỗ trợ đăng nhập nhiều tài khoản admin. Vui lòng liên hệ quản lý để được cấp tài khoản.</p>
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                                <p className="text-yellow-800 text-sm">
                                    <strong>Lưu ý:</strong> Phiên đăng nhập sẽ hết hạn sau 7 ngày. Bạn cần đăng nhập lại sau khoảng thời gian này.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Events */}
                    <section id="events" className="scroll-mt-12 border-t border-gray-200 pt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                <Gift className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Quản lý Sự kiện & Quà</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">1. Tạo sự kiện mới</h3>
                                <p className="text-gray-600 mb-2">Vào menu <strong>Sự kiện</strong> → <strong>Tạo sự kiện</strong>. Bạn cần điền:</p>
                                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                                    <li>Tên sự kiện (VD: Giáng Sinh 2024)</li>
                                    <li>Slug (Đường dẫn, VD: giang-sinh-2024)</li>
                                    <li>Thời gian bắt đầu & kết thúc</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">2. Cấu hình Luật chơi</h3>
                                <p className="text-gray-600 mb-2">Thiết lập điều kiện để hóa đơn được tham gia:</p>
                                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                                    <li><strong>Giá trị tối thiểu:</strong> Hóa đơn phải từ bao nhiêu tiền (VD: 500.000đ).</li>
                                    <li><strong>Công thức tính lượt:</strong>
                                        <ul className="list-circle list-inside ml-6 mt-1 text-sm">
                                            <li><em>Cố định:</em> Mỗi hóa đơn 1 lượt quay.</li>
                                            <li><em>Theo bậc thang:</em> 500k = 1 lượt, 1tr = 2 lượt...</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">3. Quản lý Quà tặng</h3>
                                <p className="text-gray-600 mb-2">Thêm các phần quà vào vòng quay. Các loại quà hỗ trợ:</p>
                                <div className="grid sm:grid-cols-2 gap-4 mt-3">
                                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                                        <span className="font-bold text-blue-600">Voucher</span>
                                        <p className="text-sm text-gray-500 mt-1">Liên kết với chiến dịch Voucher trên KiotViet. Tự động sinh mã khi trúng.</p>
                                    </div>
                                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                                        <span className="font-bold text-orange-600">Hiện vật</span>
                                        <p className="text-sm text-gray-500 mt-1">Quà tặng vật lý (Nón, Áo, Gấu bông...). Cần trao tại quầy.</p>
                                    </div>
                                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                                        <span className="font-bold text-gray-600">Không trúng</span>
                                        <p className="text-sm text-gray-500 mt-1">Ô &quot;Chúc bạn may mắn lần sau&quot;.</p>
                                    </div>
                                </div>
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Mới:</strong> Bạn có thể upload hình ảnh cho từng phần quà để hiển thị trên vòng quay đẹp mắt hơn.
                                    </p>
                                </div>

                                <div className="mt-6 border-t border-gray-100 pt-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">4. Tùy biến Vòng quay (Mới)</h3>
                                    <p className="text-gray-600 mb-2">Để vòng quay thêm sinh động, bạn có thể tùy chỉnh:</p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                                        <li>
                                            <strong>Màu chữ & Hiệu ứng:</strong> Chọn màu chữ và hiệu ứng (Đổ bóng, Viền đen, Phát sáng, Vàng kim) cho từng phần quà để nổi bật trên nền màu.
                                        </li>
                                        <li>
                                            <strong>Chế độ hiển thị:</strong> Tại danh sách quà, chọn chế độ hiển thị trên vòng quay:
                                            <ul className="list-circle list-inside ml-6 mt-1 text-sm">
                                                <li><em>Ảnh + Text:</em> Hiển thị cả hình ảnh và tên quà (Mặc định).</li>
                                                <li><em>Chỉ ảnh:</em> Hình ảnh sẽ to hơn, ẩn tên quà.</li>
                                                <li><em>Chỉ text:</em> Chỉ hiện tên quà, ẩn hình ảnh.</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Inventory */}
                    <section id="inventory" className="scroll-mt-12 border-t border-gray-200 pt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                <Store className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Quản lý Kho & Chi nhánh</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Mỗi chi nhánh có kho quà riêng biệt. Điều này đảm bảo quà được phân bổ đúng nơi khách mua hàng.
                        </p>
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Các bước nhập kho:</h3>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Cách 1: Nhập trực tiếp</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                                        <li>Vào menu <strong>Kho quà</strong> → Chọn sự kiện.</li>
                                        <li>Nhập số lượng vào các ô trong bảng ma trận.</li>
                                        <li>Nhấn <strong>Lưu thay đổi</strong>.</li>
                                    </ol>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="font-semibold text-gray-800 mb-2">Cách 2: Nhập bằng Excel (Mới)</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                                        <li>Nhấn nút <strong>Xuất Excel</strong> để tải file mẫu hiện tại về máy.</li>
                                        <li>Chỉnh sửa số lượng tồn kho trong file Excel (Không sửa ID/Tên).</li>
                                        <li>Nhấn <strong>Nhập Excel</strong> và chọn file vừa sửa.</li>
                                        <li>Kiểm tra lại dữ liệu ở bảng xem trước và nhấn <strong>Xác nhận nhập</strong>.</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Prize Mechanism */}
                        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
                            <h3 className="font-bold text-amber-900 mb-4">⚙️ Cơ chế hoạt động của Quà</h3>
                            <div className="space-y-4 text-amber-800">
                                <div>
                                    <h4 className="font-semibold mb-1">Khi quà còn số lượng (≥ 1):</h4>
                                    <p className="text-sm">Vòng quay có thể dừng vào ô quà đó. Khi trúng, hệ thống tự động trừ 1 trong kho.</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">Khi quà hết (= 0):</h4>
                                    <p className="text-sm">Vòng quay <strong>sẽ không bao giờ</strong> dừng vào ô quà đó nữa (dù ô vẫn hiển thị trên vòng quay).</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">Khi tất cả quà đều hết:</h4>
                                    <p className="text-sm">Nếu có ô &quot;Không trúng&quot; → Khách luôn quay vào ô này.<br />Nếu không có ô &quot;Không trúng&quot; → Hệ thống báo lỗi, không quay được.</p>
                                </div>
                            </div>
                        </div>

                        {/* Voucher Unlimited Tip */}
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="font-bold text-blue-900 mb-3">💡 Mẹo: Voucher &quot;Vô hạn&quot;</h3>
                            <p className="text-blue-800 mb-3">
                                Nếu bạn muốn voucher luôn có thể trúng mà không lo hết hàng, hãy nhập số lượng lớn:
                            </p>
                            <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <code className="text-lg font-mono text-blue-600">99999</code>
                                <p className="text-sm text-gray-600 mt-2">
                                    Với số lượng này, voucher gần như &quot;vô hạn&quot; trong suốt chương trình.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Vouchers */}
                    <section id="vouchers" className="scroll-mt-12 border-t border-gray-200 pt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                                <Ticket className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Hệ thống Voucher</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">Đồng bộ từ KiotViet</h3>
                                <p className="text-gray-600">
                                    Hệ thống tự động lấy danh sách Đợt phát hành Voucher từ KiotViet.
                                    Vào menu <strong>Chiến dịch Voucher</strong> để xem và đồng bộ thủ công nếu cần.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">Voucher đã phát hành</h3>
                                <p className="text-gray-600 mb-2">
                                    Vào menu <strong>Voucher đã phát</strong> để xem danh sách khách hàng đã trúng voucher.
                                </p>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium text-gray-900">Tính năng mới: Xem lại Email</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Tại danh sách voucher, nhấn vào biểu tượng lá thư 📧 để xem trước nội dung email (bao gồm mã QR) đã gửi cho khách.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Email */}
                    <section id="email" className="scroll-mt-12 border-t border-gray-200 pt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Cấu hình Email & QR</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Tùy chỉnh nội dung email gửi cho khách hàng khi trúng giải.
                        </p>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start gap-2">
                                <div className="mt-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full flex-none" />
                                <span>Vào <strong>Cài đặt</strong> → <strong>Email Template</strong>.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="mt-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full flex-none" />
                                <span>Sử dụng các biến như <code>{`{{voucher_code}}`}</code>, <code>{`{{value}}`}</code>, <code>{`{{customer_name}}`}</code> để cá nhân hóa.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="mt-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full flex-none" />
                                <span><strong>Mã QR:</strong> Sử dụng biến <code>{`{{qr_code}}`}</code> trong thẻ <code>&lt;img&gt;</code> để hiển thị mã QR cho phép quét nhanh tại quầy.</span>
                            </li>
                        </ul>
                    </section>

                    {/* FAQ */}
                    <section id="faq" className="scroll-mt-12 border-t border-gray-200 pt-12 pb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                                <HelpCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Câu hỏi thường gặp</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <h4 className="font-bold text-gray-900 mb-2">Tại sao khách nhập mã hóa đơn nhưng báo lỗi?</h4>
                                <p className="text-gray-600 text-sm">Kiểm tra lại: 1. Mã hóa đơn có chính xác không? 2. Hóa đơn có thuộc ngày diễn ra sự kiện không? 3. Giá trị hóa đơn có đủ mức tối thiểu không?</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <h4 className="font-bold text-gray-900 mb-2">Làm sao để hủy voucher đã phát nhầm?</h4>
                                <p className="text-gray-600 text-sm">Hiện tại hệ thống chưa hỗ trợ hủy voucher trực tiếp từ Admin Panel để đảm bảo tính toàn vẹn dữ liệu. Vui lòng xử lý trên KiotViet.</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <h4 className="font-bold text-gray-900 mb-2">Khách không nhận được email?</h4>
                                <p className="text-gray-600 text-sm">Yêu cầu khách kiểm tra hộp thư Spam/Junk. Nếu vẫn không thấy, vào &quot;Voucher đã phát&quot; để kiểm tra trạng thái gửi và xác nhận lại địa chỉ email.</p>
                            </div>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
