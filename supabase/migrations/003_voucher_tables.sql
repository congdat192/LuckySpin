-- Migration: Create voucher tables
-- Run this in Supabase SQL Editor

-- Table: voucher_campaigns (Đợt phát hành voucher từ KiotViet)
CREATE TABLE IF NOT EXISTS voucher_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiotviet_campaign_id BIGINT NOT NULL UNIQUE,
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    expire_days INT,
    conditions_text TEXT,
    is_active BOOLEAN DEFAULT true,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: issued_vouchers (Voucher đã phát hành)
CREATE TABLE IF NOT EXISTS issued_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES voucher_campaigns(id),
    spin_log_id UUID REFERENCES spin_logs(id),
    voucher_code VARCHAR(50) NOT NULL,
    kiotviet_voucher_id BIGINT,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    value DECIMAL(15,2),
    release_date TIMESTAMPTZ,
    expire_date TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'issued',
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    original_voucher_id UUID REFERENCES issued_vouchers(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add voucher_campaign_id to event_prizes table
ALTER TABLE event_prizes ADD COLUMN IF NOT EXISTS voucher_campaign_id UUID REFERENCES voucher_campaigns(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_voucher_campaigns_kiotviet_id ON voucher_campaigns(kiotviet_campaign_id);
CREATE INDEX IF NOT EXISTS idx_issued_vouchers_campaign ON issued_vouchers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_issued_vouchers_spin_log ON issued_vouchers(spin_log_id);
CREATE INDEX IF NOT EXISTS idx_issued_vouchers_status ON issued_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_issued_vouchers_voucher_code ON issued_vouchers(voucher_code);

-- Enable RLS
ALTER TABLE voucher_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_vouchers ENABLE ROW LEVEL SECURITY;

-- Policies for voucher_campaigns
CREATE POLICY "Allow public read voucher_campaigns" ON voucher_campaigns
    FOR SELECT USING (true);

CREATE POLICY "Allow service role all on voucher_campaigns" ON voucher_campaigns
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for issued_vouchers
CREATE POLICY "Allow public read issued_vouchers" ON issued_vouchers
    FOR SELECT USING (true);

CREATE POLICY "Allow service role all on issued_vouchers" ON issued_vouchers
    FOR ALL USING (auth.role() = 'service_role');
