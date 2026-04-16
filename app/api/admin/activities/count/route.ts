import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Winner from '@/models/Winner';
import ScratchEvent from '@/models/ScratchEvent';

export async function GET() {
  await dbConnect();
  
  const winnersCount = await Winner.countDocuments();
  const scratchesCount = await ScratchEvent.countDocuments();
  
  return NextResponse.json({
    winners: winnersCount,
    scratchEvents: scratchesCount,
    total: winnersCount + scratchesCount
  });
}