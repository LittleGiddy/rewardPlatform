import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Winner from '@/models/Winner';
import ScratchEvent from '@/models/ScratchEvent';
import VoucherPool from '@/models/VoucherPool';

interface PoolDoc {
  remainingVouchers: number;
}

export async function GET(req: NextRequest) {
  await dbConnect();
  
  const totalUsers = await User.countDocuments();
  const totalWinners = await Winner.countDocuments();
  const totalScratches = await ScratchEvent.countDocuments();
  
  const pools = await VoucherPool.find() as PoolDoc[];
  const remainingVouchers = pools.reduce((sum: number, p: PoolDoc) => sum + p.remainingVouchers, 0);
  
  const winRate = totalScratches > 0 ? ((totalWinners / totalScratches) * 100).toFixed(2) : 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeUsersToday = await ScratchEvent.countDocuments({
    timestamp: { $gte: today }
  });
  
  return NextResponse.json({
    totalUsers,
    totalScratches,
    totalWinners,
    remainingVouchers,
    winRate: parseFloat(winRate as string),
    activeUsersToday
  });
}