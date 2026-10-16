import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const winnersCount = await prisma.winner.count();
  const scratchesCount = await prisma.scratchEvent.count();

  return NextResponse.json({
    winners: winnersCount,
    scratchEvents: scratchesCount,
    total: winnersCount + scratchesCount,
  });
}
