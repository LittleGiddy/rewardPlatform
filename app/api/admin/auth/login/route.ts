import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { getClientIp, rateLimit, tooManyRequests } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = await rateLimit('admin-login', 5, '15 m', ip);
    if (!limit.success) {
      return tooManyRequests(limit.reset);
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });

    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_auth', 'true', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 2,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
