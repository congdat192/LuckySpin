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
2. **branches** - Chi nhánh cửa hàng  
3. **event_rules** - Điều kiện tham gia + công thức tính lượt
4. **event_prizes** - Danh sách quà của sự kiện
5. **branch_prize_inventory** - Tồn kho quà theo chi nhánh
6. **invoice_sessions** - Phiên hóa đơn đã validate
7. **spin_logs** - Lịch sử quay thưởng

### Relationships

```
events
  ├── event_rules (1:n)
  ├── event_prizes (1:n)
  │     └── branch_prize_inventory (1:n per branch)
  ├── invoice_sessions (1:n)
  └── spin_logs (1:n)

branches
  ├── branch_prize_inventory (1:n)
  ├── invoice_sessions (1:n)
  └── spin_logs (1:n)
```

## API Endpoints

### Public APIs

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/event` | GET | Lấy sự kiện active + prizes |
| `/api/invoice/validate` | POST | Xác thực hóa đơn với KiotViet |
| `/api/spin` | POST | Thực hiện quay thưởng |

### Admin APIs

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/admin/dashboard` | GET | Stats dashboard |
| `/api/admin/events` | GET/POST | CRUD events |
| `/api/admin/events/[id]` | GET/PUT/DELETE | Single event |
| `/api/admin/branches` | GET/POST | CRUD branches |
| `/api/admin/branches/[id]` | GET/PUT/DELETE | Single branch |

## Business Logic

### Invoice Validation Flow

1. Staff nhập mã hóa đơn
2. API gọi KiotViet để lấy thông tin HD
3. Validate điều kiện (giá trị tối thiểu, chi nhánh...)
4. Tính số lượt quay theo công thức (fixed hoặc step)
5. Tạo session cho khách quay

### Spin Flow

1. Client gọi `/api/spin` với session_id
2. Server kiểm tra session còn lượt không
3. Weighted random chọn prize (có check inventory)
4. Trừ inventory nếu trúng quà vật lý
5. Ghi log + trả về kết quả
6. Frontend animate vòng quay đến kết quả

### Turn Calculation

**Fixed**: Mỗi HD = N lượt (VD: 1 lượt/HD)

**Step (bậc thang)**:
- 500K - 999K → 1 lượt
- 1M - 1.9M → 2 lượt  
- 2M+ → 3 lượt

## Security

- **RLS**: Row Level Security cho tất cả tables
- **Service Role**: Admin APIs dùng service role key (bypass RLS)
- **Environment Variables**: Credentials không commit vào git
- **Server-side random**: Không thể cheat từ client

## Development

```bash
# Dev server
npm run dev

# Build
npm run build

# Type check
npm run type-check
```

## Deployment

1. Push code lên GitHub
2. Connect Vercel với repo
3. Set environment variables trong Vercel
4. Deploy

## Next Steps (Roadmap)

- [ ] Authentication cho Admin Panel
- [ ] Export Excel reports
- [ ] Real-time inventory sync
- [ ] QR code scan hóa đơn
- [ ] SMS notification khi trúng thưởng
