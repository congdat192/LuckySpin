-- Migration: Add email_data column to issued_vouchers
-- Run this in Supabase SQL Editor

ALTER TABLE issued_vouchers ADD COLUMN IF NOT EXISTS email_data JSONB;

-- email_data structure:
-- {
--   "voucher_code": "XMV89DD8",
--   "value": "50.000",
--   "expire_date": "4/1/2026", 
--   "conditions": "Áp dụng cho hóa đơn từ 300K",
--   "qr_code_url": "https://..../qr_xxx.png",
--   "recipient_email": "customer@email.com",
--   "sent_at": "2024-12-05T14:30:00Z",
--   "subject": "🎁 Voucher 50.000đ - Chúc mừng bạn đã trúng thưởng!"
-- }

COMMENT ON COLUMN issued_vouchers.email_data IS 'JSONB storing email template values for preview purposes';
