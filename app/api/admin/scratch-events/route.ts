import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ScratchEvent from '@/models/ScratchEvent';

export async function GET(req: NextRequest) {
  await dbConnect();
  
  const events = await ScratchEvent.find()
    .sort({ timestamp: -1 })
    .limit(500)
    .populate('userId', 'network');
  
  return NextResponse.json(events);
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (id) {
    await ScratchEvent.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Event deleted' });
  }
  
  return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
}