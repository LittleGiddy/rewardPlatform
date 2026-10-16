import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const result = await prisma.voucher.deleteMany({
    where: { status: 'locked', createdAt: { lt: oneHourAgo } },
  });

  return NextResponse.json({
    success: true,
    deleted: result.count,
  });
}
