import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import type { Network, Prisma, VoucherStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const network = searchParams.get('network');
  const status = searchParams.get('status');

  const where: Prisma.VoucherWhereInput = {};
  if (network) where.network = network as Network;
  if (status) where.status = status as VoucherStatus;

  const vouchers = await prisma.voucher.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const pools = await prisma.voucherPool.findMany({
    orderBy: [{ network: 'asc' }, { amount: 'asc' }],
  });

  return NextResponse.json({
    vouchers: vouchers.map((v) => ({ ...v, _id: v.id })),
    pools: pools.map((p) => ({ ...p, _id: p.id })),
  });
}

export async function POST(req: NextRequest) {
  const { network, amount, voucherCodes } = await req.json();

  if (!network || !amount || !voucherCodes || !Array.isArray(voucherCodes)) {
    return NextResponse.json({ error: 'Missing required fields. Need network, amount, and voucherCodes array.' }, { status: 400 });
  }

  const parsedAmount = parseInt(amount);
  const addedVouchers = [];
  const existingCodes: string[] = [];

  for (const code of voucherCodes) {
    const normalized = String(code).toUpperCase();

    const existing = await prisma.voucher.findUnique({ where: { voucherCode: normalized } });
    if (existing) {
      existingCodes.push(code);
      continue;
    }

    const voucher = await prisma.voucher.create({
      data: {
        network: network as Network,
        amount: parsedAmount,
        voucherCode: normalized,
        status: 'available',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    addedVouchers.push(voucher);
  }

  if (addedVouchers.length > 0) {
    await prisma.voucherPool.upsert({
      where: { network_amount: { network: network as Network, amount: parsedAmount } },
      update: {
        totalVouchers: { increment: addedVouchers.length },
        remainingVouchers: { increment: addedVouchers.length },
      },
      create: {
        network: network as Network,
        amount: parsedAmount,
        totalVouchers: addedVouchers.length,
        remainingVouchers: addedVouchers.length,
      },
    });
  }

  const pool = await prisma.voucherPool.findUnique({
    where: { network_amount: { network: network as Network, amount: parsedAmount } },
  });

  return NextResponse.json({
    success: true,
    message: `Added ${addedVouchers.length} vouchers for ${network} - TZS ${amount}`,
    added: addedVouchers.length,
    duplicates: existingCodes,
    pool,
  });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');

  if (status && ['available', 'redeemed', 'locked'].includes(status)) {
    const result = await prisma.voucher.deleteMany({ where: { status: status as VoucherStatus } });
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} ${status} vouchers`,
    });
  }

  if (id) {
    const voucher = await prisma.voucher.findUnique({ where: { id } });
    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    if (voucher.status === 'available') {
      await prisma.voucherPool.updateMany({
        where: { network: voucher.network, amount: voucher.amount },
        data: {
          totalVouchers: { decrement: 1 },
          remainingVouchers: { decrement: 1 },
        },
      });
    }

    await prisma.voucher.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Voucher deleted' });
  }

  return NextResponse.json({ error: 'No ID or status provided' }, { status: 400 });
}
