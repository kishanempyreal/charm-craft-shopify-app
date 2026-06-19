import { NextRequest, NextResponse } from 'next/server';

const CHARM_TAGS = ['cc-charm-core', 'cc-charm-premium', 'cc-charm-engravable', 'cc-charm-spacer'];
const BASE_TAGS = ['cc-base'];
const ALL_TAGS = [...CHARM_TAGS, ...BASE_TAGS];
const DEFAULT_SHOP = process.env.SHOPIFY_STORE || 'jewellery-app-3.myshopify.com';
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || '';

async function getProductsViaAdminRest(shop: string, token: string) {
  const res = await fetch(
    `https://${shop}/admin/api/2024-01/products.json?limit=250&status=active`,
    { headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' } }
  );
  const json = await res.json();
  return (json.products || []) as any[];
}

function formatAdminProduct(p: any, includeBase = false) {
  const tags: string[] = (p.tags || '').split(',').map((t: string) => t.trim());
  const searchTags = includeBase ? ALL_TAGS : CHARM_TAGS;
  if (!searchTags.some((t: string) => tags.includes(t))) return null;

  const type = ALL_TAGS.find((t: string) => tags.includes(t)) || 'cc-charm-core';
  const mainVariant = p.variants?.[0];
  return {
    id: String(p.id),
    shopifyId: `gid://shopify/Product/${p.id}`,
    title: p.title,
    type,
    category: type.replace('cc-charm-', '').replace('cc-base', 'base'),
    price: mainVariant?.price || '0',
    image: p.images?.[0]?.src || '',
    available: p.variants?.some((v: any) =>
      v.inventory_management === null || v.inventory_quantity > 0
    ),
    variants: (p.variants || []).map((v: any) => ({
      id: String(v.id),
      title: v.title,
      price: v.price,
      sku: v.sku || '',
    })),
  };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop') || DEFAULT_SHOP;
  const includeBase = url.searchParams.get('include_base') === 'true';

  try {
    // Use Admin token directly (no OAuth session needed)
    if (ADMIN_TOKEN) {
      const products = await getProductsViaAdminRest(shop, ADMIN_TOKEN);
      const charms = products
        .map((p: any) => formatAdminProduct(p, includeBase))
        .filter(Boolean);
      return NextResponse.json({ charms, total: charms.length, source: 'admin-direct' });
    }

    return NextResponse.json({ charms: [], total: 0, error: 'No admin token configured' });
  } catch (error) {
    console.error('Charms fetch error:', error);
    return NextResponse.json({ charms: [], total: 0, error: String(error) });
  }
}
