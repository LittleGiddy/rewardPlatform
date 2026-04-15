import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Get token from cookie
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const userId = payload.userId;
    
    const shareLink = await ShareLink.findOne({ userId });
    if (!shareLink) {
      return NextResponse.json({ verified: false, clicks: 0 });
    }
    
    // Count unique clicks (backend requires only 1 unique click)
    const uniqueIPs = new Set(shareLink.clicks.map((c: any) => c.ip));
    const uniqueCount = uniqueIPs.size;
    
    // BACKEND: Only 1 click required to verify
    // FRONTEND: Will still show "3 clicks needed" for user experience
    const BACKEND_REQUIRED_CLICKS = 1;
    const FRONTEND_REQUIRED_CLICKS = 3;
    
    if (uniqueCount >= BACKEND_REQUIRED_CLICKS) {
      shareLink.verifiedAt = new Date();
      await shareLink.save();
      // Return verified true, but also send the actual click count
      // Frontend will still show 3 as target, but backend unlocks at 1
      return NextResponse.json({ 
        verified: true, 
        clicks: uniqueCount,
        required: FRONTEND_REQUIRED_CLICKS // Send the frontend requirement
      });
    }
    
    return NextResponse.json({ 
      verified: false, 
      clicks: uniqueCount,
      required: FRONTEND_REQUIRED_CLICKS
    });
    
  } catch (error) {
    console.error('[VERIFY-SHARE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}