import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Attempt from '@/models/Attempt';
import ShareLink from '@/models/ShareLink';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  await dbConnect();
  
  // Get token from cookie
  const token = req.cookies.get('token')?.value;
  
  if (!token) {
    return NextResponse.json({ error: 'No token found' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0];
  const attemptDoc = await Attempt.findOne({ 
    userFingerprint: user.deviceFingerprint, 
    date: today 
  });
  
  const shareLink = await ShareLink.findOne({ userId: user._id });
  const uniqueIPs = shareLink ? new Set(shareLink.clicks.map((c: any) => c.ip)).size : 0;

  return NextResponse.json({
    userId: user._id,
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