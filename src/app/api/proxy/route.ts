import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_SHOP = process.env.SHOPIFY_STORE || 'jewellery-app-3.myshopify.com';

// This endpoint is called by the Shopify storefront via App Proxy
// URL: /apps/charmcraft/charm-config?product=PRODUCT_HANDLE&shop=SHOP
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const productHandle = url.searchParams.get('product') || '';
  const shop = url.searchParams.get('shop') || DEFAULT_SHOP;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };

  if (!productHandle) {
    return NextResponse.json({ configured: false, error: 'product param required' }, { headers });
  }

  try {
    const config = await prisma.productConfig.findFirst({
      where: { shop, productHandle, active: true },
      include: {
        charms: {
          where: { charm: { active: true } },
          include: { charm: true },
          orderBy: { sortOrder: 'asc' },
        },
        variations: true,
      },
    });

    if (!config) {
      return NextResponse.json({ configured: false }, { headers });
    }

    return NextResponse.json({
      configured: true,
      maxSlots: config.maxSlots,
      slotPositions: config.slotPositions || [],
      productImage: config.productImage,
      charms: config.charms.map(pc => ({
        id: pc.charm.id,
        name: pc.charm.name,
        image: pc.charm.image,
        price: pc.charm.price,
        category: pc.charm.category,
        engravable: pc.charm.engravable,
      })),
      variations: config.variations.map(v => ({
        variantTitle: v.variantTitle,
        charmIds: JSON.parse(v.charmIds || '[]'),
        maxSlots: v.maxSlots,
      })),
    }, { headers });
  } catch (e) {
    return NextResponse.json({ configured: false, error: String(e) }, { headers, status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
