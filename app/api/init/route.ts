import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';
import { generateFingerprint } from '@/lib/fingerprint';

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    console.log('[INIT] ========== STARTING INIT ==========');
    
    // Parse request body
    let network, phone;
    try {
      const body = await req.json();
      network = body.network;
      phone = body.phone;
      console.log('[INIT] Request body:', { network, phone });
    } catch (err) {
      console.error('[INIT] Failed to parse JSON:', err);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate network
    if (!network) {
      console.log('[INIT] Missing network');
      return NextResponse.json({ error: 'Network is required' }, { status: 400 });
    }

    // Validate network is allowed
    const allowedNetworks = ['Yas', 'Airtel', 'Vodacom', 'Halotel', 'MTN', 'Test'];
    if (!allowedNetworks.includes(network)) {
      console.log('[INIT] Invalid network:', network);
      return NextResponse.json({ error: 'Invalid network. Please select from the dropdown.' }, { status: 400 });
    }

    // Connect to database
    console.log('[INIT] Connecting to database...');
    try {
      await dbConnect();
      console.log('[INIT] Database connected successfully');
    } catch (dbErr) {
      console.error('[INIT] Database connection failed:', dbErr);
      return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 });
    }

    // Get fingerprint
    const ip = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const fingerprint = generateFingerprint(ip, userAgent);
    console.log('[INIT] Fingerprint generated:', fingerprint.substring(0, 20) + '...');

    // Find or create user
    console.log('[INIT] Looking for existing user...');
    let user;
    try {
      user = await User.findOne({ deviceFingerprint: fingerprint });
      console.log('[INIT] User lookup result:', user ? 'Found' : 'Not found');
    } catch (findErr) {
      console.error('[INIT] Error finding user:', findErr);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }
    
    if (user) {
      console.log('[INIT] Updating existing user:', user._id);
      try {
        user.network = network;
        if (phone) user.phone = phone;
        await user.save();
        console.log('[INIT] User updated successfully');
      } catch (saveErr) {
        console.error('[INIT] Error saving user:', saveErr);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }
    } else {
      console.log('[INIT] Creating new user...');
      try {
        user = await User.create({
          network,
          phone: phone || null,
          deviceFingerprint: fingerprint,
          ipHash: ip,
          referralCode: Math.random().toString(36).substring(2, 10),
          consecutiveLosses: 0,
        });
        console.log('[INIT] New user created:', user._id);
      } catch (createErr) {
        console.error('[INIT] Error creating user:', createErr);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
    }

    // Generate JWT token
    console.log('[INIT] Generating JWT token...');
    let token;
    try {
      token = await signToken(user._id.toString());
      console.log('[INIT] Token generated successfully');
    } catch (tokenErr) {
      console.error('[INIT] Token generation failed:', tokenErr);
      return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
    }

    // Set cookie and return
    console.log('[INIT] Setting cookie and returning response');
    const response = NextResponse.json({ success: true, userId: user._id });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    console.log('[INIT] ========== INIT COMPLETED SUCCESSFULLY ==========');
    return response;
    
  } catch (error) {
    console.error('[INIT] UNEXPECTED ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}