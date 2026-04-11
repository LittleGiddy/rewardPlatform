import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  };
  
  // 1. Check environment variables
  results.checks.env = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    JWT_SECRET: !!process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };
  
  // 2. Test MongoDB connection
  try {
    await dbConnect();
    results.checks.mongodb = {
      connected: true,
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.name || 'unknown'
    };
  } catch (error) {
    results.checks.mongodb = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  // 3. Check User model
  try {
    const User = (await import('@/models/User')).default;
    results.checks.userModel = { exists: true };
  } catch (error) {
    results.checks.userModel = { exists: false, error: String(error) };
  }
  
  return NextResponse.json(results);
}