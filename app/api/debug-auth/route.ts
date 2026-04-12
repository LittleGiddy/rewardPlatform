import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  
  if (!token) {
    return NextResponse.json({ 
      hasToken: false, 
      message: 'No token found in cookies' 
    });
  }
  
  const payload = await verifyToken(token);
  
  return NextResponse.json({ 
    hasToken: true,
    isValid: !!payload,
    userId: payload?.userId,
    tokenPreview: token.substring(0, 20) + '...'
  });
}