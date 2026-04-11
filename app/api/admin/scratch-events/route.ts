import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ScratchEvent from '@/models/ScratchEvent';

interface ScratchEventDoc {
  _id: string;
  revealedAmount: number;
  timestamp: Date;
  userId?: {
    network: string;
    _id: string;
  };
  toObject(): any;
}

export async function GET(req: NextRequest) {
  await dbConnect();
  
  const events = await ScratchEvent.find()
    .sort({ timestamp: -1 })
    .limit(200)
    .populate('userId', 'network') as ScratchEventDoc[];
  
  return NextResponse.json(events);
}