import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Users configuration - format: username:password
// In .env: ADMIN_USERS=admin:Dat@6789,mkt:MKT@438
function getUsers(): Record<string, string> {
    const usersEnv = process.env.ADMIN_USERS || '';
    const users: Record<string, string> = {};

    usersEnv.split(',').forEach(pair => {
        const [username, password] = pair.split(':');
        if (username && password) {
            users[username.trim()] = password.trim();
        }
    });

    return users;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng nhập tên đăng nhập và mật khẩu' },
                { status: 400 }
            );
        }

        const users = getUsers();

        if (Object.keys(users).length === 0) {
            return NextResponse.json(
                { success: false, error: 'Chưa cấu hình ADMIN_USERS trong môi trường' },
                { status: 500 }
            );
        }

        // Check credentials
        if (users[username] !== password) {
            return NextResponse.json(
                { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
                { status: 401 }
            );
        }

        // Create auth token (simple: username + secret)
        const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

        // Set auth cookie
        const cookieStore = await cookies();
        cookieStore.set('admin_auth', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        cookieStore.set('admin_user', username, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return NextResponse.json({ success: true, user: username });
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
    cookieStore.delete('admin_user');
    return NextResponse.json({ success: true });
}
