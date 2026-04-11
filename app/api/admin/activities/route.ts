import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Winner from '@/models/Winner';
import ScratchEvent from '@/models/ScratchEvent';
import User from '@/models/User';

interface Activity {
  icon: string;
  message: string;
  time: string;
  status: string;
}

interface WinnerDoc {
  _id: string;
  prizeAmount: number;
  wonAt: Date;
  userId?: {
    network: string;
  };
}

interface ScratchEventDoc {
  _id: string;
  revealedAmount: number;
  timestamp: Date;
}

interface UserDoc {
  _id: string;
  network: string;
  createdAt: Date;
}

export async function GET(req: NextRequest) {
  await dbConnect();
  
  const activities: Activity[] = [];
  
  // Recent winners
  const recentWinners = await Winner.find()
    .sort({ wonAt: -1 })
    .limit(5)
    .populate('userId', 'network') as WinnerDoc[];
  
  recentWinners.forEach((winner: WinnerDoc) => {
    activities.push({
      icon: '🏆',
      message: `${winner.userId?.network || 'User'} won KSH ${winner.prizeAmount}`,
      time: new Date(winner.wonAt).toLocaleString(),
      status: 'success'
    });
  });
  
  // Recent scratches
  const recentScratches = await ScratchEvent.find()
    .sort({ timestamp: -1 })
    .limit(5) as ScratchEventDoc[];
  
  recentScratches.forEach((scratch: ScratchEventDoc) => {
    activities.push({
      icon: '🎰',
      message: `User scratched and revealed KSH ${scratch.revealedAmount}`,
      time: new Date(scratch.timestamp).toLocaleString(),
      status: 'info'
    });
  });
  
  // New users
  const newUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5) as UserDoc[];
  
  newUsers.forEach((user: UserDoc) => {
    activities.push({
      icon: '👤',
      message: `New user joined from ${user.network}`,
      time: new Date(user.createdAt).toLocaleString(),
      status: 'info'
    });
  });
  
  // Sort by time (most recent first)
  activities.sort((a: Activity, b: Activity) => 
    new Date(b.time).getTime() - new Date(a.time).getTime()
  );
  
  return NextResponse.json(activities.slice(0, 20));
}