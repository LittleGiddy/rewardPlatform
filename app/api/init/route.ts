import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';
import { generateFingerprint } from '@/lib/fingerprint';

function getClientIp(req: NextRequest): string {
  // For Vercel, check multiple headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const vercelIp = req.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }
  
  return 'unknown';
}

export async function POST(req: NextRequest) {
  // Simplified error handling for production
  try {
    console.log('[INIT] Starting...');
    
    // Parse request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { network, phone } = body;
    
    if (!network) {
      return NextResponse.json({ error: 'Network is required' }, { status: 400 });
    }
    
    // Validate network
    const allowedNetworks = ['Yas', 'Airtel', 'Vodacom', 'Halotel', 'MTN', 'Test'];
    if (!allowedNetworks.includes(network)) {
      return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }
    
    // Connect to database
    await dbConnect();
    
    // Get fingerprint
    const ip = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const fingerprint = generateFingerprint(ip, userAgent);
    
    // Find or create user
    let user = await User.findOne({ deviceFingerprint: fingerprint });
    
    if (user) {
      user.network = network;
      if (phone) user.phone = phone;
      await user.save();
    } else {
      user = await User.create({
        network,
        phone: phone || null,
        deviceFingerprint: fingerprint,
        ipHash: ip,
        referralCode: Math.random().toString(36).substring(2, 10),
        consecutiveLosses: 0,
      });
    }
    
    // Generate JWT token
    const token = await signToken(user._id.toString());
    
    // Set cookie and return
    const response = NextResponse.json({ success: true, userId: user._id });
    
    // Production cookie settings
    const isProduction = process.env.NODE_ENV === 'production';
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction, // true in production (HTTPS)
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
    
  } catch (error) {
    console.error('[INIT] Error:', error);
    
    // Return a user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Check for specific MongoDB errors
    if (errorMessage.includes('MongoNetworkError') || errorMessage.includes('connection')) {
      return NextResponse.json(
        { error: 'Database connection issue. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}