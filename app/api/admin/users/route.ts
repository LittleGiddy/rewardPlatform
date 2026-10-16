import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const today = new Date().toISOString().split('T')[0];

  const attempts = await prisma.attempt.findMany({
    where: { date: today, userFingerprint: { in: users.map((u) => u.deviceFingerprint) } },
    select: { userFingerprint: true, count: true },
  });
  const attemptMap = new Map(attempts.map((a) => [a.userFingerprint, a.count]));

  const result = users.map((user) => ({
    ...user,
    _id: user.id,
    attemptsToday: attemptMap.get(user.deviceFingerprint) || 0,
  }));

  return NextResponse.json(result);
}
