import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Received username:', username);
    console.log('Received password length:', password?.length);
    
    // Get credentials - with fallback for testing
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    console.log('Expected username:', validUsername);
    console.log('Expected password length:', validPassword?.length);
    console.log('Environment vars set:', {
      ADMIN_USERNAME: !!process.env.ADMIN_USERNAME,
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD
    });
    
    // Simple comparison
    const isValid = username === validUsername && password === validPassword;
    console.log('Is valid:', isValid);
    
    if (isValid) {
      const response = NextResponse.json({ 
        success: true, 
        message: 'Login successful' 
      });
      
      response.cookies.set('admin_auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });
      
      console.log('Login successful, cookie set');
      return response;
    }
    
    console.log('Login failed: invalid credentials');
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