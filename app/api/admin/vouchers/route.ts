import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import VoucherPool from '@/models/VoucherPool';

// GET - Fetch all vouchers
export async function GET(req: NextRequest) {
  await dbConnect();
  
  const { searchParams } = new URL(req.url);
  const network = searchParams.get('network');
  const status = searchParams.get('status');
  
  let query: any = {};
  if (network) query.network = network;
  if (status) query.status = status;
  
  const vouchers = await Voucher.find(query)
    .sort({ createdAt: -1 })
    .limit(500);
  
  // Get pool summary
  const pools = await VoucherPool.find().sort({ network: 1, amount: 1 });
  
  return NextResponse.json({ vouchers, pools });
}

// POST - Add vouchers manually with codes
export async function POST(req: NextRequest) {
  await dbConnect();
  
  const { network, amount, voucherCodes } = await req.json();
  
  if (!network || !amount || !voucherCodes || !Array.isArray(voucherCodes)) {
    return NextResponse.json({ error: 'Missing required fields. Need network, amount, and voucherCodes array.' }, { status: 400 });
  }
  
  const addedVouchers = [];
  const existingCodes = [];
  
  for (const code of voucherCodes) {
    // Check if voucher code already exists
    const existing = await Voucher.findOne({ voucherCode: code.toUpperCase() });
    if (existing) {
      existingCodes.push(code);
      continue;
    }
    
    const voucher = await Voucher.create({
      network,
      amount: parseInt(amount),
      voucherCode: code.toUpperCase(),
      status: 'available',
    });
    addedVouchers.push(voucher);
  }
  
  // Update or create pool
  let pool = await VoucherPool.findOne({ network, amount: parseInt(amount) });
  if (pool) {
    pool.totalVouchers += addedVouchers.length;
    pool.remainingVouchers += addedVouchers.length;
    await pool.save();
  } else if (addedVouchers.length > 0) {
    pool = await VoucherPool.create({
      network,
      amount: parseInt(amount),
      totalVouchers: addedVouchers.length,
      remainingVouchers: addedVouchers.length,
    });
  }
  
  return NextResponse.json({ 
    success: true, 
    message: `Added ${addedVouchers.length} vouchers for ${network} - TZS ${amount}`,
    added: addedVouchers.length,
    duplicates: existingCodes,
    pool
  });
}

// In the DELETE function, remove the status check
export async function DELETE(req: NextRequest) {
  await dbConnect();
  
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');
  
  // Clear all vouchers by status (new feature)
  if (status && ['available', 'redeemed', 'locked'].includes(status)) {
    const result = await Voucher.deleteMany({ status });
    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} ${status} vouchers` 
    });
  }
  
  if (id) {
    // Allow deleting ANY voucher regardless of status
    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }
    
    // Update pool if voucher was available
    if (voucher.status === 'available') {
      const pool = await VoucherPool.findOne({ 
        network: voucher.network, 
        amount: voucher.amount 
      });
      if (pool) {
        pool.totalVouchers -= 1;
        pool.remainingVouchers -= 1;
        await pool.save();
      }
    }
    
    await Voucher.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Voucher deleted' });
  }
  
  return NextResponse.json({ error: 'No ID or status provided' }, { status: 400 });
}