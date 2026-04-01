import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';

export async function POST(req: NextRequest) {
  await dbConnect();
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shareLink = await ShareLink.findOne({ userId });
  if (!shareLink) {
    return NextResponse.json({ verified: false, clicks: 0 });
  }

  // Count unique IPs
  const uniqueIPs = new Set(shareLink.clicks.map((c: any) => c.ip));
  const uniqueCount = uniqueIPs.size;

  if (uniqueCount >= 3) {
    shareLink.verifiedAt = new Date();
    await shareLink.save();
    return NextResponse.json({ verified: true, clicks: uniqueCount });
  } else {
    return NextResponse.json({ verified: false, clicks: uniqueCount });
  }
}