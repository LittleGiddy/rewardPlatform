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

  console.log('[SCRATCH] Starting scratch request for user:', {
    userId: user._id,
    network: user.network,
    hasCurrentVoucher: !!user.currentVoucherId,
    lastAttemptAt: user.lastAttemptAt,
    lockUntil: user.lockUntil
  });

  // Check if user already has a pending voucher (already scratched but not claimed)
  if (user.currentVoucherId) {
    const existingVoucher = await Voucher.findById(user.currentVoucherId);
    if (existingVoucher && existingVoucher.status === 'locked') {
      console.log('[SCRATCH] User already has pending voucher:', existingVoucher._id, 'amount:', existingVoucher.amount);
      return NextResponse.json({ 
        amount: existingVoucher.amount, 
        voucherId: existingVoucher._id,
        alreadyScratched: true 
      });
    }
  }

  // Check 48h lock
  if (user.lockUntil && user.lockUntil > new Date()) {
    console.log('[SCRATCH] User is locked until:', user.lockUntil);
    return NextResponse.json({ error: 'Locked', lockUntil: user.lockUntil }, { status: 403 });
  }

  // Check daily attempts
  const today = new Date().toISOString().split('T')[0];
  let attemptDoc = await Attempt.findOne({ userFingerprint: user.deviceFingerprint, date: today });
  if (!attemptDoc) {
    attemptDoc = await Attempt.create({ userFingerprint: user.deviceFingerprint, date: today, count: 0 });
    console.log('[SCRATCH] Created new attempt record for today');
  }
  
  console.log('[SCRATCH] Attempts today:', attemptDoc.count, 'of 5');
  
  if (attemptDoc.count >= 5) {
    // Set 48h lock
    const lockUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
    user.lockUntil = lockUntil;
    await user.save();
    console.log('[SCRATCH] Daily limit reached (5/5), lock set until:', lockUntil);
    return NextResponse.json({ error: 'Daily limit reached', lockUntil }, { status: 403 });
  }

  // Cooldown check (10 minutes between scratches)
  if (user.lastAttemptAt) {
    const timeSinceLastAttempt = new Date().getTime() - user.lastAttemptAt.getTime();
    const cooldownMs = 10 * 60 * 1000; // 10 minutes
    
    if (timeSinceLastAttempt < cooldownMs) {
      const remaining = cooldownMs - timeSinceLastAttempt;
      const remainingMinutes = Math.floor(remaining / 60000);
      const remainingSeconds = Math.floor((remaining % 60000) / 1000);
      
      console.log('[SCRATCH] Cooldown active - Time since last attempt:', Math.floor(timeSinceLastAttempt / 1000), 'seconds');
      console.log('[SCRATCH] Remaining:', remainingMinutes, 'min', remainingSeconds, 'sec');
      
      return NextResponse.json({ 
        error: 'Cooldown', 
        remaining,
        message: `Please wait ${remainingMinutes} minutes and ${remainingSeconds} seconds`
      }, { status: 429 });
    }
  }

  // Pick a random amount from weighted distribution
  const rand = Math.random();
  let amount = 100;
  if (rand < 0.6) amount = 100;
  else if (rand < 0.9) amount = 500;
  else if (rand < 0.99) amount = 1000;
  else amount = 5000;

  console.log('[SCRATCH] Selected amount:', amount, '(roll:', rand.toFixed(3), ')');

  // Create a temporary voucher (locked)
  const voucher = await Voucher.create({
    network: user.network,
    amount,
    status: 'locked',
  });

  console.log('[SCRATCH] Created voucher:', voucher._id);

  // Update user
  user.currentVoucherId = voucher._id;
  user.currentRevealedAmount = amount;
  user.lastAttemptAt = new Date();
  await user.save();

  // Increment attempt count
  attemptDoc.count += 1;
  await attemptDoc.save();

  // Log scratch event
  await ScratchEvent.create({ 
    userId: user._id, 
    voucherId: voucher._id, 
    revealedAmount: amount,
    timestamp: new Date()
  });

  console.log('[SCRATCH] Success! Attempt:', attemptDoc.count, '/5, Next attempt available in 10 minutes');

  return NextResponse.json({ 
    amount, 
    voucherId: voucher._id,
    attemptsUsed: attemptDoc.count,
    attemptsRemaining: 5 - attemptDoc.count
  });
}