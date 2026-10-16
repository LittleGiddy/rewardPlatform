import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const pools = await prisma.voucherPool.findMany({
    where: { remainingVouchers: { gt: 0 } },
  });

  const availableNetworks = [...new Set(pools.map((p) => p.network))];

  const networkDetails = pools.map((p) => ({
    network: p.network,
    amount: p.amount,
    remaining: p.remainingVouchers,
  }));

  return NextResponse.json({
    hasVouchers: pools.length > 0,
    availableNetworks,
    networkDetails,
    totalRemaining: pools.reduce((sum, p) => sum + p.remainingVouchers, 0),
  });
}
