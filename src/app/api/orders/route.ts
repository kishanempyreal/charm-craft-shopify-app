import { NextRequest, NextResponse } from 'next/server';
import { getShopSession } from '@/lib/session';
import { shopify } from '@/lib/shopify';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

  const session = await getShopSession(shop);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const client = new shopify.clients.Rest({ session: session as any });
    const response = await client.get({
      path: 'orders',
      query: { limit: '50', status: 'any', fields: 'id,name,created_at,fulfillment_status,financial_status,total_price,customer,line_items' },
    });

    const raw = (response.body as any).orders || [];

    const orders = raw
      .filter((o: any) => {
        // Only orders that have charm-related line item properties
        return o.line_items?.some((li: any) =>
          li.properties?.some((p: any) => p.name === '_charms' || p.name === 'Charms')
        );
      })
      .map((o: any) => ({
        id: `gid://shopify/Order/${o.id}`,
        orderName: o.name,
        customer: o.customer
          ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim()
          : 'Guest',
        date: new Date(o.created_at).toLocaleDateString('en-IN'),
        status: o.fulfillment_status || 'unfulfilled',
        financialStatus: o.financial_status || 'pending',
        total: `₹${parseFloat(o.total_price).toFixed(0)}`,
        items: o.line_items.map((li: any) => {
          const charmsProperty = li.properties?.find((p: any) => p.name === '_charms' || p.name === 'Charms');
          const engravingProperty = li.properties?.find((p: any) => p.name === '_engraving' || p.name === 'Engraving');
          let charms: string[] = [];
          try {
            charms = charmsProperty?.value ? JSON.parse(charmsProperty.value) : [];
            if (!Array.isArray(charms)) charms = [String(charms)];
          } catch {
            charms = charmsProperty?.value ? [charmsProperty.value] : [];
          }
          return {
            title: li.title,
            quantity: li.quantity,
            price: `₹${parseFloat(li.price).toFixed(0)}`,
            charms,
            engraving: engravingProperty?.value,
          };
        }),
      }));

    return NextResponse.json({ orders, total: orders.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
