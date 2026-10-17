import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { getClientIp, rateLimit, tooManyRequests } from '@/lib/ratelimit';

export async function GET() {
  const admins = await prisma.admin.findMany({
    select: { id: true, username: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(admins);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = await rateLimit('admin-create-account', 10, '15 m', ip);
    if (!limit.success) {
      return tooManyRequests(limit.reset);
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json({ error: 'Username must be 3-30 characters' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const admin = await prisma.admin.create({
      data: {
        username,
        passwordHash: hashPassword(password),
      },
      select: { id: true, username: true, createdAt: true },
    });

    return NextResponse.json(admin, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create admin account' }, { status: 500 });
  }
}
