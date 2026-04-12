import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  console.log(`[Middleware] Path: ${pathname}, Token: ${!!token}`);

  // Public routes - no auth required
  const publicRoutes = ['/', '/network', '/api/init', '/api/ref'];
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Require token for all other routes
  if (!token) {
    console.log(`[Middleware] No token, redirecting to /`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Verify token
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) {
    console.log(`[Middleware] Invalid token`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log(`[Middleware] User ${payload.userId} accessing ${pathname}`);

  // Clone headers and add user ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)'],
};