import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ShareLink from '@/models/ShareLink';

export async function GET(req: NextRequest) {
  await dbConnect();
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let shareLink = await ShareLink.findOne({ userId });
  if (!shareLink) {
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const code = user.referralCode; // or generate new
    shareLink = await ShareLink.create({ userId, code, clicks: [] });
  }

  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/ref/${shareLink.code}`;
  return NextResponse.json({ link, clickCount: shareLink.clicks.length });
}