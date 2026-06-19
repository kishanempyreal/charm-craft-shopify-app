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
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({ designs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { shop, customerId, name, designData } = body;
  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

  const raw = typeof designData === 'string' ? designData : JSON.stringify(designData || {});

  const { canvasData } = body;
  const design = await prisma.design.create({
    data: { shop, customerId, name: name || 'My Design', designData: raw, ...(canvasData ? { canvasData } : {}) },
  });

  const imageUrl = `${process.env.HOST || 'https://charmcraft-seven.vercel.app'}/api/designs/${design.shareToken}/image`;
  return NextResponse.json({ design, shareToken: design.shareToken, imageUrl });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, name, designData } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const raw = typeof designData === 'string' ? designData : JSON.stringify(designData || {});
  const design = await prisma.design.update({
    where: { id },
    data: { name, designData: raw },
  });

  return NextResponse.json({ design });
}
