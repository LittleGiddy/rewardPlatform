import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No token found' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { shareLink: { include: { clicks: { select: { ip: true } } } } },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0];
  const attemptDoc = await prisma.attempt.findUnique({
    where: { userFingerprint_date: { userFingerprint: user.deviceFingerprint, date: today } },
  });

  const shareLink = user.shareLink;
  const uniqueIPs = shareLink ? new Set(shareLink.clicks.map((c) => c.ip)).size : 0;

  return NextResponse.json({
    userId: user.id,
    network: user.network,
    phone: user.phone,
    attemptsToday: attemptDoc?.count || 0,
    lastAttemptAt: user.lastAttemptAt,
    lockUntil: user.lockUntil,
    hasVoucher: !!user.currentVoucherId,
    currentVoucherAmount: user.currentRevealedAmount,
    sharesVerified: !!shareLink?.verifiedAt,
    totalClicks: shareLink?.clicks.length || 0,
    uniqueClicks: uniqueIPs,
  });
}
