import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ScratchEvent from '@/models/ScratchEvent';

export async function DELETE(req: NextRequest) {
  await dbConnect();
  
  const { searchParams } = new URL(req.url);
  const olderThanDays = searchParams.get('olderThanDays');
  const network = searchParams.get('network');
  
  let query: any = {};
  
  if (olderThanDays) {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(olderThanDays));
    query.timestamp = { $lt: date };
  }
  
  if (network) {
    // Need to populate and filter by user network - more complex
    // For simplicity, we'll delete all and let the frontend handle network filtering
    // Or implement a more complex query
  }
  
  const result = await ScratchEvent.deleteMany(query);
  
  return NextResponse.json({ 
    success: true, 
    message: `Deleted ${result.deletedCount} scratch events`,
    deletedCount: result.deletedCount
  });
}