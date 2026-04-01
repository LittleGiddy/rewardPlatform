import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';

export async function POST(req: NextRequest) {
  await dbConnect();
  const userId = req.headers.get('x-user-id');
  
  console.log('[VERIFY] Checking shares for user:', userId);
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // DEVELOPMENT ONLY: Auto-verify for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('[VERIFY] Development mode - auto-verifying');
    
    // Create share link if it doesn't exist
    let shareLink = await ShareLink.findOne({ userId });
    if (!shareLink) {
      shareLink = await ShareLink.create({ 
        userId, 
        code: Math.random().toString(36).substring(2, 10), 
        clicks: [] 
      });
      console.log('[VERIFY] Created new share link');
    }
    
    // Add simulated clicks if less than 3
    if (shareLink.clicks.length < 3) {
      const existingIPs = new Set(shareLink.clicks.map((c: any) => c.ip));
      for (let i = 0; i < 3; i++) {
        const fakeIP = `192.168.1.${200 + i}`;
        if (!existingIPs.has(fakeIP)) {
          shareLink.clicks.push({
            ip: fakeIP,
            userAgent: 'Mozilla/5.0 (Test)',
            timestamp: new Date(),
          });
        }
      }
      console.log('[VERIFY] Added simulated clicks');
    }
    
    // Mark as verified
    if (!shareLink.verifiedAt) {
      shareLink.verifiedAt = new Date();
      await shareLink.save();
      console.log('[VERIFY] Marked as verified');
    }
    
    const uniqueIPs = new Set(shareLink.clicks.map((c: any) => c.ip));
    return NextResponse.json({ verified: true, clicks: uniqueIPs.size });
  }

  // Production code
  const shareLink = await ShareLink.findOne({ userId });
  if (!shareLink) {
    return NextResponse.json({ verified: false, clicks: 0 });
  }

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