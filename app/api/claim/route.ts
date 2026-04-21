import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Voucher from '@/models/Voucher';
import Winner from '@/models/Winner';
import ShareLink from '@/models/ShareLink';
import VoucherPool from '@/models/VoucherPool';
import Counter from '@/models/Counter';
import { sendWinnerNotification } from '@/lib/email';
import Settings from '@/models/Settings';

// Cache for settings
let cachedClaimsPerWinner: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

async function getClaimsPerWinner(): Promise<number> {
  if (cachedClaimsPerWinner !== null && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedClaimsPerWinner;
  }
  const settingsDoc = await Settings.findOne({ key: 'platformSettings' });
  const value = settingsDoc?.value?.claimsPerWinner ?? 500;
  cachedClaimsPerWinner = value;
  cacheTimestamp = Date.now();
  return value;
}

// Winner cooldown (can also be moved to settings if desired)
const WINNER_COOLDOWN_DAYS = 2;

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

  // Winner cooldown
  if (user.lastWinAt) {
    const daysSinceLastWin = (Date.now() - new Date(user.lastWinAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastWin < WINNER_COOLDOWN_DAYS) {
      const daysRemaining = Math.ceil(WINNER_COOLDOWN_DAYS - daysSinceLastWin);
      console.log(`[CLAIM] User on winner cooldown: ${daysRemaining} days remaining`);
      
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

  // --- Fetch current Claims Per Winner setting (cached) ---
  const CLAIMS_PER_WINNER = await getClaimsPerWinner();

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

  console.log(`[CLAIM] Claim #${counter.value}, Winner: ${isWinner}, Threshold: ${CLAIMS_PER_WINNER}`);

  if (isWinner) {
    // Find an available voucher from the pool for this network and amount
    const availableVoucher = await Voucher.findOne({
      network: user.network,
      amount: tempVoucher.amount,
      status: 'available'
    });

    if (!availableVoucher) {
      console.log('[CLAIM] No available voucher found for:', user.network, tempVoucher.amount);
      // Treat as loss
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

    // Reset user state
    user.consecutiveLosses = 0;
    user.currentVoucherId = null;
    user.currentRevealedAmount = null;
    user.lastWinAt = new Date();
    user.totalWins = (user.totalWins || 0) + 1;
    await user.save();

    // Delete the temporary locked voucher
    await Voucher.findByIdAndDelete(tempVoucher._id);

    console.log(`[CLAIM] WINNER! Amount: ${tempVoucher.amount}, Code: ${availableVoucher.voucherCode}`);
    
    // Send email in background
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