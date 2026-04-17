import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Winner from '@/models/Winner';
import ScratchEvent from '@/models/ScratchEvent';
import User from '@/models/User';

interface Activity {
  icon: string;
  message: string;
  time: string;
  timeRaw: Date;  // Add raw date for sorting
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
      message: `${winner.userId?.network || 'User'} won TSH ${winner.prizeAmount}`,
      time: formatRelativeTime(new Date(winner.wonAt)),
      timeRaw: new Date(winner.wonAt),
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
      message: `User scratched and revealed TSH ${scratch.revealedAmount}`,
      time: formatRelativeTime(new Date(scratch.timestamp)),
      timeRaw: new Date(scratch.timestamp),
      status: 'info'
    });
  });
  
  // New users - only from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const newUsers = await User.find({
    createdAt: { $gte: sevenDaysAgo }
  })
  .sort({ createdAt: -1 })
  .limit(5) as UserDoc[];
  
  newUsers.forEach((user: UserDoc) => {
    activities.push({
      icon: '👤',
      message: `New user joined from ${user.network}`,
      time: formatRelativeTime(new Date(user.createdAt)),
      timeRaw: new Date(user.createdAt),
      status: 'info'
    });
  });
  
  // Sort by raw date (most recent first)
  activities.sort((a: Activity, b: Activity) => 
    b.timeRaw.getTime() - a.timeRaw.getTime()
  );
  
  return NextResponse.json(activities.slice(0, 20));
}

// Helper function to format time as "2 minutes ago", "1 hour ago", etc.
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