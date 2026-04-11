import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Winner from '@/models/Winner';
import ScratchEvent from '@/models/ScratchEvent';
import ShareLink from '@/models/ShareLink';

interface NetworkDistribution {
  _id: string;
  count: number;
}

interface PrizeDistribution {
  _id: number;
  count: number;
}

export async function GET(req: NextRequest) {
  await dbConnect();
  
  const pageViews = await User.countDocuments();
  const networkSelections = await User.countDocuments();
  const scratches = await ScratchEvent.countDocuments();
  
  const shareLinks = await ShareLink.find();
  const sharesCompleted = shareLinks.filter((s: any) => s.verifiedAt).length;
  
  const winners = await Winner.countDocuments();
  
  const networkDistributionRaw = await User.aggregate([
    { $group: { _id: '$network', count: { $sum: 1 } } }
  ]) as NetworkDistribution[];
  
  const prizeDistributionRaw = await Winner.aggregate([
    { $group: { _id: '$prizeAmount', count: { $sum: 1 } } }
  ]) as PrizeDistribution[];
  
  const networkDistribution: Record<string, number> = {};
  networkDistributionRaw.forEach((d: NetworkDistribution) => {
    networkDistribution[d._id] = d.count;
  });
  
  const prizeDistribution: Record<string, number> = {};
  prizeDistributionRaw.forEach((d: PrizeDistribution) => {
    prizeDistribution[d._id.toString()] = d.count;
  });
  
  // Hourly activity for last 24 hours
  const hourlyActivity: number[] = [];
  for (let i = 0; i < 24; i++) {
    const start = new Date();
    start.setHours(i, 0, 0, 0);
    const end = new Date();
    end.setHours(i, 59, 59, 999);
    
    const count = await ScratchEvent.countDocuments({
      timestamp: { $gte: start, $lte: end }
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
    hourlyActivity
  });
}