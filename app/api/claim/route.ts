import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Voucher from '@/models/Voucher';
import Winner from '@/models/Winner';
import ShareLink from '@/models/ShareLink';
import VoucherPool from '@/models/VoucherPool';
import Counter from '@/models/Counter';
import { sendWinnerNotification } from '@/lib/email';

// Configuration
const CLAIMS_PER_WINNER = 500; // Exactly 1 winner per 500 claims
const WINNER_COOLDOWN_DAYS = 2; // User must wait 2 days after winning before can win again

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

  // Declare tempVoucher here BEFORE using it
  const tempVoucher = await Voucher.findById(user.currentVoucherId);
  if (!tempVoucher) {
    user.currentVoucherId = null;
    await user.save();
    return NextResponse.json({ error: 'Voucher expired. Please scratch again.' }, { status: 400 });
  }

  // Check winner cooldown
  if (user.lastWinAt) {
    const daysSinceLastWin = (Date.now() - new Date(user.lastWinAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastWin < WINNER_COOLDOWN_DAYS) {
      const daysRemaining = Math.ceil(WINNER_COOLDOWN_DAYS - daysSinceLastWin);
      console.log(`[CLAIM] User on winner cooldown: ${daysRemaining} days remaining`);
      
      // Still allow them to play, but treat as loss without incrementing streak
      tempVoucher.status = 'redeemed';
      await tempVoucher.save();
      user.currentVoucherId = null;
      user.currentRevealedAmount = null;
      await user.save();
      
      return NextResponse.json({ 
        winner: false, 
        cooldown: true,
        message: `You can only win once every ${WINNER_COOLDOWN_DAYS} days. Try again in ${daysRemaining} days.`,
        daysRemaining
      });
    }
  }

  // Get or create claim counter
  let counter = await Counter.findOne({ name: 'claimCounter' });
  if (!counter) {
    counter = await Counter.create({ name: 'claimCounter', value: 0 });
  }

  // Increment counter
  counter.value += 1;
  await counter.save();

  // Determine winner: exactly 1 winner per CLAIMS_PER_WINNER claims
  const isWinner = counter.value % CLAIMS_PER_WINNER === 0;
  
  // Reset counter after winner (optional, keeps number small)
  if (isWinner) {
    counter.value = 0;
    await counter.save();
  }

  console.log(`[CLAIM] Claim #${counter.value}, Winner: ${isWinner}`);

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

    // Record winner in database
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
    
    // Set last win time and increment total wins
    user.lastWinAt = new Date();
    user.totalWins = (user.totalWins || 0) + 1;
    await user.save();

    // Delete the temporary locked voucher
    await Voucher.findByIdAndDelete(tempVoucher._id);

    console.log(`[CLAIM] WINNER! Amount: ${tempVoucher.amount}, Code: ${availableVoucher.voucherCode}`);
    
    // ✅ SEND EMAIL NOTIFICATION (don't await to not block response)
    // Send email in background - user doesn't need to wait for it
    (async () => {
      try {
        await sendWinnerNotification({
          userName: user.phone || 'User',
          userPhone: user.phone,
          userNetwork: user.network,
          voucherAmount: tempVoucher.amount,
          voucherCode: availableVoucher.voucherCode,
          winnerId: user._id.toString(),
          wonAt: new Date(),
        });
        console.log('[EMAIL] Winner notification sent successfully');
      } catch (emailError) {
        console.error('[EMAIL] Failed to send winner notification:', emailError);
      }
    })();
    
    return NextResponse.json({ 
      winner: true, 
      amount: tempVoucher.amount,
      voucherCode: availableVoucher.voucherCode
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