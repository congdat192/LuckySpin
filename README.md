# 🎰 Lucky Spin - Vòng Quay May Mắn

Hệ thống vòng quay may mắn đa sự kiện, tích hợp KiotViet API cho chuỗi cửa hàng.

## ✨ Tính năng

- 🎯 **Multi-event**: Hỗ trợ nhiều sự kiện (Noel, Tết, Khai trương...)
- 🏪 **Multi-branch**: 9 chi nhánh với inventory riêng
- 🎁 **Flexible prizes**: Voucher, quà vật lý, giảm giá
- 📊 **Admin Panel**: Dashboard, quản lý events, inventory, reports
- 🔗 **KiotViet API**: Xác thực hóa đơn realtime
- 🎲 **Server-side random**: Weighted random đảm bảo công bằng

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
│   │   ├── api/           # API routes
│   │   ├── admin/         # Admin Panel
│   │   ├── spin/          # Trang quay
│   │   └── page.tsx       # Landing page
│   ├── components/        # UI components
│   ├── lib/               # Utils, Supabase, KiotViet
│   └── types/             # TypeScript types
└── supabase/
    └── schema.sql         # Database schema
```

## 🔑 Các trang chính

| URL | Mô tả |
|-----|-------|
| `/` | Landing page |
| `/spin` | Trang quay thưởng cho khách |
| `/admin` | Dashboard admin |
| `/admin/events` | Quản lý sự kiện |
| `/admin/branches` | Quản lý chi nhánh |
| `/admin/inventory` | Quản lý tồn kho |
| `/admin/reports` | Báo cáo & thống kê |
| `/admin/settings` | Cài đặt KiotViet |

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **External API**: KiotViet

## 📝 License

MIT
