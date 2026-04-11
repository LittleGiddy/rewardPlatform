import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Winner from '@/models/Winner';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  await dbConnect();

  const totalUsers = await User.countDocuments();
  const totalWinners = await Winner.countDocuments();
  const winRate = totalUsers > 0 ? (totalWinners / totalUsers) * 100 : 0;

  // Get users with streaks
  const usersWithStreaks = await User.find({ consecutiveLosses: { $gt: 0 } })
    .sort({ consecutiveLosses: -1 })
    .limit(10)
    .select('consecutiveLosses network');

  // Get recent winners
  const recentWinners = await Winner.find()
    .sort({ wonAt: -1 })
    .limit(10)
    .populate('userId', 'network');

  // Calculate average loss streak before winning
  const winnersWithStreaks = await Winner.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $group: {
        _id: null,
        averageStreak: { $avg: '$user.consecutiveLosses' },
        maxStreak: { $max: '$user.consecutiveLosses' }
      }
    }
  ]);

  return NextResponse.json({
    summary: {
      totalUsers,
      totalWinners,
      winRate: winRate.toFixed(2) + '%',
      expectedWinRate: '0.2% (1 in 500)'
    },
    streaks: {
      averageLossStreakBeforeWin: winnersWithStreaks[0]?.averageStreak?.toFixed(0) || 0,
      maxLossStreak: winnersWithStreaks[0]?.maxStreak || 0,
      currentHighestStreak: usersWithStreaks[0]?.consecutiveLosses || 0
    },
    recentWinners: recentWinners.map(w => ({
      amount: w.prizeAmount,
      network: w.userId?.network,
      date: w.wonAt
    })),
    topStreaks: usersWithStreaks
  });
}