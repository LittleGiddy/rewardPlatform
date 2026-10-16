import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const winners = await prisma.winner.findMany({
    orderBy: { wonAt: 'desc' },
    take: 200,
    include: {
      user: { select: { id: true, network: true } },
      voucher: { select: { voucherCode: true, status: true } },
    },
  });

  const result = winners.map((winner) => {
    const { user, voucher, ...rest } = winner;
    return {
      ...rest,
      _id: winner.id,
      userId: { _id: user.id, network: user.network },
      voucherCode: voucher?.voucherCode,
      status: voucher?.status || 'unknown',
    };
  });

  return NextResponse.json(result);
}
