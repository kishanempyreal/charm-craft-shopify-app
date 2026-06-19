import { NextRequest, NextResponse } from 'next/server';
import { getShopSession } from '@/lib/session';
import { prisma } from '@/lib/db';

// App Proxy endpoint — called by the Shopify storefront via /apps/charmcraft
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  const action = url.searchParams.get('action');

  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

  if (action === 'settings') {
    const settings = await prisma.appSettings.findUnique({ where: { shop } });
    return NextResponse.json({ settings });
  }

  if (action === 'slots') {
    const chainId = url.searchParams.get('chainId');
    if (chainId) {
      const config = await prisma.chainSlotConfig.findFirst({ where: { shop, chainId } });
      const slots = config?.slots ? JSON.parse(config.slots) : [];
      return NextResponse.json({ slots });
    }
    const configs = await prisma.chainSlotConfig.findMany({ where: { shop } });
    return NextResponse.json({ configs });
  }

  if (action === 'designs') {
    const customerId = url.searchParams.get('customerId');
    const designs = await prisma.design.findMany({
      where: { shop, ...(customerId ? { customerId } : {}) },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: { id: true, name: true, shareToken: true, previewUrl: true, updatedAt: true },
    });
    return NextResponse.json({ designs });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { shop, action, ...data } = body;

  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

  if (action === 'save_design') {
    const design = await prisma.design.create({
      data: {
        shop,
        customerId: data.customerId,
        name: data.name || 'My Design',
        designData: JSON.stringify(data.designData),
        previewUrl: data.previewUrl,
      },
    });
    return NextResponse.json({
      design,
      shareUrl: `https://${shop}/apps/charmcraft?action=share&token=${design.shareToken}`
    });
  }

  return NextResponse.json({ ok: true });
}
