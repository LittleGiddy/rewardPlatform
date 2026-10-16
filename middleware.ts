import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

const PUBLIC_ROUTES = ['/', '/network', '/api/init', '/api/ref'];

const ADMIN_PUBLIC_ROUTES = ['/admin/login', '/api/admin/auth/login', '/api/admin/auth/check', '/api/admin/auth/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  if (isPublicRoute) {
    return NextResponse.next();
  }

  const isAdminPublic = ADMIN_PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  if (isAdminPublic) {
    return NextResponse.next();
  }

  // Admin area is guarded by the admin_auth cookie
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/') ||
    pathname === '/api/admin' || pathname.startsWith('/api/admin/');

  if (isAdminArea) {
    const adminAuthed = request.cookies.get('admin_auth')?.value === 'true';
    if (adminAuthed) {
      return NextResponse.next();
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Everything else requires a valid user token
  const token = request.cookies.get('token')?.value;
  if (!token) {
    console.log(`[Middleware] No token, redirecting to /`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  const payload = await verifyToken(token);
  if (!payload || !payload.userId) {
    console.log(`[Middleware] Invalid token`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)'],
};
