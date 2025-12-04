-- Lucky Spin Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BRANCHES TABLE
-- ============================================
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    kiotviet_branch_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert 9 branches
INSERT INTO branches (code, name) VALUES
    ('CN01', 'Chi nhánh 1'),
    ('CN02', 'Chi nhánh 2'),
    ('CN03', 'Chi nhánh 3'),
    ('CN04', 'Chi nhánh 4'),
    ('CN05', 'Chi nhánh 5'),
    ('CN06', 'Chi nhánh 6'),
    ('CN07', 'Chi nhánh 7'),
    ('CN08', 'Chi nhánh 8'),
    ('CN09', 'Chi nhánh 9');

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),
    theme_config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENT RULES TABLE
-- ============================================
CREATE TABLE event_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('eligibility', 'turn_calculation')),
    conditions JSONB NOT NULL,
    formula JSONB,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENT PRIZES TABLE
-- ============================================
CREATE TABLE event_prizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    prize_type VARCHAR(50) CHECK (prize_type IN ('physical', 'voucher', 'discount', 'no_prize')),
    value DECIMAL(15,2),
    default_weight INT DEFAULT 100,
    display_order INT DEFAULT 0,
    color VARCHAR(20) DEFAULT '#3B82F6',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BRANCH PRIZE INVENTORY TABLE
-- ============================================
CREATE TABLE branch_prize_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id),
    prize_id UUID REFERENCES event_prizes(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    initial_quantity INT NOT NULL DEFAULT 0,
    remaining_quantity INT NOT NULL DEFAULT 0,
    weight_override INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, prize_id, event_id)
);

-- ============================================
-- INVOICE SESSIONS TABLE
-- ============================================
CREATE TABLE invoice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id),
    invoice_code VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    branch_id UUID REFERENCES branches(id),
    invoice_total DECIMAL(15,2),
    invoice_data JSONB,
    total_turns INT DEFAULT 0,
    used_turns INT DEFAULT 0,
    is_valid BOOLEAN DEFAULT true,
    invalid_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, invoice_code)
);

-- ============================================
-- SPIN LOGS TABLE
-- ============================================
CREATE TABLE spin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES invoice_sessions(id),
    event_id UUID REFERENCES events(id),
    branch_id UUID REFERENCES branches(id),
    turn_index INT NOT NULL,
    prize_won UUID REFERENCES event_prizes(id),
    spun_at TIMESTAMPTZ DEFAULT NOW(),
    staff_id VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    metadata JSONB DEFAULT '{}'
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_event_rules_event_id ON event_rules(event_id);
CREATE INDEX idx_event_prizes_event_id ON event_prizes(event_id);
CREATE INDEX idx_branch_inventory_event ON branch_prize_inventory(event_id);
CREATE INDEX idx_branch_inventory_branch ON branch_prize_inventory(branch_id);
CREATE INDEX idx_invoice_sessions_event ON invoice_sessions(event_id);
CREATE INDEX idx_invoice_sessions_invoice ON invoice_sessions(invoice_code);
CREATE INDEX idx_spin_logs_session ON spin_logs(session_id);
CREATE INDEX idx_spin_logs_event ON spin_logs(event_id);
CREATE INDEX idx_spin_logs_date ON spin_logs(spun_at);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_prize_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Public read access for active events (for spin page)
CREATE POLICY "Public can view active events"
    ON events FOR SELECT
    USING (status = 'active');

CREATE POLICY "Public can view prizes of active events"
    ON event_prizes FOR SELECT
    USING (event_id IN (SELECT id FROM events WHERE status = 'active'));

CREATE POLICY "Public can view branches"
    ON branches FOR SELECT
    USING (is_active = true);

-- Authenticated users (admin) have full access
CREATE POLICY "Authenticated users can manage events"
    ON events FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage rules"
    ON event_rules FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage prizes"
    ON event_prizes FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage inventory"
    ON branch_prize_inventory FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage sessions"
    ON invoice_sessions FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage logs"
    ON spin_logs FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage branches"
    ON branches FOR ALL
    USING (auth.role() = 'authenticated');

-- Service role bypass (for Edge Functions)
CREATE POLICY "Service role bypass events"
    ON events FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role bypass sessions"
    ON invoice_sessions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role bypass inventory"
    ON branch_prize_inventory FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role bypass logs"
    ON spin_logs FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');
