import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Attempt from '@/models/Attempt';
import Voucher from '@/models/Voucher';

export async function POST(req: NextRequest) {
  // Only allow in development
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

  // Clear any pending voucher
  if (user.currentVoucherId) {
    await Voucher.findByIdAndDelete(user.currentVoucherId);
  }

  // Reset user state - preserve streak for testing
  user.currentVoucherId = null;
  user.currentRevealedAmount = null;
  user.lastAttemptAt = null;
  user.lockUntil = null;
  // Don't reset consecutiveLosses to maintain streak for testing
  await user.save();

  // Clear attempts for today
  const today = new Date().toISOString().split('T')[0];
  await Attempt.findOneAndDelete({ 
    userFingerprint: user.deviceFingerprint, 
    date: today 
  });

  return NextResponse.json({ 
    success: true, 
    message: 'User reset successfully',
    consecutiveLosses: user.consecutiveLosses
  });
}