import { NextRequest, NextResponse } from 'next/server';
import { getShopSession } from '@/lib/session';
import { shopify } from '@/lib/shopify';

const CHARM_TAGS = ['cc-charm-core', 'cc-charm-premium', 'cc-charm-engravable', 'cc-charm-spacer'];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');

  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

  const session = await getShopSession(shop);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const client = new shopify.clients.Rest({ session: session as any });
    const query = CHARM_TAGS.map(t => `tag:${t}`).join(' OR ');

    const response = await client.get({
      path: 'products',
      query: { limit: '250', fields: 'id,title,tags,images,variants,status', status: 'any' },
    });

    const products = (response.body as any).products || [];
    const charms = products
      .filter((p: any) => p.tags && CHARM_TAGS.some(t => p.tags.includes(t)))
      .map((p: any) => {
        const type = CHARM_TAGS.find(t => p.tags.includes(t)) || 'cc-charm-core';
        const mainVariant = p.variants?.[0];
        return {
          id: String(p.id),
          shopifyId: `gid://shopify/Product/${p.id}`,
          title: p.title,
          type,
          category: type.replace('cc-charm-', ''),
          price: mainVariant?.price || '0',
          image: p.images?.[0]?.src || '',
          available: p.variants?.some((v: any) => v.inventory_quantity > 0 || v.inventory_management === null),
          variants: (p.variants || []).map((v: any) => ({
            id: String(v.id),
            title: v.title,
            price: v.price,
            sku: v.sku || '',
            options: v.option1 ? [{ name: 'Option', value: v.option1 }] : [],
          })),
        };
      });

    return NextResponse.json({ charms, total: charms.length });
  } catch (error) {
    console.error('Charms fetch error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
