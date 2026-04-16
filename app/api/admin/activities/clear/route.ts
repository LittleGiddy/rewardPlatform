import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Winner from '@/models/Winner';
import ScratchEvent from '@/models/ScratchEvent';
import User from '@/models/User';

export async function DELETE(req: NextRequest) {
  await dbConnect();
  
  const { searchParams } = new URL(req.url);
  const olderThanDays = searchParams.get('olderThanDays');
  
  let deletedCount = 0;
  
  if (olderThanDays) {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(olderThanDays));
    
    // Delete old winners
    const winnersResult = await Winner.deleteMany({ wonAt: { $lt: date } });
    deletedCount += winnersResult.deletedCount || 0;
    
    // Delete old scratch events
    const eventsResult = await ScratchEvent.deleteMany({ timestamp: { $lt: date } });
    deletedCount += eventsResult.deletedCount || 0;
    
    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${deletedCount} old records (older than ${olderThanDays} days)`,
      deletedCount
    });
  }
  
  // For clearing all activities (you may want to be more selective)
  // This is just for demonstration - adjust based on your needs
  return NextResponse.json({ 
    success: true, 
    message: 'Clear functionality configured',
    deletedCount: 0
  });
}