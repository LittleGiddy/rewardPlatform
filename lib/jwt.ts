import { SignJWT, jwtVerify } from 'jose';

// Get secret with fallback for development
const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not defined in production environment');
    }
    // Development fallback - only use if you're testing locally
    console.warn('⚠️ JWT_SECRET not set, using development fallback. Set this in production!');
    return new TextEncoder().encode('development-secret-key-do-not-use-in-production');
  }
  
  return new TextEncoder().encode(secret);
};

export async function signToken(userId: string) {
  try {
    const secret = getSecret();
    const token = await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);
    return token;
  } catch (error) {
    console.error('SignToken error:', error);
    throw new Error('Failed to generate authentication token');
  }
}

export async function verifyToken(token: string) {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string };
  } catch (err) {
    console.log('Token verification error:', err);
    return null;
  }
}