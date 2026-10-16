import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Activity {
  icon: string;
  message: string;
  time: string;
  timeRaw: Date;
  status: string;
}

export async function GET(req: NextRequest) {
  const activities: Activity[] = [];

  const recentWinners = await prisma.winner.findMany({
    orderBy: { wonAt: 'desc' },
    take: 5,
    include: { user: { select: { network: true } } },
  });

  recentWinners.forEach((winner) => {
    activities.push({
      icon: '🏆',
      message: `${winner.user?.network || 'User'} won TSH ${winner.prizeAmount}`,
      time: formatRelativeTime(new Date(winner.wonAt)),
      timeRaw: new Date(winner.wonAt),
      status: 'success',
    });
  });

  const recentScratches = await prisma.scratchEvent.findMany({
    orderBy: { timestamp: 'desc' },
    take: 5,
  });

  recentScratches.forEach((scratch) => {
    activities.push({
      icon: '🎰',
      message: `User scratched and revealed TSH ${scratch.revealedAmount}`,
      time: formatRelativeTime(new Date(scratch.timestamp)),
      timeRaw: new Date(scratch.timestamp),
      status: 'info',
    });
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newUsers = await prisma.user.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  newUsers.forEach((user) => {
    activities.push({
      icon: '👤',
      message: `New user joined from ${user.network}`,
      time: formatRelativeTime(new Date(user.createdAt)),
      timeRaw: new Date(user.createdAt),
      status: 'info',
    });
  });

  activities.sort((a, b) => b.timeRaw.getTime() - a.timeRaw.getTime());

  return NextResponse.json(activities.slice(0, 20));
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return `${diffSec} seconds ago`;
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
