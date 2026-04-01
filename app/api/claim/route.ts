import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Voucher from '@/models/Voucher';
import Winner from '@/models/Winner';
import ShareLink from '@/models/ShareLink';

export async function POST(req: NextRequest) {
  await dbConnect();
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Check if shares verified
  const shareLink = await ShareLink.findOne({ userId });
  if (!shareLink || !shareLink.verifiedAt) {
    return NextResponse.json({ error: 'Shares not verified' }, { status: 400 });
  }

  // Lottery: 1 in N chance (configurable)
  const WIN_PROBABILITY = 0.1; // 10% for demo
  const isWinner = Math.random() < WIN_PROBABILITY;

  if (isWinner) {
    // Mark voucher as won
    const voucher = await Voucher.findById(user.currentVoucherId);
    if (!voucher) return NextResponse.json({ error: 'No voucher found' }, { status: 404 });
    voucher.status = 'available'; // or 'redeemed' after delivery
    voucher.winnerId = userId;
    await voucher.save();

    // Record winner
    await Winner.create({
      userId,
      voucherId: voucher._id,
      prizeAmount: voucher.amount,
      network: user.network,
    });

    // Clear current voucher
    user.currentVoucherId = null;
    await user.save();

    return NextResponse.json({ winner: true, amount: voucher.amount });
  } else {
    // Not winner: start retry flow (cooldown already handled in scratch)
    return NextResponse.json({ winner: false });
  }
}