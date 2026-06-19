import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_SHOP = process.env.SHOPIFY_STORE || 'jewellery-app-3.myshopify.com';

export async function GET(req: NextRequest) {
  const shop = new URL(req.url).searchParams.get('shop') || DEFAULT_SHOP;
  try {
    const charms = await prisma.charm.findMany({
      where: { shop, active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ charms });
  } catch (e) {
    return NextResponse.json({ charms: [], error: String(e) });
  }
}

export async function POST(req: NextRequest) {
  const shop = new URL(req.url).searchParams.get('shop') || DEFAULT_SHOP;
  try {
    const body = await req.json();
    const charm = await prisma.charm.create({
      data: {
        shop,
        name: body.name,
        description: body.description || null,
        image: body.image || null,
        price: parseFloat(body.price) || 0,
        category: body.category || 'core',
        engravable: body.category === 'engravable',
        active: true,
        sortOrder: body.sortOrder || 0,
      },
    });
    return NextResponse.json({ charm });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
