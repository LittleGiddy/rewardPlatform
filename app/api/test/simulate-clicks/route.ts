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

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  let shareLink = await ShareLink.findOne({ userId });
  if (!shareLink) {
    shareLink = await ShareLink.create({ 
      userId, 
      code: Math.random().toString(36).substring(2, 10),
      clicks: [] 
    });
  }

  // Simulate unique clicks
  const existingIPs = new Set(shareLink.clicks.map((c: any) => c.ip));
  let added = 0;
  
  for (let i = 0; i < count; i++) {
    const fakeIP = `192.168.1.${300 + i + shareLink.clicks.length}`;
    if (!existingIPs.has(fakeIP)) {
      shareLink.clicks.push({
        ip: fakeIP,
        userAgent: 'Mozilla/5.0 (Test Simulator)',
        timestamp: new Date(),
        verified: true
      });
      added++;
      existingIPs.add(fakeIP);
    }
  }
  
  // Auto-verify if we have 3+ unique clicks
  const uniqueIPs = new Set(shareLink.clicks.map((c: any) => c.ip));
  if (uniqueIPs.size >= 3 && !shareLink.verifiedAt) {
    shareLink.verifiedAt = new Date();
  }
  
  await shareLink.save();
  
  return NextResponse.json({ 
    success: true,
    message: `Added ${added} simulated clicks. Total unique: ${uniqueIPs.size}`,
    totalClicks: shareLink.clicks.length,
    uniqueIPs: uniqueIPs.size,
    verified: !!shareLink.verifiedAt
  });
}