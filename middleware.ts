import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'strong-company-secure-jwt-key-erbil-2026-safe-token';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = 'strong_admin_session';

const SUPPORTED_LOCALES = ['ar', 'ku', 'en'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Root redirect to /ar (or saved preference cookie)
  if (pathname === '/') {
    const savedLocale = request.cookies.get('strong_pref_lang')?.value;
    const targetLocale = savedLocale && SUPPORTED_LOCALES.includes(savedLocale) ? savedLocale : 'ar';
    return NextResponse.redirect(new URL(`/${targetLocale}`, request.url));
  }

  // 2. Protect Admin dashboard routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    let isAuthenticated = false;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === 'admin') {
          isAuthenticated = true;
        }
      } catch {
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Protect sensitive admin API endpoints
  if (pathname.startsWith('/api/admin') && pathname !== '/api/admin/login') {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    let isAuthenticated = false;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === 'admin') {
          isAuthenticated = true;
        }
      } catch {
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized. Admin authentication required.' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
