import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';
import { cookies } from 'next/headers';

// Define the params type
interface RouteParams {
  params: Promise<{ userId: string }> | { userId: string };
}

// Helper function to get client IP
function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    
    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const code = resolvedParams.userId;
    
    console.log('[REF] Referral click for code:', code);
    
    // Find the share link by code
    const shareLink = await ShareLink.findOne({ code });
    
    if (!shareLink) {
      console.log('[REF] Share link not found for code:', code);
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Get client information
    const ip = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Check for duplicate IP within last hour (anti-abuse)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentClickFromSameIp = shareLink.clicks.some(
      (click: any) => click.ip === ip && new Date(click.timestamp) > oneHourAgo
    );
    
    if (!recentClickFromSameIp) {
      // Add click only if not duplicate within last hour
      shareLink.clicks.push({ 
        ip, 
        userAgent, 
        timestamp: new Date(),
        verified: false 
      });
      await shareLink.save();
      console.log('[REF] Click recorded from IP:', ip);
    } else {
      console.log('[REF] Duplicate click ignored from IP:', ip);
    }
    
    // Set a cookie to mark that this user came via referral
    const cookieStore = await cookies();
    cookieStore.set('ref', code, { 
      maxAge: 60 * 60, // 1 hour
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    // Redirect to home page with referral parameter
    const url = new URL('/', req.url);
    url.searchParams.set('ref', code);
    
    return NextResponse.redirect(url);
    
  } catch (error) {
    console.error('[REF] Error processing referral:', error);
    // Still redirect to home page even if there's an error
    return NextResponse.redirect(new URL('/', req.url));
  }
}