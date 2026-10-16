import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const events = await prisma.scratchEvent.findMany({
    orderBy: { timestamp: 'desc' },
    take: 500,
    include: { user: { select: { id: true, network: true } } },
  });

  const result = events.map((event) => {
    const { user, ...rest } = event;
    return {
      ...rest,
      _id: event.id,
      userId: user ? { _id: user.id, network: user.network } : null,
    };
  });

  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    await prisma.scratchEvent.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Event deleted' });
  }

  return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
}
