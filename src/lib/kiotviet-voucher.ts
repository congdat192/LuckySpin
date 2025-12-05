import { getKiotVietToken, KIOTVIET_API_BASE } from './kiotviet';

// Types
export interface VoucherCampaign {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
    startDate: string;
    endDate: string;
    expireTime: number;
    prereqPrice?: number;
    quantity: number;
    price: number;
    useVoucherCombineInvoice: boolean;
    isGlobal: boolean;
    voucherBranchs?: { branchId: number; branchName: string }[];
}

export interface Voucher {
    id: number;
    code: string;
    voucherCampaignId: number;
    releaseDate?: string;
    expireDate?: string;
    usedDate?: string;
    status: number; // 0: chưa sử dụng | 1: đã phát hành | 2: đã sử dụng | 3: đã hủy
    price: number;
    partnerName?: string;
}

// Get list of voucher campaigns from KiotViet (with pagination)
export async function getVoucherCampaigns(options?: {
    isActive?: boolean;
    id?: number;
}): Promise<VoucherCampaign[]> {
    const token = await getKiotVietToken();
    const allCampaigns: VoucherCampaign[] = [];
    let currentPage = 1;
    const pageSize = 100; // Max per page
    let hasMore = true;

    while (hasMore) {
        const params = new URLSearchParams();
        if (options?.isActive !== undefined) {
            params.append('isActive', options.isActive.toString());
        }
        if (options?.id) {
            params.append('id', options.id.toString());
        }
        params.append('includeVoucherBranchs', 'true');
        params.append('pageSize', pageSize.toString());
        params.append('currentItem', ((currentPage - 1) * pageSize).toString());

        const response = await fetch(
            `${KIOTVIET_API_BASE}/vouchercampaign?${params.toString()}`,
            {
                headers: {
                    'Retailer': process.env.KIOTVIET_RETAILER || '',
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('KiotViet get campaigns error:', error);
            throw new Error('Failed to get voucher campaigns from KiotViet');
        }

        const data = await response.json();
        const campaigns = data.data || [];
        allCampaigns.push(...campaigns);

        // Check if there are more pages
        hasMore = campaigns.length === pageSize;
        currentPage++;

        // Safety limit
        if (currentPage > 50) break;
    }

    return allCampaigns;
}

// Get vouchers in a campaign
export async function getVouchersInCampaign(
    campaignId: number,
    status?: number
): Promise<Voucher[]> {
    const token = await getKiotVietToken();

    const params = new URLSearchParams();
    params.append('campaignId', campaignId.toString());
    if (status !== undefined) {
        params.append('status', status.toString());
    }

    const response = await fetch(
        `${KIOTVIET_API_BASE}/voucher?${params.toString()}`,
        {
            headers: {
                'Retailer': process.env.KIOTVIET_RETAILER || '',
                'Authorization': `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.text();
        console.error('KiotViet get vouchers error:', error);
        throw new Error('Failed to get vouchers from KiotViet');
    }

    const data = await response.json();
    return data.data || [];
}

// Create new voucher in KiotViet
export async function createVoucher(
    campaignId: number,
    voucherCode: string
): Promise<void> {
    const token = await getKiotVietToken();

    const response = await fetch(`${KIOTVIET_API_BASE}/voucher`, {
        method: 'POST',
        headers: {
            'Retailer': process.env.KIOTVIET_RETAILER || '',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            voucherCampaignId: campaignId,
            data: [{ code: voucherCode }],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('KiotViet create voucher error:', error);
        throw new Error('Failed to create voucher in KiotViet');
    }
}

// Release (issue) voucher to customer
export async function releaseVoucher(
    campaignId: number,
    voucherCode: string,
    releaseDate?: Date
): Promise<void> {
    const token = await getKiotVietToken();

    const response = await fetch(`${KIOTVIET_API_BASE}/voucher/release/give`, {
        method: 'POST',
        headers: {
            'Retailer': process.env.KIOTVIET_RETAILER || '',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            CampaignId: campaignId,
            Vouchers: [{ Code: voucherCode }],
            ReleaseDate: (releaseDate || new Date()).toISOString(),
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('KiotViet release voucher error:', error);
        throw new Error('Failed to release voucher in KiotViet');
    }
}

// Cancel voucher
export async function cancelVoucher(
    campaignId: number,
    voucherCode: string
): Promise<void> {
    const token = await getKiotVietToken();

    const response = await fetch(`${KIOTVIET_API_BASE}/voucher/cancel`, {
        method: 'DELETE',
        headers: {
            'Retailer': process.env.KIOTVIET_RETAILER || '',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            CampaignId: campaignId,
            Vouchers: [{ Code: voucherCode }],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('KiotViet cancel voucher error:', error);
        throw new Error('Failed to cancel voucher in KiotViet');
    }
}

// Generate unique voucher code - 8 characters starting with XM
export function generateVoucherCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
    let code = 'XM';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Calculate expire date based on campaign settings
export function calculateExpireDate(expireDays: number, releaseDate?: Date): Date {
    const release = releaseDate || new Date();
    const expire = new Date(release);
    expire.setDate(expire.getDate() + expireDays);
    return expire;
}
