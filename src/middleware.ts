import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Exclude login page from auth check
    if (request.nextUrl.pathname === '/admin/login') {
        return NextResponse.next();
    }

    // Protect /admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const authCookie = request.cookies.get('admin_auth');

        // Check if already authenticated
        if (authCookie?.value === process.env.ADMIN_SECRET) {
            return NextResponse.next();
        }

        // Redirect to login page
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('from', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
