// KiotViet API Integration

interface KiotVietTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

interface KiotVietConfig {
    clientId: string;
    clientSecret: string;
    retailer: string;
}

// Token cache
let tokenCache: {
    token: string;
    expiresAt: number;
} | null = null;

function getConfig(): KiotVietConfig {
    const clientId = process.env.KIOTVIET_CLIENT_ID;
    const clientSecret = process.env.KIOTVIET_CLIENT_SECRET;
    const retailer = process.env.KIOTVIET_RETAILER;

    if (!clientId || !clientSecret || !retailer) {
        throw new Error('KiotViet configuration is missing');
    }

    return { clientId, clientSecret, retailer };
}

async function getAccessToken(): Promise<string> {
    // Check cache
    if (tokenCache && Date.now() < tokenCache.expiresAt) {
        return tokenCache.token;
    }

    const config = getConfig();

    // Build body as URL-encoded string per KiotViet docs
    const body = `scopes=PublicApi.Access&grant_type=client_credentials&client_id=${encodeURIComponent(config.clientId)}&client_secret=${encodeURIComponent(config.clientSecret)}`;

    const response = await fetch('https://id.kiotviet.vn/connect/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('KiotViet token error:', response.status, errorText);
        throw new Error(`Failed to get KiotViet access token: ${response.status}`);
    }

    const data: KiotVietTokenResponse = await response.json();

    // Cache token (expire 5 minutes early)
    tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    };

    return data.access_token;
}

export interface KiotVietInvoice {
    id: number;
    code: string;
    purchaseDate: string;
    branchId: number;
    branchName: string;
    total: number;
    totalPayment: number;
    discount: number;
    status: number;
    statusValue: string;
    // Customer fields from docs - at root level
    customerId?: number;
    customerCode?: string;
    customerName?: string;
    // Legacy nested customer object (just in case)
    customer?: {
        id: number;
        code: string;
        name: string;
        contactNumber: string;
        email?: string;
    };
    invoiceDetails: {
        productId: number;
        productCode: string;
        productName: string;
        quantity: number;
        price: number;
        discount: number;
        subTotal: number;
    }[];
}

interface KiotVietInvoicesResponse {
    total: number;
    pageSize: number;
    data: KiotVietInvoice[];
}

export async function getInvoiceByCode(code: string): Promise<KiotVietInvoice | null> {
    const config = getConfig();
    const token = await getAccessToken();

    // Use correct endpoint per KiotViet docs: /invoices/code/{code}
    const response = await fetch(
        `https://public.kiotapi.com/invoices/code/${encodeURIComponent(code)}`,
        {
            headers: {
                'Retailer': config.retailer,
                'Authorization': `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        const errorText = await response.text();
        console.error('KiotViet invoice error:', response.status, errorText);
        throw new Error(`KiotViet API error: ${response.status}`);
    }

    const data: KiotVietInvoice = await response.json();
    return data;
}

export interface KiotVietBranch {
    id: number;
    branchName: string;
    branchCode: string;
    contactNumber?: string;
    email?: string;
    address?: string;
}

export async function getBranches(): Promise<KiotVietBranch[]> {
    const config = getConfig();
    const token = await getAccessToken();

    const response = await fetch('https://public.kiotapi.com/branches?pageSize=100', {
        headers: {
            'Retailer': config.retailer,
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('KiotViet branches error:', response.status, errorText);
        throw new Error(`KiotViet API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
}
