import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const totalUsers = await prisma.user.count();
  const totalWinners = await prisma.winner.count();
  const totalScratches = await prisma.scratchEvent.count();

  const poolSum = await prisma.voucherPool.aggregate({ _sum: { remainingVouchers: true } });
  const remainingVouchers = poolSum._sum.remainingVouchers ?? 0;

  const winRate = totalScratches > 0 ? ((totalWinners / totalScratches) * 100).toFixed(2) : '0';

  // Claims left until the next winner is selected (global 1-in-X counter)
  const [counter, settingsDoc] = await Promise.all([
    prisma.counter.findUnique({ where: { name: 'claimCounter' } }),
    prisma.settings.findUnique({ where: { key: 'platformSettings' } }),
  ]);
  const settingsValue = (settingsDoc?.value ?? {}) as { claimsPerWinner?: number };
  const claimsPerWinner =
    typeof settingsValue.claimsPerWinner === 'number' && settingsValue.claimsPerWinner > 0
      ? settingsValue.claimsPerWinner
      : 500;
  const claimsMade = counter?.value ?? 0;
  const claimsUntilNextWinner = claimsPerWinner - (claimsMade % claimsPerWinner);

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
    claimsPerWinner,
    claimsMade,
    claimsUntilNextWinner,
  });
}
