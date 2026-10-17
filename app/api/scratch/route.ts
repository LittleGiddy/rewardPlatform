import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { getClientIp, rateLimit, tooManyRequests } from '@/lib/ratelimit';

// Run the expired-voucher sweep at most once every 5 minutes instead of on
// every request (which was a deleteMany on each scratch).
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanupAt = 0;

async function cleanupExpiredVouchers() {
  if (Date.now() - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = Date.now();
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  await prisma.voucher.deleteMany({
    where: { status: 'locked', createdAt: { lt: thirtyMinsAgo } },
  });
}

export async function GET(req: NextRequest) {
  try {
    console.log('[SCRATCH] === START ===');

    const ip = getClientIp(req);
    const limit = await rateLimit('scratch', 30, '10 m', ip);
    if (!limit.success) {
      return tooManyRequests(limit.reset);
    }

    const token = req.cookies.get('token')?.value;

    if (!token) {
      console.log('[SCRATCH] No token found in cookies');
      return NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      console.log('[SCRATCH] Invalid token');
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    console.log('[SCRATCH] User ID from token:', payload.userId);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { currentVoucher: true },
    });
    if (!user) {
      console.log('[SCRATCH] User not found:', payload.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[SCRATCH] User network:', user.network);

    // Clean up old locked vouchers (throttled to once every 5 minutes)
    await cleanupExpiredVouchers();

    // Check if user already has a pending voucher
    if (user.currentVoucher && user.currentVoucher.status === 'locked') {
      console.log('[SCRATCH] User has pending voucher:', user.currentVoucher.amount);
      return NextResponse.json({
        amount: user.currentVoucher.amount,
        voucherId: user.currentVoucher.id,
        alreadyScratched: true,
      });
    }

    const isDevMode = process.env.NODE_ENV === 'development';

    if (!isDevMode) {
      // Check 48h lock
      if (user.lockUntil && user.lockUntil > new Date()) {
        return NextResponse.json({ error: 'Locked', lockUntil: user.lockUntil }, { status: 403 });
      }

      // Check daily attempts
      const today = new Date().toISOString().split('T')[0];
      let attemptDoc = await prisma.attempt.findUnique({
        where: { userFingerprint_date: { userFingerprint: user.deviceFingerprint, date: today } },
      });
      if (!attemptDoc) {
        attemptDoc = await prisma.attempt.create({
          data: { userFingerprint: user.deviceFingerprint, date: today, count: 0 },
        });
      }

      if (attemptDoc.count >= 5) {
        const lockUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
        await prisma.user.update({ where: { id: user.id }, data: { lockUntil } });
        return NextResponse.json({ error: 'Daily limit reached', lockUntil }, { status: 403 });
      }

      // Cooldown check
      if (user.lastAttemptAt) {
        const timeSinceLastAttempt = Date.now() - user.lastAttemptAt.getTime();
        const cooldownMs = 10 * 60 * 1000;
        if (timeSinceLastAttempt < cooldownMs) {
          const remaining = cooldownMs - timeSinceLastAttempt;
          return NextResponse.json({ error: 'Cooldown', remaining }, { status: 429 });
        }
      }

      // Increment attempt count
      await prisma.attempt.update({
        where: { userFingerprint_date: { userFingerprint: user.deviceFingerprint, date: today } },
        data: { count: { increment: 1 } },
      });
    }

    // Get available pools ONLY for this user's network
    const availablePools = await prisma.voucherPool.findMany({
      where: { network: user.network, remainingVouchers: { gt: 0 } },
    });

    console.log('[SCRATCH] Available pools for', user.network, ':', availablePools.map((p) => ({
      amount: p.amount,
      remaining: p.remainingVouchers,
    })));

    if (availablePools.length === 0) {
      console.log('[SCRATCH] No vouchers available for network:', user.network);

      const allAvailablePools = await prisma.voucherPool.findMany({
        where: { remainingVouchers: { gt: 0 } },
        distinct: ['network'],
      });
      const availableNetworks = allAvailablePools.map((p) => p.network);

      return NextResponse.json({
        error: 'NO_VOUCHERS_AVAILABLE',
        message: `No vouchers available for ${user.network} network at this time.`,
        network: user.network,
        availableNetworks,
        suggestion: availableNetworks.length > 0
          ? `Try switching to ${availableNetworks.join(', ')} network`
          : 'Please check back later. New vouchers will be added soon!',
      }, { status: 404 });
    }

    // Calculate total remaining vouchers for weighted selection
    const totalVouchers = availablePools.reduce((sum, pool) => sum + pool.remainingVouchers, 0);

    const random = Math.random() * totalVouchers;
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

    // Create a temporary locked voucher, attach it to the user and log the
    // event atomically so partial writes can't leave a dangling state.
    const voucher = await prisma.$transaction(async (tx) => {
      const created = await tx.voucher.create({
        data: { network: user.network, amount: potentialAmount, status: 'locked' },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          currentVoucherId: created.id,
          currentRevealedAmount: potentialAmount,
          lastAttemptAt: new Date(),
          totalAttempts: { increment: 1 },
        },
      });

      await tx.scratchEvent.create({
        data: {
          userId: user.id,
          voucherId: created.id,
          revealedAmount: potentialAmount,
          timestamp: new Date(),
        },
      });

      return created;
    });

    console.log('[SCRATCH] Success for user:', user.id);

    return NextResponse.json({
      amount: potentialAmount,
      voucherId: voucher.id,
      network: user.network,
      message: `Unaweza kushinda TZS ${potentialAmount}! Share kwa Marafiki watatu kufungua nafasi yako!`,
    });
  } catch (error) {
    console.error('[SCRATCH] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
