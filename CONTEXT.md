# Lucky Spin - Project Context

## Tổng quan

Lucky Spin là hệ thống vòng quay may mắn cho chuỗi cửa hàng, tích hợp với KiotViet để xác thực hóa đơn và tính số lượt quay dựa trên giá trị đơn hàng.

## Kiến trúc

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   Client    │────▶│  Next.js API │────▶│  Supabase │
│  (Browser)  │     │   Routes     │     │    DB     │
└─────────────┘     └──────┬───────┘     └───────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  KiotViet    │
                    │     API      │
                    └──────────────┘
```

## Database Schema

### Tables

1. **events** - Sự kiện (Noel, Tết...)
2. **branches** - Chi nhánh cửa hàng (sync từ KiotViet)
3. **event_rules** - Điều kiện tham gia + công thức tính lượt
4. **event_prizes** - Danh sách quà của sự kiện
5. **branch_prize_inventory** - Tồn kho quà theo chi nhánh + event
6. **invoice_sessions** - Phiên hóa đơn đã validate
7. **spin_logs** - Lịch sử quay thưởng

## API Endpoints

### Public APIs

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/event` | GET | Lấy sự kiện active + prizes |
| `/api/invoice/validate` | POST | Xác thực hóa đơn với KiotViet |
| `/api/spin` | POST | Thực hiện quay thưởng |
| `/api/spin/history` | GET | Lịch sử quay (phân trang) |

### Admin APIs (Yêu cầu đăng nhập)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/admin/auth` | POST/DELETE | Login/Logout |
| `/api/admin/dashboard` | GET | Stats dashboard |
| `/api/admin/events` | GET/POST | CRUD events |
| `/api/admin/events/[id]` | GET/PUT/DELETE | Single event |
| `/api/admin/branches` | GET/POST | CRUD branches |
| `/api/admin/branches/[id]` | GET/PUT/DELETE | Single branch |
| `/api/admin/branches/sync` | POST | Sync từ KiotViet |
| `/api/admin/inventory` | GET/POST | Quản lý tồn kho |
| `/api/admin/reports` | GET | Báo cáo chi tiết |

## Authentication

- **Middleware**: Bảo vệ tất cả routes `/admin/*`
- **Multi-user**: Cấu hình qua `ADMIN_USERS` env (format: `user1:pass1,user2:pass2`)
- **Session**: Cookie-based, expire sau 7 ngày
- **Login page**: `/login`

## Business Logic

### Invoice Validation Flow

1. Khách nhập mã hóa đơn
2. API gọi KiotViet để lấy thông tin HD
3. Kiểm tra ngày HD trong thời gian sự kiện
4. Validate điều kiện (giá trị tối thiểu, chi nhánh...)
5. Tính số lượt quay theo công thức (fixed hoặc step)
6. Tạo session với thông tin: tên KH, mã HD, giá trị, số lượt

### Spin Flow

1. Client gọi `/api/spin` với session_id + turn_index
2. Server kiểm tra session còn lượt
3. Lấy inventory theo branch_id + prize_id
4. Weighted random chọn prize (check quantity > 0)
5. Trừ inventory nếu trúng quà thật
6. Update used_turns, ghi spin_log
7. Frontend animate vòng quay
8. Refresh lịch sử quay

### Event Update Logic

- **Đổi tên/thông tin event**: Giữ nguyên prizes và inventory
- **Sửa prize**: Update prize hiện có theo ID
- **Thêm prize mới**: Insert với ID mới
- **Xóa prize**: Xóa kèm inventory và spin_logs liên quan

## Security

- **Middleware Auth**: Cookie-based cho admin routes
- **RLS**: Row Level Security trong Supabase
- **Service Role**: Admin APIs dùng service role key
- **Server-side random**: Không thể cheat từ client

## Development

```bash
npm run dev    # Dev server
npm run build  # Build production
npm run lint   # Lint check
```

## Deployment (Vercel)

Environment Variables cần set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KIOTVIET_CLIENT_ID`
- `KIOTVIET_CLIENT_SECRET`
- `KIOTVIET_RETAILER`
- `ADMIN_USERS`

## Recent Updates (Dec 2024)

- ✅ Admin authentication với multi-user
- ✅ Invoice date validation (trong thời gian event)
- ✅ Preserve prize IDs khi update event
- ✅ Fix inventory save với event_id
- ✅ Fix FK constraints khi delete prizes
- ✅ Spin history với phân trang
- ✅ Dashboard với stats realtime
- ✅ Branch sync từ KiotViet
