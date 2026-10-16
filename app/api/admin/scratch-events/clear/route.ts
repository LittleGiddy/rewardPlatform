import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import type { Network, Prisma } from '@prisma/client';

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const olderThanDays = searchParams.get('olderThanDays');
  const network = searchParams.get('network');

  const where: Prisma.ScratchEventWhereInput = {};

  if (olderThanDays) {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(olderThanDays));
    where.timestamp = { lt: date };
  }

  if (network) {
    where.user = { network: network as Network };
  }

  const result = await prisma.scratchEvent.deleteMany({ where });

  return NextResponse.json({
    success: true,
    message: `Deleted ${result.count} scratch events`,
    deletedCount: result.count,
  });
}
