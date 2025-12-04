# 🎰 Lucky Spin - Vòng Quay May Mắn

Hệ thống vòng quay may mắn đa sự kiện, tích hợp KiotViet API cho chuỗi cửa hàng.

## ✨ Tính năng

- 🎯 **Multi-event**: Hỗ trợ nhiều sự kiện (Noel, Tết, Khai trương...)
- 🏪 **Multi-branch**: Quản lý chi nhánh với inventory riêng, đồng bộ từ KiotViet
- 🎁 **Flexible prizes**: Voucher, quà vật lý, giảm giá, không trúng
- 📊 **Admin Panel**: Dashboard, quản lý events, inventory, reports
- 🔐 **Admin Auth**: Đăng nhập bằng username/password, hỗ trợ multi-user
- 🔗 **KiotViet API**: Xác thực hóa đơn & đồng bộ chi nhánh realtime
- 🎲 **Server-side random**: Weighted random đảm bảo công bằng
- 📜 **Lịch sử quay**: Hiển thị công khai lịch sử quay thưởng với phân trang
- ✅ **Invoice validation**: Kiểm tra ngày hóa đơn trong thời gian chương trình

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
ADMIN_USERS=admin:Dat@6789,mkt:MKT@438
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
| `/admin/settings` | Cài đặt & kiểm tra KiotViet |

## 🔄 Flow hoạt động

```
1. Admin đăng nhập → tạo sự kiện + quà + điều kiện
2. Admin cấu hình tồn kho cho từng chi nhánh
3. Khách mua hàng tại cửa hàng, nhận hóa đơn
4. Khách nhập mã hóa đơn vào /spin
5. Hệ thống validate với KiotViet (kiểm tra ngày HD)
6. Tính số lượt quay theo giá trị hóa đơn
7. Khách quay, hệ thống random quà & trừ kho
8. Hiển thị kết quả, lưu log
```

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Middleware (Auth)
- **Database**: PostgreSQL (Supabase)
- **External API**: KiotViet
- **Deployment**: Vercel

## 📝 License

MIT
