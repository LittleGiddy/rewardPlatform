import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Voucher from '@/models/Voucher';
import VoucherPool from '@/models/VoucherPool';
import Attempt from '@/models/Attempt';
import ScratchEvent from '@/models/ScratchEvent';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    console.log('[SCRATCH] === START ===');
    
    // Get token from cookie instead of header
    const token = req.cookies.get('token')?.value;
    
    if (!token) {
      console.log('[SCRATCH] No token found in cookies');
      return NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 });
    }
    
    // Verify the token
    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      console.log('[SCRATCH] Invalid token');
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }
    
    console.log('[SCRATCH] User ID from token:', payload.userId);
    
    await dbConnect();
    
    const user = await User.findById(payload.userId);
    if (!user) {
      console.log('[SCRATCH] User not found:', payload.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[SCRATCH] User network:', user.network);

    // Clean up old locked vouchers for this user (older than 30 minutes)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    await Voucher.deleteMany({
      status: 'locked',
      createdAt: { $lt: thirtyMinsAgo }
    });

    // Check if user already has a pending voucher
    if (user.currentVoucherId) {
      const existingVoucher = await Voucher.findById(user.currentVoucherId);
      if (existingVoucher && existingVoucher.status === 'locked') {
        console.log('[SCRATCH] User has pending voucher:', existingVoucher.amount);
        return NextResponse.json({ 
          amount: existingVoucher.amount, 
          voucherId: existingVoucher._id,
          alreadyScratched: true 
        });
      }
    }

    // DEVELOPMENT MODE: Skip rate limiting
    const isDevMode = process.env.NODE_ENV === 'development';
    
    if (!isDevMode) {
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
        const lockUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
        user.lockUntil = lockUntil;
        await user.save();
        return NextResponse.json({ error: 'Daily limit reached', lockUntil }, { status: 403 });
      }

      // Cooldown check
      if (user.lastAttemptAt) {
        const timeSinceLastAttempt = new Date().getTime() - user.lastAttemptAt.getTime();
        const cooldownMs = 10 * 60 * 1000;
        if (timeSinceLastAttempt < cooldownMs) {
          const remaining = cooldownMs - timeSinceLastAttempt;
          return NextResponse.json({ error: 'Cooldown', remaining }, { status: 429 });
        }
      }

      // Increment attempt count
      attemptDoc.count += 1;
      await attemptDoc.save();
    }

    // Get available vouchers ONLY for this user's network
    const availablePools = await VoucherPool.find({
      network: user.network,
      remainingVouchers: { $gt: 0 }
    });

    console.log('[SCRATCH] Available pools for', user.network, ':', availablePools.map(p => ({
      amount: p.amount,
      remaining: p.remainingVouchers
    })));

    // ✅ IMPROVED: Better handling when no vouchers available
    if (availablePools.length === 0) {
      console.log('[SCRATCH] No vouchers available for network:', user.network);
      
      // Get all available networks to help user
      const allAvailablePools = await VoucherPool.find({
        remainingVouchers: { $gt: 0 }
      });
      const availableNetworks = [...new Set(allAvailablePools.map(p => p.network))];
      
      return NextResponse.json({ 
        error: 'NO_VOUCHERS_AVAILABLE',
        message: `No vouchers available for ${user.network} network at this time.`,
        network: user.network,
        availableNetworks: availableNetworks,
        suggestion: availableNetworks.length > 0 
          ? `Try switching to ${availableNetworks.join(', ')} network` 
          : 'Please check back later. New vouchers will be added soon!'
      }, { status: 404 });
    }

    // Calculate total remaining vouchers for weighted selection
    let totalVouchers = 0;
    for (const pool of availablePools) {
      totalVouchers += pool.remainingVouchers;
    }

    // Weighted random selection based on remaining quantities
    let random = Math.random() * totalVouchers;
    let selectedPool = null;
    let cumulative = 0;

    for (const pool of availablePools) {
      cumulative += pool.remainingVouchers;
      if (random <= cumulative) {
        selectedPool = pool;
        break;
      }
    }

    if (!selectedPool) {
      selectedPool = availablePools[0];
    }

    const potentialAmount = selectedPool.amount;
    console.log('[SCRATCH] Selected amount:', potentialAmount, 'for network:', user.network);

    // Create a temporary locked voucher
    const voucher = await Voucher.create({
      network: user.network,
      amount: potentialAmount,
      status: 'locked',
    });

    // Update user
    user.currentVoucherId = voucher._id;
    user.currentRevealedAmount = potentialAmount;
    user.lastAttemptAt = new Date();
    await user.save();

    // Log scratch event
    await ScratchEvent.create({ 
      userId: user._id, 
      voucherId: voucher._id, 
      revealedAmount: potentialAmount,
      timestamp: new Date()
    });

    console.log('[SCRATCH] Success for user:', user._id);
    
    return NextResponse.json({ 
      amount: potentialAmount, 
      voucherId: voucher._id,
      network: user.network,
      message: `Unaweza kushinda TZS ${potentialAmount}! Share kwa Marafiki watatu kufungua nafasi yako!`
    });
    
  } catch (error) {
    console.error('[SCRATCH] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}