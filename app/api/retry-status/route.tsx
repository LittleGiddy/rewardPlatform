import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (user.lockUntil && user.lockUntil > new Date()) {
    return NextResponse.json({ locked: true, lockUntil: user.lockUntil });
  }

  if (user.lastAttemptAt) {
    const elapsed = Date.now() - user.lastAttemptAt.getTime();
    const cooldown = 10 * 60 * 1000;
    if (elapsed < cooldown) {
      return NextResponse.json({ cooldown: true, remaining: cooldown - elapsed });
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const attemptDoc = await prisma.attempt.findUnique({
    where: { userFingerprint_date: { userFingerprint: user.deviceFingerprint, date: today } },
  });
  const attemptsLeft = attemptDoc ? 5 - attemptDoc.count : 5;

  return NextResponse.json({ canTry: true, attemptsLeft });
}
