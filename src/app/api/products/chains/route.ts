import { NextRequest, NextResponse } from 'next/server';
import { getShopSession } from '@/lib/session';
import { shopify } from '@/lib/shopify';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');

  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

  const session = await getShopSession(shop);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const client = new shopify.clients.Rest({ session: session as any });
    const response = await client.get({
      path: 'products',
      query: { limit: '50', fields: 'id,title,tags,images,variants', status: 'active' },
    });

    const products = (response.body as any).products || [];
    const baseProducts = products.filter((p: any) => p.tags?.includes('cc-base'));

    // Get slot configs from DB
    const slotConfigs = await prisma.chainSlotConfig.findMany({ where: { shop } });
    const slotMap = new Map(slotConfigs.map(s => [s.chainId, s]));

    const chains = baseProducts.map((p: any) => {
      const shopifyId = `gid://shopify/Product/${p.id}`;
      const slotConfig = slotMap.get(shopifyId);
      const slots = slotConfig?.slots ? JSON.parse(slotConfig.slots) : [];
      return {
        id: String(p.id),
        shopifyId,
        title: p.title,
        image: p.images?.[0]?.src || '',
        hasSlots: slots.length > 0,
        slotCount: slots.length || 8,
        variants: (p.variants || []).map((v: any) => ({
          id: String(v.id),
          title: v.title,
          price: v.price,
          sku: v.sku || '',
          options: [
            ...(v.option1 ? [{ name: 'Option 1', value: v.option1 }] : []),
            ...(v.option2 ? [{ name: 'Option 2', value: v.option2 }] : []),
          ],
        })),
      };
    });

    return NextResponse.json({ chains });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
