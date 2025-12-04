import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { password } = body;

        const adminSecret = process.env.ADMIN_SECRET;

        if (!adminSecret) {
            return NextResponse.json(
                { success: false, error: 'Chưa cấu hình ADMIN_SECRET' },
                { status: 500 }
            );
        }

        if (password !== adminSecret) {
            return NextResponse.json(
                { success: false, error: 'Mật khẩu không đúng' },
                { status: 401 }
            );
        }

        // Set auth cookie
        const cookieStore = await cookies();
        cookieStore.set('admin_auth', adminSecret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}

// Logout
export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_auth');
    return NextResponse.json({ success: true });
}
