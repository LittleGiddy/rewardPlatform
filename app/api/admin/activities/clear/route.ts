import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Winner from '@/models/Winner';
import ScratchEvent from '@/models/ScratchEvent';

export async function DELETE(req: NextRequest) {
  await dbConnect();
  
  const { searchParams } = new URL(req.url);
  const olderThanDays = searchParams.get('olderThanDays');
  
  let deletedCount = 0;
  let message = '';
  
  if (olderThanDays) {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(olderThanDays));
    
    // Delete old winners
    const winnersResult = await Winner.deleteMany({ wonAt: { $lt: date } });
    deletedCount += winnersResult.deletedCount || 0;
    
    // Delete old scratch events
    const eventsResult = await ScratchEvent.deleteMany({ timestamp: { $lt: date } });
    deletedCount += eventsResult.deletedCount || 0;
    
    message = `Deleted ${deletedCount} activities older than ${olderThanDays} days`;
  } else {
    // Delete all activities (winners and scratch events)
    const winnersResult = await Winner.deleteMany({});
    const eventsResult = await ScratchEvent.deleteMany({});
    deletedCount = (winnersResult.deletedCount || 0) + (eventsResult.deletedCount || 0);
    message = `Deleted ${deletedCount} activities`;
  }
  
  return NextResponse.json({ 
    success: true, 
    message,
    deletedCount
  });
}