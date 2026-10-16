import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  const checks = results.checks as Record<string, unknown>;

  checks.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = { connected: true };
    checks.userCount = await prisma.user.count();
  } catch (error) {
    checks.postgres = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  return NextResponse.json(results);
}
