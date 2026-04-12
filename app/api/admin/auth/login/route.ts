import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    // NO FALLBACKS - must be set in environment
    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;
    
    // If environment variables are missing, reject all logins
    if (!validUsername || !validPassword) {
      console.error('Admin credentials not configured in environment');
      return NextResponse.json(
        { error: 'System configuration error' },
        { status: 500 }
      );
    }
    
    if (username === validUsername && password === validPassword) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('admin_auth', 'true', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 2, // 2 hours only
      });
      return response;
    }
    
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}