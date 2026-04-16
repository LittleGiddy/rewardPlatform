import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import VoucherPool from '@/models/VoucherPool';

export async function GET() {
  await dbConnect();
  
  const pools = await VoucherPool.find({ 
    remainingVouchers: { $gt: 0 }
  });
  
  const availableNetworks = [...new Set(pools.map(p => p.network))];
  
  const networkDetails = pools.map(p => ({
    network: p.network,
    amount: p.amount,
    remaining: p.remainingVouchers
  }));
  
  return NextResponse.json({
    hasVouchers: pools.length > 0,
    availableNetworks,
    networkDetails,
    totalRemaining: pools.reduce((sum, p) => sum + p.remainingVouchers, 0)
  });
}