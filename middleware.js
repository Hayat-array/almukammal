import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, internal paths, and API endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Extract Token and Role from Cookies
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('user_role')?.value;

  // 3. Route Classification
  const isAuthPage = pathname === '/auth/login' || pathname === '/auth/register';
  const isAdminAuthPage = pathname === '/auth/admin/login' || pathname === '/auth/admin/register';
  const isDeliveryAuthPage = pathname === '/delivery/login' || pathname === '/delivery/signup' || pathname === '/delivery/register';
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/auth/admin/main');
  const isDeliveryConsole = pathname === '/delivery';
  const isUserProtected = pathname.startsWith('/orders') || pathname.startsWith('/checkout') || pathname.startsWith('/profile');

  // 4. Redirect legacy /admin/dashboard to /admin
  if (pathname === '/admin/dashboard' || pathname === '/auth/admin/main') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // 5. Logged-in user visiting Auth pages
  if (token) {
    if (isAuthPage) {
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      if (role === 'delivery_partner') {
        return NextResponse.redirect(new URL('/delivery', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (isAdminAuthPage && role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    if (isDeliveryAuthPage && role === 'delivery_partner') {
      return NextResponse.redirect(new URL('/delivery', request.url));
    }
  }

  // 6. Protect Admin Routes
  if (isAdminRoute) {
    if (!token) {
      const loginUrl = new URL('/auth/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 7. Protect Delivery Console
  if (isDeliveryConsole) {
    if (!token) {
      return NextResponse.redirect(new URL('/delivery/login', request.url));
    }
    if (role !== 'delivery_partner' && role !== 'admin') {
      return NextResponse.redirect(new URL('/delivery/login', request.url));
    }
  }

  // 8. Protect User Routes
  if (isUserProtected) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
