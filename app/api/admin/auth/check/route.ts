import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authCookie = request.cookies.get('admin_auth');
  const isAuthenticated = authCookie?.value === 'true';
  
  console.log('=== CHECK AUTH ===');
  console.log('Cookie exists:', !!authCookie);
  console.log('Cookie value:', authCookie?.value);
  console.log('Is authenticated:', isAuthenticated);
  
  return NextResponse.json({ authenticated: isAuthenticated });
}