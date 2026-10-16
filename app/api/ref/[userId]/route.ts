import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

interface RouteParams {
  params: Promise<{ userId: string }> | { userId: string };
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const code = resolvedParams.userId;

    console.log('[REF] Referral click for code:', code);

    const shareLink = await prisma.shareLink.findUnique({
      where: { code },
      include: { clicks: true },
    });

    if (!shareLink) {
      console.log('[REF] Share link not found for code:', code);
      return NextResponse.redirect(new URL('/', req.url));
    }

    const ip = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check for duplicate IP within last hour (anti-abuse)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentClickFromSameIp = shareLink.clicks.some(
      (click) => click.ip === ip && new Date(click.timestamp) > oneHourAgo
    );

    if (!recentClickFromSameIp) {
      await prisma.click.create({
        data: { shareLinkId: shareLink.id, ip, userAgent, timestamp: new Date(), verified: false },
      });
      console.log('[REF] Click recorded from IP:', ip);
    } else {
      console.log('[REF] Duplicate click ignored from IP:', ip);
    }

    const cookieStore = await cookies();
    cookieStore.set('ref', code, {
      maxAge: 60 * 60,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    const url = new URL('/', req.url);
    url.searchParams.set('ref', code);

    return NextResponse.redirect(url);
  } catch (error) {
    console.error('[REF] Error processing referral:', error);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
