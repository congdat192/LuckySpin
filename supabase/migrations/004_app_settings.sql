-- App Settings table for storing configuration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Insert default email template
INSERT INTO app_settings (key, value) VALUES (
    'email_template',
    '{
        "subject": "🎁 Voucher {{value}}đ - Chúc mừng bạn đã trúng thưởng!",
        "template": "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head><body style=\"margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\"><tr><td style=\"background: linear-gradient(135deg, #c41e3a 0%, #165b33 100%); padding: 30px; text-align: center;\"><h1 style=\"color: #ffffff; margin: 0; font-size: 28px;\">🎄 Chúc Mừng Giáng Sinh! 🎄</h1><p style=\"color: #ffd700; margin: 10px 0 0;\">Bạn đã trúng thưởng từ LuckySpin</p></td></tr><tr><td style=\"padding: 30px; text-align: center;\"><h2 style=\"color: #333; margin: 0 0 10px;\">Voucher của bạn</h2><div style=\"background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%); padding: 20px 30px; border-radius: 12px; display: inline-block; margin: 20px 0;\"><p style=\"margin: 0; font-size: 36px; font-weight: bold; color: #333; letter-spacing: 3px;\">{{voucher_code}}</p></div><p style=\"font-size: 24px; color: #c41e3a; font-weight: bold; margin: 20px 0;\">Trị giá: {{value}}đ</p></td></tr><tr><td style=\"padding: 0 30px 30px;\"><table width=\"100%\" style=\"background-color: #f9f9f9; border-radius: 8px; padding: 20px;\"><tr><td style=\"padding: 10px;\"><p style=\"margin: 0 0 10px; color: #666;\"><strong>📅 Hạn sử dụng:</strong> {{expire_date}}</p><p style=\"margin: 0; color: #666;\"><strong>📋 Điều kiện:</strong> {{conditions}}</p></td></tr></table></td></tr><tr><td style=\"background-color: #165b33; padding: 20px; text-align: center;\"><p style=\"color: #ffffff; margin: 0; font-size: 14px;\">Cảm ơn bạn đã tham gia LuckySpin! 🎁</p></td></tr></table></body></html>"
    }'::jsonb
) ON CONFLICT (key) DO NOTHING;
