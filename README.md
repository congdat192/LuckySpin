# 🎰 Lucky Spin - Vòng Quay May Mắn

Hệ thống vòng quay may mắn đa sự kiện, tích hợp KiotViet API cho chuỗi cửa hàng.

## ✨ Tính năng

- 🎄 **Christmas Theme**: Giao diện Giáng sinh với tuyết rơi, đèn nháy
- 🎯 **Multi-event**: Hỗ trợ nhiều sự kiện (Noel, Tết, Khai trương...)
- 🏪 **Multi-branch**: Quản lý chi nhánh với inventory riêng, đồng bộ từ KiotViet
- 🎁 **Flexible prizes**: Voucher, quà vật lý, giảm giá, không trúng
- 🎫 **Voucher Integration**: Tích hợp KiotViet Voucher API - tự động phát hành voucher
- 📧 **Email Voucher**: Gửi voucher qua email với template tùy chỉnh
- 📊 **Admin Panel**: Dashboard, quản lý events, inventory, reports
- 🔐 **Admin Auth**: Đăng nhập bằng username/password, hỗ trợ multi-user
- 🔗 **KiotViet API**: Xác thực hóa đơn & đồng bộ chi nhánh realtime
- 🎲 **Server-side random**: Weighted random đảm bảo công bằng
- 📜 **Lịch sử quay**: Click vào quà để xem chi tiết voucher
- ✅ **Invoice validation**: Kiểm tra ngày hóa đơn, giá trị tối thiểu
- ⏱️ **Rate limiting**: Giới hạn 3 lần tra cứu/phút cho mỗi IP

## 🚀 Quick Start

### 1. Cài đặt

```bash
cd lucky-spin
npm install
```

### 2. Cấu hình môi trường

Copy `.env.local.example` → `.env.local` và điền thông tin:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# KiotViet
KIOTVIET_CLIENT_ID=xxx
KIOTVIET_CLIENT_SECRET=xxx
KIOTVIET_RETAILER=tencuahang

# Admin (format: user1:pass1,user2:pass2)
ADMIN_USERS=admin:password123

# Email (Resend)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=Your Store <noreply@yourdomain.com>
```

### 3. Setup Database

Chạy file `supabase/schema.sql` trong Supabase SQL Editor.

### 4. Khởi động

```bash
npm run dev
```

Truy cập: http://localhost:3000

## 🔑 Các trang chính

| URL | Mô tả |
|-----|-------|
| `/` | Landing page |
| `/spin` | Trang quay thưởng (có lịch sử quay) |
| `/login` | Đăng nhập admin |
| `/admin` | Dashboard - tổng quan hoạt động |
| `/admin/events` | Quản lý sự kiện + prizes |
| `/admin/branches` | Quản lý chi nhánh, sync từ KiotViet |
| `/admin/inventory` | Quản lý tồn kho quà theo chi nhánh |
| `/admin/reports` | Báo cáo & thống kê chi tiết |
| `/admin/voucher-campaigns` | Đợt phát hành voucher từ KiotViet |
| `/admin/issued-vouchers` | Voucher đã phát hành |
| `/admin/settings` | Cài đặt & kiểm tra KiotViet |
| `/admin/settings/email-template` | Tùy chỉnh template email voucher |
| `/admin-doc` | Tài liệu hướng dẫn cho Admin |
| `/staff-doc` | Tài liệu hướng dẫn cho Nhân viên |

## 🔄 Flow hoạt động

```
1. Admin đăng nhập → tạo sự kiện + quà + điều kiện
2. Admin cấu hình tồn kho cho từng chi nhánh
3. Khách mua hàng tại cửa hàng, nhận hóa đơn
4. Khách nhập mã hóa đơn vào /spin
5. Hệ thống validate với KiotViet (kiểm tra ngày, giá trị HD)
6. Tính số lượt quay theo công thức (fixed/step)
7. Khách bấm nút quay ở giữa vòng quay
8. Hiển thị kết quả bottom sheet, lưu log
```

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Middleware (Auth)
- **Database**: PostgreSQL (Supabase)
- **External API**: KiotViet
- **Deployment**: Vercel

## 📝 License

MIT
