import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Voucher from '@/models/Voucher';
import Winner from '@/models/Winner';
import ShareLink from '@/models/ShareLink';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  await dbConnect();
  const { userId } = await req.json();

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
  if (shareLink.clicks.length < 3) {
    for (let i = 0; i < 3; i++) {
      shareLink.clicks.push({
        ip: `192.168.1.${200 + i}`,
        userAgent: 'Test',
        timestamp: new Date(),
      });
    }
  }
  shareLink.verifiedAt = new Date();
  await shareLink.save();

  // Create a winning voucher if none exists
  let voucher = await Voucher.findById(user.currentVoucherId);
  if (!voucher) {
    voucher = await Voucher.create({
      network: user.network,
      amount: 5000,
      status: 'locked',
    });
    user.currentVoucherId = voucher._id;
    user.currentRevealedAmount = 5000;
    await user.save();
  }

  // Mark as winner
  voucher.status = 'available';
  voucher.winnerId = userId;
  await voucher.save();

  await Winner.create({
    userId,
    voucherId: voucher._id,
    prizeAmount: voucher.amount,
    network: user.network,
  });

  user.currentVoucherId = null;
  user.currentRevealedAmount = null;
  await user.save();

  return NextResponse.json({ 
    success: true, 
    message: 'User forced to win!',
    amount: voucher.amount
  });
}