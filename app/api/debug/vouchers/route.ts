import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import VoucherPool from '@/models/VoucherPool';

export async function GET() {
  await dbConnect();
  
  const vouchers = await Voucher.find({});
  const pools = await VoucherPool.find({});
  
  return NextResponse.json({
    vouchers: vouchers.map(v => ({
      network: v.network,
      amount: v.amount,
      code: v.voucherCode,
      status: v.status
    })),
    pools: pools.map(p => ({
      network: p.network,
      amount: p.amount,
      total: p.totalVouchers,
      remaining: p.remainingVouchers
    }))
  });
}