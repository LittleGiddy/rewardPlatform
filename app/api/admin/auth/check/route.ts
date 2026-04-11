import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authCookie = request.cookies.get('admin_auth');
  return NextResponse.json({ authenticated: authCookie?.value === 'true' });
}