import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Voucher from '@/models/Voucher';
import Winner from '@/models/Winner';
import ShareLink from '@/models/ShareLink';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    
    console.log('[CLAIM] Step 1: Getting user ID:', userId);
    
    if (!userId) {
      console.log('[CLAIM] No user ID in headers');
      return NextResponse.json({ error: 'Unauthorized - No user ID' }, { status: 401 });
    }

    console.log('[CLAIM] Step 2: Finding user...');
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('[CLAIM] User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[CLAIM] Step 3: User found. Checking voucher...');
    console.log('[CLAIM] currentVoucherId:', user.currentVoucherId);
    console.log('[CLAIM] currentRevealedAmount:', user.currentRevealedAmount);

    if (!user.currentVoucherId) {
      console.log('[CLAIM] No pending voucher found');
      return NextResponse.json({ 
        error: 'No pending voucher found. Please scratch a card first.' 
      }, { status: 400 });
    }

    console.log('[CLAIM] Step 4: Finding voucher...');
    const voucher = await Voucher.findById(user.currentVoucherId);
    
    if (!voucher) {
      console.log('[CLAIM] Voucher not found, clearing from user');
      user.currentVoucherId = null;
      user.currentRevealedAmount = null;
      await user.save();
      return NextResponse.json({ 
        error: 'Voucher expired. Please scratch again.' 
      }, { status: 400 });
    }

    console.log('[CLAIM] Step 5: Voucher found:', {
      id: voucher._id,
      amount: voucher.amount,
      status: voucher.status
    });

    // Skip share verification in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[CLAIM] Development mode - skipping share verification');
    } else {
      console.log('[CLAIM] Step 6: Checking share verification...');
      const shareLink = await ShareLink.findOne({ userId });
      if (!shareLink || !shareLink.verifiedAt) {
        console.log('[CLAIM] Shares not verified');
        return NextResponse.json({ 
          error: 'Please share with 3 friends first' 
        }, { status: 400 });
      }
    }

    // Lottery (50% for testing)
    const isWinner = Math.random() < 0.5;
    console.log('[CLAIM] Step 7: Lottery result:', isWinner ? 'WINNER' : 'LOSER');

    if (isWinner) {
      voucher.status = 'available';
      voucher.winnerId = userId;
      await voucher.save();

      await Winner.create({
        userId,
        voucherId: voucher._id,
        prizeAmount: voucher.amount,
        network: user.network,
      });

      user.currentVoucherId = null;
      user.currentRevealedAmount = null;
      await user.save();

      console.log('[CLAIM] Winner! Amount:', voucher.amount);
      return NextResponse.json({ winner: true, amount: voucher.amount });
    } else {
      voucher.status = 'redeemed';
      await voucher.save();
      
      user.currentVoucherId = null;
      user.currentRevealedAmount = null;
      await user.save();

      console.log('[CLAIM] Loser');
      return NextResponse.json({ winner: false });
    }
  } catch (error) {
    console.error('[CLAIM] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown') 
    }, { status: 500 });
  }
}