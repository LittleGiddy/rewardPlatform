import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import prisma from '@/lib/db';
import { signToken } from '@/lib/jwt';
import { getClientIp, rateLimit, tooManyRequests } from '@/lib/ratelimit';
import type { Network } from '@prisma/client';

const VALID_NETWORKS: Network[] = ['Yas', 'Airtel', 'Vodacom', 'Halotel', 'MTN'];

function hashIp(ip: string): string {
  return createHash('sha256')
    .update(`${ip}:${process.env.JWT_SECRET ?? 'salt'}`)
    .digest('hex')
    .slice(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    const limit = await rateLimit('init', 10, '1 h', ip);
    if (!limit.success) {
      return tooManyRequests(limit.reset);
    }

    const body = await req.json().catch(() => ({}));
    const { network } = body as { network?: string };

    if (!network || !VALID_NETWORKS.includes(network as Network)) {
      return NextResponse.json(
        { error: `Network required. Must be one of: ${VALID_NETWORKS.join(', ')}` },
        { status: 400 }
      );
    }

    const fingerprint = `vercel-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const user = await prisma.user.create({
      data: {
        network: network as Network,
        deviceFingerprint: fingerprint,
        ipHash: hashIp(ip),
        referralCode: Math.random().toString(36).substring(2, 10),
      },
    });

    const token = await signToken(user.id);

    const response = NextResponse.json({ success: true });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('[INIT] ERROR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
