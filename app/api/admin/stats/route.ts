import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const totalUsers = await prisma.user.count();
  const totalWinners = await prisma.winner.count();
  const totalScratches = await prisma.scratchEvent.count();

  const poolSum = await prisma.voucherPool.aggregate({ _sum: { remainingVouchers: true } });
  const remainingVouchers = poolSum._sum.remainingVouchers ?? 0;

  const winRate = totalScratches > 0 ? ((totalWinners / totalScratches) * 100).toFixed(2) : '0';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeUsersToday = await prisma.scratchEvent.count({
    where: { timestamp: { gte: today } },
  });

  return NextResponse.json({
    totalUsers,
    totalScratches,
    totalWinners,
    remainingVouchers,
    winRate: parseFloat(winRate),
    activeUsersToday,
  });
}
