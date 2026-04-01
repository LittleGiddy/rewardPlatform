import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    await dbConnect();
    
    return NextResponse.json({
      status: 'ok',
      mongodb: 'connected',
      readyState: mongoose.connection.readyState
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      mongodb: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}