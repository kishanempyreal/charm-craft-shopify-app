import { NextRequest, NextResponse } from 'next/server';
import { getShopSession } from '@/lib/session';
import { shopify } from '@/lib/shopify';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

  const session = await getShopSession(shop);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const client = new shopify.clients.Rest({ session: session as any });

    // Fetch all products
    const response = await client.get({
      path: 'products',
      query: { limit: '250', status: 'active' },
    });

    const products = (response.body as any).products || [];
    const charmProducts = products.filter((p: any) =>
      p.tags && (p.tags.includes('cc-charm') || p.tags.includes('cc-base'))
    );

    return NextResponse.json({
      success: true,
      synced: charmProducts.length,
      total: products.length
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
