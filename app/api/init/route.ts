import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  console.log('[INIT] === START ===');
  
  try {
    // Step 1: Parse body
    console.log('[INIT] Step 1: Parsing body');
    const body = await req.json();
    const { network } = body;
    console.log('[INIT] Network:', network);
    
    if (!network) {
      console.log('[INIT] No network provided');
      return NextResponse.json({ error: 'Network required' }, { status: 400 });
    }
    
    // Step 2: Connect to DB
    console.log('[INIT] Step 2: Connecting to DB');
    await dbConnect();
    console.log('[INIT] DB Connected');
    
    // Step 3: Create simple fingerprint
    console.log('[INIT] Step 3: Creating fingerprint');
    const fingerprint = `vercel-${Date.now()}-${Math.random()}`;
    
    // Step 4: Find or create user
    console.log('[INIT] Step 4: Finding/Creating user');
    let user = await User.findOne({ deviceFingerprint: fingerprint });
    
    if (!user) {
      console.log('[INIT] Creating new user');
      user = await User.create({
        network,
        deviceFingerprint: fingerprint,
        ipHash: 'vercel-deployment',
        referralCode: Math.random().toString(36).substring(2, 10),
      });
      console.log('[INIT] User created:', user._id);
    } else {
      console.log('[INIT] User found:', user._id);
      user.network = network;
      await user.save();
    }
    
    // Step 5: Generate token
    console.log('[INIT] Step 5: Generating token');
    const token = await signToken(user._id.toString());
    console.log('[INIT] Token generated');
    
    // Step 6: Set cookie and return
    console.log('[INIT] Step 6: Setting cookie');
    const response = NextResponse.json({ success: true });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    
    console.log('[INIT] === SUCCESS ===');
    return response;
    
  } catch (error) {
    console.error('[INIT] ERROR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}