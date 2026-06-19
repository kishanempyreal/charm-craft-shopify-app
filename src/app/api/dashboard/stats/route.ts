import { NextRequest, NextResponse } from 'next/server';
import { getShopSession } from '@/lib/session';
import { shopify } from '@/lib/shopify';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

  const session = await getShopSession(shop);
  if (!session) {
    return NextResponse.json({ totalCharms: 0, totalDesigns: 0, totalOrders: 0, revenue: '₹0' });
  }

  try {
    const client = new shopify.clients.Rest({ session: session as any });

    const [productsRes, ordersRes, designsCount] = await Promise.all([
      client.get({ path: 'products/count', query: { status: 'active' } }),
      client.get({ path: 'orders/count', query: { status: 'any' } }),
      prisma.design.count({ where: { shop } }),
    ]);

    // Get revenue from orders
    const revenueRes = await client.get({
      path: 'orders',
      query: { limit: '50', status: 'any', fields: 'total_price' },
    });
    const orders = (revenueRes.body as any).orders || [];
    const revenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);

    return NextResponse.json({
      totalCharms: (productsRes.body as any).count || 0,
      totalDesigns: designsCount,
      totalOrders: (ordersRes.body as any).count || 0,
      revenue: `₹${Math.round(revenue).toLocaleString('en-IN')}`,
    });
  } catch {
    return NextResponse.json({ totalCharms: 0, totalDesigns: 0, totalOrders: 0, revenue: '₹0' });
  }
}
