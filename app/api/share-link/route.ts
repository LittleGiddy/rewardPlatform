import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let shareLink = await prisma.shareLink.findUnique({
    where: { userId },
    include: { _count: { select: { clicks: true } } },
  });

  if (!shareLink) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    shareLink = await prisma.shareLink.create({
      data: { userId, code: user.referralCode },
      include: { _count: { select: { clicks: true } } },
    });
  }

  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/ref/${shareLink.code}`;
  return NextResponse.json({ link, clickCount: shareLink._count.clicks });
}
