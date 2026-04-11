import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Attempt from '@/models/Attempt';

interface UserDoc {
  _id: string;
  network: string;
  phone?: string;
  createdAt: Date;
  deviceFingerprint: string;
  consecutiveLosses?: number;
  totalWins?: number;
  lastAttemptAt?: Date;
  currentRevealedAmount?: number;
  toObject(): any;
}

interface AttemptDoc {
  count: number;
}

export async function GET(req: NextRequest) {
  await dbConnect();
  
  const users = await User.find().sort({ createdAt: -1 }).limit(100) as UserDoc[];
  const today = new Date().toISOString().split('T')[0];
  
  const usersWithAttempts = await Promise.all(users.map(async (user: UserDoc) => {
    const attemptDoc = await Attempt.findOne({ 
      userFingerprint: user.deviceFingerprint, 
      date: today 
    }) as AttemptDoc | null;
    
    return {
      ...user.toObject(),
      attemptsToday: attemptDoc?.count || 0
    };
  }));
  
  return NextResponse.json(usersWithAttempts);
}