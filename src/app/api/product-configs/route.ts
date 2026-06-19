import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_SHOP = process.env.SHOPIFY_STORE || 'jewellery-app-3.myshopify.com';
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || '';

export async function GET(req: NextRequest) {
  const shop = new URL(req.url).searchParams.get('shop') || DEFAULT_SHOP;
  try {
    // Fetch Shopify products
    const res = await fetch(
      `https://${shop}/admin/api/2024-01/products.json?limit=250&fields=id,title,handle,images,variants,status&status=active`,
      { headers: { 'X-Shopify-Access-Token': ADMIN_TOKEN } }
    );
    const { products = [] } = await res.json();

    // Get existing configs from DB
    const configs = await prisma.productConfig.findMany({
      where: { shop },
      include: {
        charms: { include: { charm: true }, orderBy: { sortOrder: 'asc' } },
        variations: true,
      },
    });

    const configMap = new Map(configs.map(c => [c.shopifyProductId, c]));

    // Only show products that can be charm-configured (exclude standalone charm/spacer products)
    const eligible = products.filter((p: any) =>
      !['Charm', 'Spacer', 'charm', 'spacer'].includes(p.product_type || '')
    );

    const productList = eligible.map((p: any) => ({
      id: String(p.id),
      title: p.title,
      handle: p.handle,
      image: p.images?.[0]?.src || null,
      variants: (p.variants || []).map((v: any) => ({ id: String(v.id), title: v.title, price: v.price })),
      config: configMap.get(String(p.id)) || null,
    }));

    return NextResponse.json({ products: productList });
  } catch (e) {
    return NextResponse.json({ products: [], error: String(e) });
  }
}

export async function POST(req: NextRequest) {
  const shop = new URL(req.url).searchParams.get('shop') || DEFAULT_SHOP;
  try {
    const body = await req.json();
    // Upsert product config
    const config = await prisma.productConfig.upsert({
      where: { shop_shopifyProductId: { shop, shopifyProductId: body.shopifyProductId } },
      create: {
        shop,
        shopifyProductId: body.shopifyProductId,
        productTitle: body.productTitle,
        productHandle: body.productHandle,
        productImage: body.productImage || null,
        maxSlots: body.maxSlots || 5,
        active: true,
      },
      update: {
        productTitle: body.productTitle,
        productHandle: body.productHandle,
        productImage: body.productImage || null,
        maxSlots: body.maxSlots || 5,
        active: body.active !== false,
      },
    });

    // Update charm associations
    if (body.charmIds && Array.isArray(body.charmIds)) {
      await prisma.productCharm.deleteMany({ where: { productConfigId: config.id } });
      if (body.charmIds.length > 0) {
        await prisma.productCharm.createMany({
          data: body.charmIds.map((charmId: string, i: number) => ({
            productConfigId: config.id,
            charmId,
            sortOrder: i,
          })),
        });
      }
    }

    // Update variation configs
    if (body.variations && Array.isArray(body.variations)) {
      await prisma.variationConfig.deleteMany({ where: { productConfigId: config.id } });
      if (body.variations.length > 0) {
        await prisma.variationConfig.createMany({
          data: body.variations.map((v: any) => ({
            productConfigId: config.id,
            variantTitle: v.variantTitle,
            charmIds: JSON.stringify(v.charmIds || []),
            maxSlots: v.maxSlots || null,
          })),
        });
      }
    }

    const full = await prisma.productConfig.findUnique({
      where: { id: config.id },
      include: {
        charms: { include: { charm: true }, orderBy: { sortOrder: 'asc' } },
        variations: true,
      },
    });

    return NextResponse.json({ config: full });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
