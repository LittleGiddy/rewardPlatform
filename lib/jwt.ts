import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(userId: string) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  console.log('Signing token for user:', userId, 'token length:', token.length);
  return token;
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Verifying token, decoded:', decoded);
    return decoded as { userId: string };
  } catch (err) {
    console.log('Token verification error:', err);
    return null;
  }
}