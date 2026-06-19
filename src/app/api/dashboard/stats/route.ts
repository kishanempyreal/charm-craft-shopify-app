import { NextRequest, NextResponse } from 'next/server';
import { getShopSession } from '@/lib/session';
import { getShopify } from '@/lib/shopify';

const DEFAULT_SHOP = process.env.SHOPIFY_STORE || 'jewellery-app-3.myshopify.com';
const STOREFRONT_TOKEN = process.env.STOREFRONT_TOKEN || '';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop') || DEFAULT_SHOP;

  try {
    let session = null;
    try {
      session = await getShopSession(shop);
    } catch {}

    if (session?.accessToken) {
      const shopify = getShopify();
      const client = new shopify.clients.Rest({ session: session as any });

      const [productsRes, ordersRes] = await Promise.all([
        client.get({ path: 'products/count', query: { status: 'active' } }),
        client.get({ path: 'orders/count', query: { status: 'any' } }),
      ]);

      return NextResponse.json({
        totalCharms: (productsRes.body as any).count || 0,
        totalDesigns: 0,
        totalOrders: (ordersRes.body as any).count || 0,
        revenue: '₹0',
      });
    }

    // Fallback via Storefront
    const res = await fetch(`https://${shop}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: `{ products(first: 250) { edges { node { tags } } } }` }),
    });
    const json = await res.json();
    const products = json.data?.products?.edges || [];
    const charmCount = products.filter((e: any) =>
      e.node.tags?.some((t: string) => t.startsWith('cc-charm'))
    ).length;

    return NextResponse.json({
      totalCharms: charmCount,
      totalDesigns: 0,
      totalOrders: 0,
      revenue: '₹0',
    });
  } catch {
    return NextResponse.json({ totalCharms: 0, totalDesigns: 0, totalOrders: 0, revenue: '₹0' });
  }
}
