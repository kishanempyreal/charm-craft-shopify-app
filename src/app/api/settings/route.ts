import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

  const settings = await prisma.appSettings.findUnique({ where: { shop } });
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { shop, configuratorTitle, maxCharms, enablingEngraving, currencyCode, customCss } = body;
  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

  const settings = await prisma.appSettings.upsert({
    where: { shop },
    update: { configuratorTitle, maxCharms, enablingEngraving, currencyCode, customCss },
    create: { shop, configuratorTitle, maxCharms, enablingEngraving, currencyCode, customCss },
  });

  return NextResponse.json({ settings });
}
