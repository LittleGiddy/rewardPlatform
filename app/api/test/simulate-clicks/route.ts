import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  await dbConnect();
  const { userId, count = 3 } = await req.json();

  const shareLink = await ShareLink.findOne({ userId });
  if (!shareLink) {
    return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
  }

  // Simulate unique clicks
  const uniqueIPs = new Set();
  for (let i = 0; i < count; i++) {
    uniqueIPs.add(`192.168.1.${i + 100}`);
  }
  
  uniqueIPs.forEach(ip => {
    shareLink.clicks.push({
      ip,
      userAgent: 'Mozilla/5.0 (Test Simulator)',
      timestamp: new Date(),
      verified: true
    });
  });
  
  await shareLink.save();
  
  return NextResponse.json({ 
    success: true, 
    totalClicks: shareLink.clicks.length,
    uniqueIPs: uniqueIPs.size
  });
}