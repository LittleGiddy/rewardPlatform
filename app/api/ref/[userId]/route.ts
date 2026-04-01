import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  await dbConnect();
  const code = params.userId; // actually it's the referral code
  const shareLink = await ShareLink.findOne({ code });
  if (!shareLink) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // Add click (simplified, no duplicate IP check for demo)
  shareLink.clicks.push({ ip, userAgent, timestamp: new Date() });
  await shareLink.save();

  // Set a cookie to mark that this user came via referral (for dwell time tracking, optional)
  cookies().set('ref', code, { maxAge: 60 * 60 }); // 1 hour

  // Redirect to home page
  return NextResponse.redirect(new URL('/', req.url));
}