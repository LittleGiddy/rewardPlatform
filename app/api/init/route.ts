import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { signToken } from '@/lib/jwt';
import type { Network } from '@prisma/client';

export async function POST(req: NextRequest) {
  console.log('[INIT] === START ===');

  try {
    const body = await req.json();
    const { network } = body;
    console.log('[INIT] Network:', network);

    if (!network) {
      return NextResponse.json({ error: 'Network required' }, { status: 400 });
    }

    const fingerprint = `vercel-${Date.now()}-${Math.random()}`;

    const user = await prisma.user.create({
      data: {
        network: network as Network,
        deviceFingerprint: fingerprint,
        ipHash: 'vercel-deployment',
        referralCode: Math.random().toString(36).substring(2, 10),
      },
    });
    console.log('[INIT] User created:', user.id);

    const token = await signToken(user.id);

    const response = NextResponse.json({ success: true });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    console.log('[INIT] === SUCCESS ===');
    return response;
  } catch (error) {
    console.error('[INIT] ERROR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
