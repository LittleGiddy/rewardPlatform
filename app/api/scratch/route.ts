import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Voucher from '@/models/Voucher';
import Attempt from '@/models/Attempt';
import ScratchEvent from '@/models/ScratchEvent';

export async function GET(req: NextRequest) {
  await dbConnect();
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Check 48h lock
  if (user.lockUntil && user.lockUntil > new Date()) {
    return NextResponse.json({ error: 'Locked', lockUntil: user.lockUntil }, { status: 403 });
  }

  // Check daily attempts
  const today = new Date().toISOString().split('T')[0];
  let attemptDoc = await Attempt.findOne({ userFingerprint: user.deviceFingerprint, date: today });
  if (!attemptDoc) {
    attemptDoc = await Attempt.create({ userFingerprint: user.deviceFingerprint, date: today, count: 0 });
  }
  if (attemptDoc.count >= 5) {
    // Set 48h lock
    const lockUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
    user.lockUntil = lockUntil;
    await user.save();
    return NextResponse.json({ error: 'Daily limit reached', lockUntil }, { status: 403 });
  }

  // Cooldown check (10 minutes between scratches)
  if (user.lastAttemptAt && new Date().getTime() - user.lastAttemptAt.getTime() < 10 * 60 * 1000) {
    const remaining = 10 * 60 * 1000 - (new Date().getTime() - user.lastAttemptAt.getTime());
    return NextResponse.json({ error: 'Cooldown', remaining }, { status: 429 });
  }

  // Pick a random amount from weighted distribution (60% 100, 30% 500, 9% 1000, 1% 5000)
  const rand = Math.random();
  let amount = 100;
  if (rand < 0.6) amount = 100;
  else if (rand < 0.9) amount = 500;
  else if (rand < 0.99) amount = 1000;
  else amount = 5000;

  // Create a temporary voucher (locked)
  const voucher = await Voucher.create({
    network: user.network,
    amount,
    status: 'locked',
  });

  // Update user
  user.currentVoucherId = voucher._id;
  user.currentRevealedAmount = amount;
  user.lastAttemptAt = new Date();
  await user.save();

  // Increment attempt count
  attemptDoc.count += 1;
  await attemptDoc.save();

  // Log scratch event
  await ScratchEvent.create({ userId, voucherId: voucher._id, revealedAmount: amount });

  return NextResponse.json({ amount, voucherId: voucher._id });
}