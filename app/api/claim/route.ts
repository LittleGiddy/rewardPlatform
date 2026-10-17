import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendWinnerNotification } from '@/lib/email';
import { getClientIp, rateLimit, tooManyRequests } from '@/lib/ratelimit';

let cachedClaimsPerWinner: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000;

async function getClaimsPerWinner(): Promise<number> {
  if (cachedClaimsPerWinner !== null && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedClaimsPerWinner;
  }
  const settingsDoc = await prisma.settings.findUnique({ where: { key: 'platformSettings' } });
  const value = (settingsDoc?.value as Record<string, unknown> | null)?.claimsPerWinner;
  cachedClaimsPerWinner = typeof value === 'number' ? value : 500;
  cacheTimestamp = Date.now();
  return cachedClaimsPerWinner;
}

const WINNER_COOLDOWN_DAYS = 2;

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');

  console.log('[CLAIM] Starting claim for user:', userId);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limit = await rateLimit('claim', 15, '10 m', `${userId}:${ip}`);
  if (!limit.success) {
    return tooManyRequests(limit.reset);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { currentVoucher: true, shareLink: { include: { clicks: { select: { ip: true } } } } },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Enforce the share requirement server-side: a user must have at least one
  // unique visitor click on their referral link before claiming.
  const uniqueClicks = user.shareLink
    ? new Set(user.shareLink.clicks.map((c) => c.ip)).size
    : 0;
  if (uniqueClicks < 1) {
    return NextResponse.json(
      { error: 'Share not verified. Please share your link and wait for a friend to open it.' },
      { status: 403 }
    );
  }

  if (!user.currentVoucherId || !user.currentVoucher) {
    return NextResponse.json({ error: 'No pending voucher found. Please scratch a card first.' }, { status: 400 });
  }

  const tempVoucher = user.currentVoucher;

  // Winner cooldown
  if (user.lastWinAt) {
    const daysSinceLastWin = (Date.now() - new Date(user.lastWinAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastWin < WINNER_COOLDOWN_DAYS) {
      const daysRemaining = Math.ceil(WINNER_COOLDOWN_DAYS - daysSinceLastWin);
      console.log(`[CLAIM] User on winner cooldown: ${daysRemaining} days remaining`);

      await prisma.$transaction([
        prisma.voucher.update({ where: { id: tempVoucher.id }, data: { status: 'redeemed' } }),
        prisma.user.update({
          where: { id: user.id },
          data: { currentVoucherId: null, currentRevealedAmount: null },
        }),
      ]);

      return NextResponse.json({
        winner: false,
        cooldown: true,
        message: `You can only win once every ${WINNER_COOLDOWN_DAYS} days. Try again in ${daysRemaining} days.`,
        daysRemaining,
      });
    }
  }

  const CLAIMS_PER_WINNER = await getClaimsPerWinner();

  // Atomically increment the claim counter and decide the outcome
  const { isWinner, claimValue } = await prisma.$transaction(async (tx) => {
    const counter = await tx.counter.upsert({
      where: { name: 'claimCounter' },
      update: { value: { increment: 1 } },
      create: { name: 'claimCounter', value: 1 },
    });
    const winner = counter.value % CLAIMS_PER_WINNER === 0;
    if (winner) {
      await tx.counter.update({ where: { name: 'claimCounter' }, data: { value: 0 } });
    }
    return { isWinner: winner, claimValue: counter.value };
  });

  console.log(`[CLAIM] Claim #${claimValue}, Winner: ${isWinner}, Threshold: ${CLAIMS_PER_WINNER}`);

  if (isWinner) {
    const availableVoucher = await prisma.voucher.findFirst({
      where: { network: user.network, amount: tempVoucher.amount, status: 'available' },
    });

    if (!availableVoucher) {
      console.log('[CLAIM] No available voucher found for:', user.network, tempVoucher.amount);
      const streak = (user.consecutiveLosses || 0) + 1;
      await prisma.$transaction([
        prisma.voucher.update({ where: { id: tempVoucher.id }, data: { status: 'redeemed' } }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            consecutiveLosses: streak,
            currentVoucherId: null,
            currentRevealedAmount: null,
          },
        }),
      ]);
      return NextResponse.json({ winner: false, streak });
    }

    const voucherCode = availableVoucher.voucherCode || '';
    const wonAt = new Date();

    await prisma.$transaction([
      prisma.voucher.update({
        where: { id: availableVoucher.id },
        data: { status: 'redeemed', winnerId: user.id, redeemedAt: wonAt },
      }),
      prisma.voucherPool.updateMany({
        where: { network: user.network, amount: tempVoucher.amount, remainingVouchers: { gt: 0 } },
        data: { remainingVouchers: { decrement: 1 } },
      }),
      prisma.winner.create({
        data: {
          userId: user.id,
          voucherId: availableVoucher.id,
          prizeAmount: tempVoucher.amount,
          network: user.network,
          wonAt,
          voucherCode,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          consecutiveLosses: 0,
          currentVoucherId: null,
          currentRevealedAmount: null,
          lastWinAt: wonAt,
          totalWins: { increment: 1 },
        },
      }),
      prisma.voucher.delete({ where: { id: tempVoucher.id } }),
    ]);

    console.log(`[CLAIM] WINNER! Amount: ${tempVoucher.amount}, Code: ${voucherCode}`);

    // Send email in background
    (async () => {
      try {
        await sendWinnerNotification({
          userName: user.phone || 'User',
          userPhone: user.phone ?? undefined,
          userNetwork: user.network,
          voucherAmount: tempVoucher.amount,
          voucherCode,
          winnerId: user.id,
          wonAt,
        });
        console.log('[EMAIL] Winner notification sent successfully');
      } catch (emailError) {
        console.error('[EMAIL] Failed to send winner notification:', emailError);
      }
    })();

    return NextResponse.json({
      winner: true,
      amount: tempVoucher.amount,
      voucherCode,
    });
  } else {
    const streak = (user.consecutiveLosses || 0) + 1;
    await prisma.$transaction([
      prisma.voucher.update({ where: { id: tempVoucher.id }, data: { status: 'redeemed' } }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          consecutiveLosses: streak,
          currentVoucherId: null,
          currentRevealedAmount: null,
        },
      }),
    ]);

    console.log(`[CLAIM] Loser - Streak: ${streak}`);
    return NextResponse.json({ winner: false, streak });
  }
}
