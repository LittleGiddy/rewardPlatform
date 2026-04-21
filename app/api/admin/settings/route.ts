import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Settings from '@/models/Settings';

interface Settings {
  winProbability: number;
  maxWinProbability: number;
  streakBonusEnabled: boolean;
  dailyAttemptsLimit: number;
  cooldownMinutes: number;
  shareRequired: number;
  claimsPerWinner: number;   // new field
}

// Helper to get settings from DB with defaults
async function getSettings(): Promise<Settings> {
  await dbConnect();
  
  const defaults: Settings = {
    winProbability: 0.002,
    maxWinProbability: 0.05,
    streakBonusEnabled: true,
    dailyAttemptsLimit: 5,
    cooldownMinutes: 10,
    shareRequired: 3,
    claimsPerWinner: 500,
  };

  // Retrieve each setting individually or store as one document
  let settingsDoc = await Settings.findOne({ key: 'platformSettings' });
  if (!settingsDoc) {
    // Create with defaults
    settingsDoc = await Settings.create({
      key: 'platformSettings',
      value: defaults,
    });
  }

  // Merge with defaults (in case new fields are added later)
  return { ...defaults, ...settingsDoc.value };
}

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const updates: Partial<Settings> = await req.json();

  let settingsDoc = await Settings.findOne({ key: 'platformSettings' });
  if (!settingsDoc) {
    settingsDoc = await Settings.create({
      key: 'platformSettings',
      value: {},
    });
  }

  // Merge updates
  settingsDoc.value = { ...settingsDoc.value, ...updates };
  settingsDoc.updatedAt = new Date();
  await settingsDoc.save();

  return NextResponse.json({ success: true });
}