import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const clientId = process.env.KIOTVIET_CLIENT_ID;
        const clientSecret = process.env.KIOTVIET_CLIENT_SECRET;
        const retailer = process.env.KIOTVIET_RETAILER;

        // Check if configured
        const configured = !!(clientId && clientSecret && retailer);

        if (!configured) {
            return NextResponse.json({
                configured: false,
                connected: false,
                error: 'Thiếu thông tin cấu hình KiotViet trong environment variables',
            });
        }

        // Try to get access token to test connection
        try {
            const tokenResponse = await fetch('https://id.kiotviet.vn/connect/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    scopes: 'PublicApi.Access',
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret,
                }),
            });

            if (tokenResponse.ok) {
                return NextResponse.json({
                    configured: true,
                    connected: true,
                    retailer: retailer,
                });
            } else {
                const error = await tokenResponse.json();
                return NextResponse.json({
                    configured: true,
                    connected: false,
                    retailer: retailer,
                    error: error.error_description || 'Không thể kết nối KiotViet API',
                });
            }
        } catch (fetchError) {
            return NextResponse.json({
                configured: true,
                connected: false,
                retailer: retailer,
                error: 'Lỗi kết nối mạng đến KiotViet',
            });
        }
    } catch (error) {
        console.error('KiotViet status check error:', error);
        return NextResponse.json({
            configured: false,
            connected: false,
            error: 'Lỗi kiểm tra kết nối',
        });
    }
}
