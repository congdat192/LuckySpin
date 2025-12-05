// Database types for Lucky Spin system

export interface Branch {
    id: string;
    code: string;
    name: string;
    kiotviet_branch_id: string | null;
    is_active: boolean;
    created_at: string;
}

export interface Event {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    start_date: string;
    end_date: string;
    status: 'draft' | 'active' | 'paused' | 'ended';
    theme_config: ThemeConfig;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface ThemeConfig {
    background_color?: string;
    primary_color?: string;
    wheel_colors?: string[];
    logo_url?: string;
}

export interface EventRule {
    id: string;
    event_id: string;
    rule_type: 'eligibility' | 'turn_calculation';
    conditions: EligibilityConditions | null;
    formula: TurnFormula | null;
    priority: number;
    is_active: boolean;
    created_at: string;
}

export interface EligibilityConditions {
    min_invoice_total?: number;
    max_invoice_total?: number;
    allowed_branches?: string[];
    excluded_branches?: string[];
    required_products?: string[];
    excluded_products?: string[];
    required_categories?: string[];
    customer_types?: string[];
}

export type TurnFormula =
    | { type: 'fixed'; value: number }
    | { type: 'step'; steps: StepConfig[] }
    | { type: 'formula'; expression: string; per_amount: number };

export interface StepConfig {
    min: number;
    max: number | null;
    turns: number;
}

export interface EventPrize {
    id: string;
    event_id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    prize_type: 'physical' | 'voucher' | 'discount' | 'no_prize';
    value: number | null;
    default_weight: number;
    display_order: number;
    color: string;
    text_color?: string;
    text_effect?: 'none' | 'shadow' | 'outline' | 'glow' | 'gold';
    metadata: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
}

export interface BranchPrizeInventory {
    id: string;
    branch_id: string;
    prize_id: string;
    event_id: string;
    initial_quantity: number;
    remaining_quantity: number;
    weight_override: number | null;
    is_active: boolean;
    created_at: string;
    // Joined fields
    prize?: EventPrize;
    branch?: Branch;
}

export interface InvoiceSession {
    id: string;
    event_id: string;
    invoice_code: string;
    customer_phone: string | null;
    customer_name: string | null;
    branch_id: string;
    invoice_total: number;
    invoice_data: KiotVietInvoice | null;
    total_turns: number;
    used_turns: number;
    is_valid: boolean;
    invalid_reason: string | null;
    created_at: string;
    // Joined fields
    branch?: Branch;
}

export interface SpinLog {
    id: string;
    session_id: string;
    event_id: string;
    branch_id: string;
    turn_index: number;
    prize_won: string;
    spun_at: string;
    staff_id: string | null;
    customer_phone: string | null;
    customer_name: string | null;
    metadata: Record<string, unknown>;
    // Joined fields
    prize?: EventPrize;
    session?: InvoiceSession;
}

// KiotViet API types
export interface KiotVietInvoice {
    id: number;
    code: string;
    purchaseDate: string;
    branchId: number;
    branchName: string;
    total: number;
    totalPayment: number;
    customer?: {
        id: number;
        code: string;
        name: string;
        contactNumber: string;
    };
    invoiceDetails: {
        productId: number;
        productCode: string;
        productName: string;
        quantity: number;
        price: number;
        subTotal: number;
    }[];
}

// API Request/Response types
export interface ValidateInvoiceRequest {
    invoice_code: string;
    event_id?: string;
}

export interface ValidateInvoiceResponse {
    success: boolean;
    data: {
        session_id: string;
        is_eligible: boolean;
        total_turns: number;
        remaining_turns: number;
        customer: {
            name: string | null;
            phone: string | null;
        };
        branch: {
            code: string;
            name: string;
        };
        invoice_total: number;
    } | {
        is_eligible: false;
        reason: string;
        invoice_total?: number;
        min_required?: number;
    };
}

export interface SpinRequest {
    session_id: string;
    turn_index: number;
}

export interface SpinResponse {
    success: boolean;
    data: {
        prize: {
            id: string;
            name: string;
            image_url: string | null;
            type: string;
            value: number | null;
            color: string;
        };
        remaining_turns: number;
        spin_id: string;
        prize_index: number; // For animation
    };
    error?: string;
}

// Admin types
export interface EventWithStats extends Event {
    total_spins: number;
    total_prizes_given: number;
    total_sessions: number;
}

export interface InventoryMatrix {
    prizes: EventPrize[];
    branches: Branch[];
    inventory: BranchPrizeInventory[];
}

export interface ReportFilters {
    event_id?: string;
    branch_id?: string;
    date_from?: string;
    date_to?: string;
    customer_phone?: string;
    invoice_code?: string;
}

export interface DashboardStats {
    total_spins_today: number;
    total_prizes_given_today: number;
    active_events: number;
    low_inventory_alerts: {
        prize_name: string;
        branch_name: string;
        remaining: number;
    }[];
}
