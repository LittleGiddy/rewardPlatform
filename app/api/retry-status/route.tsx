import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Attempt from '@/models/Attempt';

export async function GET(req: NextRequest) {
  await dbConnect();
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Check lock
  if (user.lockUntil && user.lockUntil > new Date()) {
    return NextResponse.json({ locked: true, lockUntil: user.lockUntil });
  }

  // Check cooldown
  if (user.lastAttemptAt) {
    const elapsed = new Date().getTime() - user.lastAttemptAt.getTime();
    const cooldown = 10 * 60 * 1000;
    if (elapsed < cooldown) {
      return NextResponse.json({ cooldown: true, remaining: cooldown - elapsed });
    }
  }

  // Check daily attempts
  const today = new Date().toISOString().split('T')[0];
  const attemptDoc = await Attempt.findOne({ userFingerprint: user.deviceFingerprint, date: today });
  const attemptsLeft = attemptDoc ? 5 - attemptDoc.count : 5;

  return NextResponse.json({ canTry: true, attemptsLeft });
}