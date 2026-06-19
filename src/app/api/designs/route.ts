import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  const customerId = url.searchParams.get('customerId');
  const shareToken = url.searchParams.get('token');

  if (shareToken) {
    const design = await prisma.design.findUnique({ where: { shareToken } });
    return NextResponse.json({ design });
  }

  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

  const designs = await prisma.design.findMany({
    where: { shop, ...(customerId ? { customerId } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({ designs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { shop, customerId, name, designData, previewUrl } = body;
  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

  const design = await prisma.design.create({
    data: { shop, customerId, name: name || 'My Design', designData: JSON.stringify(designData), previewUrl },
  });

  return NextResponse.json({ design, shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/${design.shareToken}` });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, name, designData, previewUrl } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const design = await prisma.design.update({
    where: { id },
    data: { name, designData: JSON.stringify(designData), previewUrl },
  });

  return NextResponse.json({ design });
}
