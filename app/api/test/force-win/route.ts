import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Voucher from '@/models/Voucher';
import Winner from '@/models/Winner';
import ShareLink from '@/models/ShareLink';
import Attempt from '@/models/Attempt';

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  await dbConnect();
  const { userId, amount = 5000 } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Ensure shares are verified
  let shareLink = await ShareLink.findOne({ userId });
  if (!shareLink) {
    shareLink = await ShareLink.create({ 
      userId, 
      code: Math.random().toString(36).substring(2, 10),
      clicks: [] 
    });
  }
  
  // Add simulated clicks if needed
  const existingIPs = new Set(shareLink.clicks.map((c: any) => c.ip));
  for (let i = 0; i < 3; i++) {
    const fakeIP = `192.168.1.${400 + i}`;
    if (!existingIPs.has(fakeIP)) {
      shareLink.clicks.push({
        ip: fakeIP,
        userAgent: 'Test Simulator',
        timestamp: new Date(),
      });
    }
  }
  shareLink.verifiedAt = new Date();
  await shareLink.save();

  // Create a winning voucher
  const voucher = await Voucher.create({
    network: user.network,
    amount: amount,
    status: 'available',
    winnerId: userId,
  });

  // Record winner
  await Winner.create({
    userId,
    voucherId: voucher._id,
    prizeAmount: amount,
    network: user.network,
    wonAt: new Date(),
  });

  // Clear any existing voucher from user
  if (user.currentVoucherId) {
    await Voucher.findByIdAndDelete(user.currentVoucherId);
  }
  
  user.currentVoucherId = null;
  user.currentRevealedAmount = null;
  user.consecutiveLosses = 0; // Reset streak on win
  await user.save();

  // Reset attempts so user can scratch again
  const today = new Date().toISOString().split('T')[0];
  await Attempt.findOneAndDelete({ 
    userFingerprint: user.deviceFingerprint, 
    date: today 
  });

  return NextResponse.json({ 
    success: true, 
    message: `You won ${amount} TSH!`,
    amount: amount,
    voucherCode: voucher.voucherCode,
    userId: user._id
  });
}