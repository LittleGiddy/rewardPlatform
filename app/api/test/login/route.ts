import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  await dbConnect();
  const { userId, network = 'Test' } = await req.json();

  let user;
  
  if (userId) {
    user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } else {
    // Create a test user
    user = await User.create({
      network,
      phone: '1234567890',
      deviceFingerprint: `test-${Date.now()}`,
      ipHash: '127.0.0.1',
      referralCode: Math.random().toString(36).substring(2, 10),
      consecutiveLosses: 0,
    });
  }

  // Generate JWT token
  const token = await signToken(user._id.toString());

  // Set cookie
  const response = NextResponse.json({ 
    success: true, 
    userId: user._id,
    network: user.network,
    token 
  });
  
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}