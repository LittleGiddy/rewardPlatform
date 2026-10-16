import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const vouchers = await prisma.voucher.findMany();
  const pools = await prisma.voucherPool.findMany();

  return NextResponse.json({
    vouchers: vouchers.map((v) => ({
      network: v.network,
      amount: v.amount,
      code: v.voucherCode,
      status: v.status,
    })),
    pools: pools.map((p) => ({
      network: p.network,
      amount: p.amount,
      total: p.totalVouchers,
      remaining: p.remainingVouchers,
    })),
  });
}
