import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const totalUsers = await prisma.user.count();
  const totalWinners = await prisma.winner.count();
  const winRate = totalUsers > 0 ? (totalWinners / totalUsers) * 100 : 0;

  const usersWithStreaks = await prisma.user.findMany({
    where: { consecutiveLosses: { gt: 0 } },
    orderBy: { consecutiveLosses: 'desc' },
    take: 10,
    select: { id: true, consecutiveLosses: true, network: true },
  });

  const recentWinners = await prisma.winner.findMany({
    orderBy: { wonAt: 'desc' },
    take: 10,
    include: { user: { select: { network: true } } },
  });

  const winnerStreakRows = await prisma.$queryRaw<{ avg: number | null; max: number | null }[]>`
    SELECT AVG(u."consecutiveLosses")::float AS avg, MAX(u."consecutiveLosses") AS max
    FROM "Winner" w
    JOIN "User" u ON u.id = w."userId"
  `;

  return NextResponse.json({
    summary: {
      totalUsers,
      totalWinners,
      winRate: winRate.toFixed(2) + '%',
      expectedWinRate: '0.2% (1 in 500)',
    },
    streaks: {
      averageLossStreakBeforeWin: winnerStreakRows[0]?.avg?.toFixed(0) || 0,
      maxLossStreak: winnerStreakRows[0]?.max || 0,
      currentHighestStreak: usersWithStreaks[0]?.consecutiveLosses || 0,
    },
    recentWinners: recentWinners.map((w) => ({
      amount: w.prizeAmount,
      network: w.user.network,
      date: w.wonAt,
    })),
    topStreaks: usersWithStreaks.map((u) => ({
      _id: u.id,
      consecutiveLosses: u.consecutiveLosses,
      network: u.network,
    })),
  });
}
