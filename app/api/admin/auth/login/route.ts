import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    console.log('Login attempt:', { username, passwordProvided: !!password });
    
    // Get credentials from environment variables
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    console.log('Expected:', { validUsername, validPasswordProvided: !!validPassword });
    
    if (username === validUsername && password === validPassword) {
      const response = NextResponse.json({ success: true });
      
      response.cookies.set('admin_auth', 'true', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });
      
      console.log('Login successful');
      return response;
    }
    
    console.log('Login failed - invalid credentials');
    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}