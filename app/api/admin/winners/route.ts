import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Winner from '@/models/Winner';
import Voucher from '@/models/Voucher';

interface WinnerDoc {
  _id: string;
  prizeAmount: number;
  network: string;
  wonAt: Date;
  userId?: {
    network: string;
    _id: string;
  };
  voucherId: string;
  toObject(): any;
}

interface VoucherDoc {
  voucherCode: string;
  status: string;
}

export async function GET(req: NextRequest) {
  await dbConnect();
  
  const winners = await Winner.find()
    .sort({ wonAt: -1 })
    .populate('userId', 'network')
    .limit(200) as WinnerDoc[];
  
  // Add voucher status
  const winnersWithStatus = await Promise.all(winners.map(async (winner: WinnerDoc) => {
    const voucher = await Voucher.findById(winner.voucherId) as VoucherDoc | null;
    return {
      ...winner.toObject(),
      voucherCode: voucher?.voucherCode,
      status: voucher?.status || 'unknown'
    };
  }));
  
  return NextResponse.json(winnersWithStatus);
}