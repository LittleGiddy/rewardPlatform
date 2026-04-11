import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    await dbConnect();
    
    const state = mongoose.connection.readyState;
    
    // Simple string mapping
    let stateText = 'unknown';
    if (state === 0) stateText = 'disconnected';
    if (state === 1) stateText = 'connected';
    if (state === 2) stateText = 'connecting';
    if (state === 3) stateText = 'disconnecting';
    
    return NextResponse.json({
      success: true,
      connectionState: stateText,
      readyState: state,
      databaseName: mongoose.connection.name || 'not connected'
    });
  } catch (error) {
    console.error('MongoDB test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}