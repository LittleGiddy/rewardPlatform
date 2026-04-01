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
  await dbConnect();
  const { network, phone } = await req.json();

  // Only network is required
  if (!network) {
    return NextResponse.json({ error: 'Network is required' }, { status: 400 });
  }

  // Optional: validate network is one of allowed
  const allowedNetworks = ['Yas', 'Airtel', 'Vodacom', 'Halotel'];
  if (!allowedNetworks.includes(network)) {
    return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
  }

  // Get fingerprint
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const fingerprint = generateFingerprint(ip, userAgent);

  // Find or create user by fingerprint
  let user = await User.findOne({ deviceFingerprint: fingerprint, ipHash: ip });
  if (user) {
    user.network = network;
    if (phone) user.phone = phone; // update phone if provided
    await user.save();
  } else {
    user = await User.create({
      network,
      phone: phone || null, // can be null
      deviceFingerprint: fingerprint,
      ipHash: ip,
      referralCode: Math.random().toString(36).substring(2, 10),
    });
  }

  // Generate JWT
  const token = signToken(user._id.toString());

  const response = NextResponse.json({ success: true });
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });

  return response;
}