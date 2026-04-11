import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Voucher from '@/models/Voucher';
import Winner from '@/models/Winner';
import ShareLink from '@/models/ShareLink';
import VoucherPool from '@/models/VoucherPool';

// Configuration
const WIN_CONFIG = {
  BASE_WIN_PROBABILITY: 0.002, // 0.2% base chance (1 in 500)
  STREAK_BONUS_ENABLED: true,
};

export async function POST(req: NextRequest) {
  await dbConnect();
  const userId = req.headers.get('x-user-id');
  
  console.log('[CLAIM] Starting claim for user:', userId);
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if user has a pending voucher
  if (!user.currentVoucherId) {
    return NextResponse.json({ error: 'No pending voucher found. Please scratch a card first.' }, { status: 400 });
  }

  const tempVoucher = await Voucher.findById(user.currentVoucherId);
  if (!tempVoucher) {
    user.currentVoucherId = null;
    await user.save();
    return NextResponse.json({ error: 'Voucher expired. Please scratch again.' }, { status: 400 });
  }

  // Calculate win probability based on multiple factors
  let winProbability = WIN_CONFIG.BASE_WIN_PROBABILITY;
  
  // Factor 1: Streak bonus
  if (WIN_CONFIG.STREAK_BONUS_ENABLED && user.consecutiveLosses) {
    const streakBonus = Math.min(5, user.consecutiveLosses) * 0.001;
    winProbability += streakBonus;
    console.log(`[CLAIM] Streak bonus: +${(streakBonus * 100).toFixed(2)}% (${user.consecutiveLosses} losses)`);
  }
  
  // Factor 2: Time of day bonus (6 PM to 10 PM)
  const hour = new Date().getHours();
  const isPeakHour = hour >= 18 && hour <= 22;
  if (isPeakHour) {
    winProbability *= 1.2;
    console.log('[CLAIM] Peak hour bonus applied');
  }
  
  // Factor 3: Referral quality bonus
  const shareLink = await ShareLink.findOne({ userId });
  if (shareLink) {
    const uniqueReferrals = new Set(shareLink.clicks.map((c: any) => c.ip)).size;
    if (uniqueReferrals >= 5) {
      winProbability *= 1.5;
      console.log('[CLAIM] High referral bonus applied');
    } else if (uniqueReferrals >= 3) {
      winProbability *= 1.2;
      console.log('[CLAIM] Referral bonus applied');
    }
  }
  
  // Cap probability at 5% max
  winProbability = Math.min(0.05, winProbability);
  
  console.log(`[CLAIM] Final win probability: ${(winProbability * 100).toFixed(2)}%`);
  
  // Determine if user wins
  const isWinner = Math.random() < winProbability;
  
  if (isWinner) {
    // Find an available voucher from the pool for this network and amount
    const availableVoucher = await Voucher.findOne({
      network: user.network,
      amount: tempVoucher.amount,
      status: 'available'
    });

    if (!availableVoucher) {
      console.log('[CLAIM] No available voucher found for:', user.network, tempVoucher.amount);
      // Treat as loss if no voucher available
      user.consecutiveLosses = (user.consecutiveLosses || 0) + 1;
      tempVoucher.status = 'redeemed';
      await tempVoucher.save();
      user.currentVoucherId = null;
      user.currentRevealedAmount = null;
      await user.save();
      return NextResponse.json({ winner: false, streak: user.consecutiveLosses });
    }

    // Assign the actual voucher to the winner
    availableVoucher.status = 'redeemed';
    availableVoucher.winnerId = userId;
    availableVoucher.redeemedAt = new Date();
    await availableVoucher.save();

    // Update the pool
    const pool = await VoucherPool.findOne({ 
      network: user.network, 
      amount: tempVoucher.amount 
    });
    if (pool) {
      pool.remainingVouchers -= 1;
      await pool.save();
      console.log(`[CLAIM] Pool updated: ${pool.remainingVouchers} remaining for TZS ${pool.amount}`);
    }

    // Record winner
    await Winner.create({
      userId,
      voucherId: availableVoucher._id,
      prizeAmount: tempVoucher.amount,
      network: user.network,
      wonAt: new Date(),
      voucherCode: availableVoucher.voucherCode,
    });

    // Reset consecutive losses
    user.consecutiveLosses = 0;
    user.currentVoucherId = null;
    user.currentRevealedAmount = null;
    await user.save();

    // Delete the temporary locked voucher
    await Voucher.findByIdAndDelete(tempVoucher._id);

    console.log(`[CLAIM] WINNER! Amount: ${tempVoucher.amount}, Code: ${availableVoucher.voucherCode}`);
    return NextResponse.json({ 
      winner: true, 
      amount: tempVoucher.amount,
      voucherCode: availableVoucher.voucherCode,
      probability: winProbability
    });
  } else {
    // Not winner - increment loss streak
    user.consecutiveLosses = (user.consecutiveLosses || 0) + 1;
    tempVoucher.status = 'redeemed';
    await tempVoucher.save();
    
    user.currentVoucherId = null;
    user.currentRevealedAmount = null;
    await user.save();

    console.log(`[CLAIM] Loser - Streak: ${user.consecutiveLosses}`);
    return NextResponse.json({ 
      winner: false,
      streak: user.consecutiveLosses
    });
  }
}