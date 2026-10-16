import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const pageViews = await prisma.user.count();
  const networkSelections = await prisma.user.count();
  const scratches = await prisma.scratchEvent.count();

  const sharesCompleted = await prisma.shareLink.count({ where: { verifiedAt: { not: null } } });

  const winners = await prisma.winner.count();

  const networkGroups = await prisma.user.groupBy({
    by: ['network'],
    _count: { _all: true },
  });

  const prizeGroups = await prisma.winner.groupBy({
    by: ['prizeAmount'],
    _count: { _all: true },
  });

  const networkDistribution: Record<string, number> = {};
  networkGroups.forEach((d) => {
    networkDistribution[d.network] = d._count._all;
  });

  const prizeDistribution: Record<string, number> = {};
  prizeGroups.forEach((d) => {
    prizeDistribution[d.prizeAmount.toString()] = d._count._all;
  });

  const hourlyActivity: number[] = [];
  for (let i = 0; i < 24; i++) {
    const start = new Date();
    start.setHours(i, 0, 0, 0);
    const end = new Date();
    end.setHours(i, 59, 59, 999);

    const count = await prisma.scratchEvent.count({
      where: { timestamp: { gte: start, lte: end } },
    });
    hourlyActivity.push(count);
  }

  return NextResponse.json({
    pageViews,
    networkSelections,
    scratches,
    sharesCompleted,
    winners,
    networkDistribution,
    prizeDistribution,
    hourlyActivity,
  });
}
