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
| `/api/spin/history` | GET | Lịch sử quay (phân trang) |

### Admin APIs

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/admin/dashboard` | GET | Stats dashboard |
| `/api/admin/events` | GET/POST | CRUD events |
| `/api/admin/events/[id]` | GET/PUT/DELETE | Single event |
| `/api/admin/branches` | GET/POST | CRUD branches |
| `/api/admin/branches/[id]` | GET/PUT/DELETE | Single branch |
| `/api/admin/branches/sync` | POST | Sync từ KiotViet |
| `/api/admin/inventory` | GET/POST | Quản lý tồn kho |
| `/api/admin/reports` | GET | Báo cáo chi tiết |
| `/api/admin/settings/kiotviet-status` | GET | Check KiotViet connection |

## Business Logic

### Invoice Validation Flow

1. Staff nhập mã hóa đơn
2. API gọi KiotViet để lấy thông tin HD
3. Validate điều kiện (giá trị tối thiểu, chi nhánh...)
4. Tính số lượt quay theo công thức (fixed hoặc step)
5. Tạo session cho khách quay
6. Trả về thông tin: tên KH, mã HD, giá trị HD, số lượt

### Spin Flow

1. Client gọi `/api/spin` với session_id + turn_index
2. Server kiểm tra session còn lượt không
3. Lấy inventory theo branch_id + prize_id (qua event)
4. Weighted random chọn prize (check quantity > 0)
5. Trừ inventory nếu trúng quà thật
6. Update used_turns trong session
7. Ghi spin_log
8. Frontend animate vòng quay đến kết quả
9. Refresh lịch sử quay

### Turn Calculation

**Fixed**: Mỗi HD = N lượt (VD: 1 lượt/HD)

**Step (bậc thang)**:
- 500K - 999K → 1 lượt
- 1M - 1.9M → 2 lượt  
- 2M+ → 3 lượt

### KiotViet Integration

**Invoice API**: Lấy thông tin hóa đơn bằng mã
- Endpoint: `GET /invoices/code/{code}`
- Response: customerName, total, branchId, products...

**Branch Sync**: Đồng bộ chi nhánh từ KiotViet
- Endpoint: `GET /branches`
- Lưu vào DB với kiotviet_branch_id

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

# Lint
npm run lint
```

## Deployment

1. Push code lên GitHub
2. Connect Vercel với repo
3. Set environment variables trong Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `KIOTVIET_CLIENT_ID`
   - `KIOTVIET_CLIENT_SECRET`
   - `KIOTVIET_RETAILER`
4. Deploy tự động khi push

## Recent Updates (Dec 2024)

- ✅ KiotViet branch sync với nút UI
- ✅ Hiển thị thông tin khách hàng từ KiotViet
- ✅ Fix inventory deduction khi quay
- ✅ Dashboard với thống kê realtime
- ✅ Reports với filter và pagination
- ✅ Spin history công khai với phân trang
- ✅ Format datetime theo timezone VN

## Next Steps (Roadmap)

- [ ] Authentication cho Admin Panel
- [ ] Export Excel reports
- [ ] Real-time inventory sync
- [ ] QR code scan hóa đơn
- [ ] SMS notification khi trúng thưởng
