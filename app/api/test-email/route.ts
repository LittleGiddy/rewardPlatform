import { NextRequest, NextResponse } from 'next/server';
import { sendWinnerNotification } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const testWinner = {
    userName: 'Test User',
    userPhone: '0712345678',
    userNetwork: 'Vodacom',
    voucherAmount: 500,
    voucherCode: 'TEST-CODE-123',
    winnerId: 'test123456',
    wonAt: new Date(),
  };

  const result = await sendWinnerNotification(testWinner);
  return NextResponse.json(result);
}