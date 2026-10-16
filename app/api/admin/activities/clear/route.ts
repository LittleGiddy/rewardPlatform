import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const olderThanDays = searchParams.get('olderThanDays');

  try {
    if (olderThanDays) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(olderThanDays));

      const eventsResult = await prisma.scratchEvent.deleteMany({ where: { timestamp: { lt: date } } });
      const winnersResult = await prisma.winner.deleteMany({ where: { wonAt: { lt: date } } });
      const deletedCount = eventsResult.count + winnersResult.count;

      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedCount} activities older than ${olderThanDays} days`,
        deletedCount,
      });
    } else {
      const eventsResult = await prisma.scratchEvent.deleteMany({});
      const winnersResult = await prisma.winner.deleteMany({});
      const deletedCount = eventsResult.count + winnersResult.count;

      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedCount} activities (${eventsResult.count} scratches, ${winnersResult.count} winners)`,
        deletedCount,
      });
    }
  } catch (error) {
    console.error('[Clear Activities] Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to clear activities',
      error: String(error),
    }, { status: 500 });
  }
}
