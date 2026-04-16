import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Winner from '@/models/Winner';
import ScratchEvent from '@/models/ScratchEvent';

export async function DELETE(req: NextRequest) {
  await dbConnect();
  
  const { searchParams } = new URL(req.url);
  const olderThanDays = searchParams.get('olderThanDays');
  
  let deletedCount = 0;
  
  try {
    if (olderThanDays) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(olderThanDays));
      
      // Delete old scratch events
      const eventsResult = await ScratchEvent.deleteMany({ timestamp: { $lt: date } });
      deletedCount = eventsResult.deletedCount || 0;
      
      // Also delete old winners if any
      const winnersResult = await Winner.deleteMany({ wonAt: { $lt: date } });
      deletedCount += winnersResult.deletedCount || 0;
      
      return NextResponse.json({ 
        success: true, 
        message: `Deleted ${deletedCount} activities older than ${olderThanDays} days`,
        deletedCount
      });
    } else {
      // Delete ALL scratch events
      const eventsResult = await ScratchEvent.deleteMany({});
      const winnersResult = await Winner.deleteMany({});
      deletedCount = (eventsResult.deletedCount || 0) + (winnersResult.deletedCount || 0);
      
      return NextResponse.json({ 
        success: true, 
        message: `Deleted ${deletedCount} activities (${eventsResult.deletedCount || 0} scratches, ${winnersResult.deletedCount || 0} winners)`,
        deletedCount
      });
    }
  } catch (error) {
    console.error('[Clear Activities] Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to clear activities',
      error: String(error)
    }, { status: 500 });
  }
}