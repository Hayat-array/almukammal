import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. Skip public assets and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // 2. Get Token & Role from Cookies
    const token = request.cookies.get('token')?.value;
    const role = request.cookies.get('user_role')?.value;

    // 3. Define Route Groups
    const isAuthPage = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register') || pathname === '/auth/admin/login' || pathname === '/auth/admin/register';
    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/auth/admin/main');
    const isUserRoute = pathname.startsWith('/orders') || pathname.startsWith('/checkout') || pathname.startsWith('/profile');

    // 4. Handle Redirection for Logged-in Users trying to access Auth pages
    if (isAuthPage && token) {
        if (role === 'admin') {
            // Admin users -> Go to Admin Dashboard
            return NextResponse.redirect(new URL('/admin', request.url));
        } else {
            // Regular users -> Go to Home Page
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // 5. Protect Admin Routes
    if (isAdminRoute) {
        if (!token) {
            return NextResponse.redirect(new URL('/auth/admin/login', request.url));
        }
        if (role !== 'admin') {
            // Logged in but not admin -> Redirect to home
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // 6. Protect User Routes
    if (isUserRoute) {
        if (!token) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
