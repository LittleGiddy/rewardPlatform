import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { currentVoucher: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let poolRemaining: number | null = null;
  if (user.currentVoucher) {
    const pool = await prisma.voucherPool.findFirst({
      where: { network: user.network, amount: user.currentVoucher.amount },
    });
    poolRemaining = pool?.remainingVouchers ?? null;
  }

  return NextResponse.json({
    userId: user.id,
    network: user.network,
    phone: user.phone,
    currentVoucherAmount: user.currentRevealedAmount,
    hasVoucher: !!user.currentVoucherId,
    consecutiveLosses: user.consecutiveLosses,
    totalAttempts: user.totalAttempts,
    totalWins: user.totalWins,
    poolRemaining,
  });
}
