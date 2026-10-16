import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;

    const shareLink = await prisma.shareLink.findUnique({
      where: { userId },
      include: { clicks: { select: { ip: true } } },
    });
    if (!shareLink) {
      return NextResponse.json({ verified: false, clicks: 0 });
    }

    const uniqueIPs = new Set(shareLink.clicks.map((c) => c.ip));
    const uniqueCount = uniqueIPs.size;

    // BACKEND: Only 1 click required to verify
    // FRONTEND: Will still show "3 clicks needed" for user experience
    const BACKEND_REQUIRED_CLICKS = 1;
    const FRONTEND_REQUIRED_CLICKS = 3;

    if (uniqueCount >= BACKEND_REQUIRED_CLICKS) {
      await prisma.shareLink.update({
        where: { id: shareLink.id },
        data: { verifiedAt: new Date() },
      });
      return NextResponse.json({
        verified: true,
        clicks: uniqueCount,
        required: FRONTEND_REQUIRED_CLICKS,
      });
    }

    return NextResponse.json({
      verified: false,
      clicks: uniqueCount,
      required: FRONTEND_REQUIRED_CLICKS,
    });
  } catch (error) {
    console.error('[VERIFY-SHARE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
