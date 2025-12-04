# 🎰 Lucky Spin - Vòng Quay May Mắn

Hệ thống vòng quay may mắn đa sự kiện, tích hợp KiotViet API cho chuỗi cửa hàng.

## ✨ Tính năng

- 🎯 **Multi-event**: Hỗ trợ nhiều sự kiện (Noel, Tết, Khai trương...)
- 🏪 **Multi-branch**: Quản lý chi nhánh với inventory riêng, đồng bộ từ KiotViet
- 🎁 **Flexible prizes**: Voucher, quà vật lý, giảm giá, không trúng
- 📊 **Admin Panel**: Dashboard, quản lý events, inventory, reports
- 🔗 **KiotViet API**: Xác thực hóa đơn & đồng bộ chi nhánh realtime
- 🎲 **Server-side random**: Weighted random đảm bảo công bằng
- 📜 **Lịch sử quay**: Hiển thị công khai lịch sử quay thưởng với phân trang

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
```

### 3. Setup Database

Chạy file `supabase/schema.sql` trong Supabase SQL Editor.

### 4. Khởi động

```bash
npm run dev
```

Truy cập: http://localhost:3000

## 📁 Cấu trúc

```
lucky-spin/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── admin/              # Admin APIs
│   │   │   │   ├── branches/       # CRUD branches + sync KiotViet
│   │   │   │   ├── dashboard/      # Dashboard stats
│   │   │   │   ├── events/         # CRUD events
│   │   │   │   ├── inventory/      # Quản lý tồn kho
│   │   │   │   └── reports/        # Báo cáo
│   │   │   ├── event/              # Get active event
│   │   │   ├── invoice/validate/   # Validate hóa đơn KiotViet
│   │   │   └── spin/               # Spin + history
│   │   ├── admin/                  # Admin Panel pages
│   │   ├── spin/                   # Trang quay thưởng
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── SpinWheel.tsx           # Component vòng quay
│   │   └── InvoiceForm.tsx         # Form nhập hóa đơn
│   ├── lib/
│   │   ├── kiotviet.ts             # KiotViet API client
│   │   ├── spin-logic.ts           # Logic random quà
│   │   └── supabase/               # Supabase clients
│   └── types/                      # TypeScript types
└── supabase/
    └── schema.sql                  # Database schema
```

## 🔑 Các trang chính

| URL | Mô tả |
|-----|-------|
| `/` | Landing page |
| `/spin` | Trang quay thưởng cho khách (có lịch sử quay) |
| `/admin` | Dashboard - tổng quan hoạt động |
| `/admin/events` | Quản lý sự kiện + prizes |
| `/admin/branches` | Quản lý chi nhánh, sync từ KiotViet |
| `/admin/inventory` | Quản lý tồn kho quà theo chi nhánh |
| `/admin/reports` | Báo cáo & thống kê chi tiết |
| `/admin/settings` | Cài đặt & kiểm tra KiotViet |

## 🔄 Flow hoạt động

```
1. Admin tạo sự kiện + quà + điều kiện
2. Admin cấu hình tồn kho cho từng chi nhánh
3. Khách mua hàng tại cửa hàng, nhận hóa đơn
4. Khách nhập mã hóa đơn vào /spin
5. Hệ thống validate với KiotViet, tính số lượt
6. Khách quay, hệ thống random quà & trừ kho
7. Hiển thị kết quả, lưu log
```

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **External API**: KiotViet
- **Deployment**: Vercel

## 📝 License

MIT
