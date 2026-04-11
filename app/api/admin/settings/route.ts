import { NextRequest, NextResponse } from 'next/server';

interface Settings {
  winProbability: number;
  maxWinProbability: number;
  streakBonusEnabled: boolean;
  dailyAttemptsLimit: number;
  cooldownMinutes: number;
  shareRequired: number;
}

// In production, store settings in database
let settings: Settings = {
  winProbability: 0.002,
  maxWinProbability: 0.05,
  streakBonusEnabled: true,
  dailyAttemptsLimit: 5,
  cooldownMinutes: 10,
  shareRequired: 3
};

export async function GET() {
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const newSettings: Partial<Settings> = await req.json();
  settings = { ...settings, ...newSettings };
  return NextResponse.json({ success: true });
}