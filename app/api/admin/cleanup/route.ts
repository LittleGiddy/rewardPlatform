import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Voucher from '@/models/Voucher';

export async function POST() {
  await dbConnect();
  
  // Delete all locked vouchers older than 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const result = await Voucher.deleteMany({
    status: 'locked',
    createdAt: { $lt: oneHourAgo }
  });
  
  return NextResponse.json({ 
    success: true, 
    deleted: result.deletedCount 
  });
}