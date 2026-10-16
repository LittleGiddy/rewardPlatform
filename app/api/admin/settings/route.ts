import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import type { Prisma } from '@prisma/client';

interface PlatformSettings {
  winProbability: number;
  maxWinProbability: number;
  streakBonusEnabled: boolean;
  dailyAttemptsLimit: number;
  cooldownMinutes: number;
  shareRequired: number;
  claimsPerWinner: number;
}

const defaults: PlatformSettings = {
  winProbability: 0.002,
  maxWinProbability: 0.05,
  streakBonusEnabled: true,
  dailyAttemptsLimit: 5,
  cooldownMinutes: 10,
  shareRequired: 3,
  claimsPerWinner: 500,
};

async function getSettings(): Promise<PlatformSettings> {
  let settingsDoc = await prisma.settings.findUnique({ where: { key: 'platformSettings' } });
  if (!settingsDoc) {
    settingsDoc = await prisma.settings.create({
      data: { key: 'platformSettings', value: defaults as unknown as Prisma.InputJsonValue },
    });
  }

  return { ...defaults, ...(settingsDoc.value as Record<string, unknown>) } as PlatformSettings;
}

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const updates: Partial<PlatformSettings> = await req.json();

  const existing = await prisma.settings.findUnique({ where: { key: 'platformSettings' } });
  const merged = { ...(existing?.value as Record<string, unknown> ?? {}), ...updates };

  await prisma.settings.upsert({
    where: { key: 'platformSettings' },
    update: { value: merged as Prisma.InputJsonValue },
    create: { key: 'platformSettings', value: merged as Prisma.InputJsonValue },
  });

  return NextResponse.json({ success: true });
}
