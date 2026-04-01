import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Log the request for debugging
  console.log(`[Middleware] Request: ${pathname}, Token exists: ${!!token}`);

  // Public routes – allow without token
  if (
    pathname === '/' ||
    pathname.startsWith('/api/ref') ||
    pathname === '/network' ||
    pathname === '/api/init'
  ) {
    console.log(`[Middleware] Public route: ${pathname} – allowing`);
    return NextResponse.next();
  }

  // For all other routes, require a valid token
  if (!token) {
    console.log(`[Middleware] No token, redirecting to / from ${pathname}`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  const payload = verifyToken(token);
  if (!payload) {
    console.log(`[Middleware] Invalid token, redirecting to / from ${pathname}`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log(`[Middleware] Valid token for user ${payload.userId} on ${pathname}`);

  // Attach user id to headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};