import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const topic = req.headers.get('x-shopify-topic') || '';
  const shop = req.headers.get('x-shopify-shop-domain') || '';
  const body = await req.text();

  try {
    // Verify webhook signature
    const isValid = await shopify.webhooks.validate({
      rawBody: body,
      rawRequest: req,
    });
    if (!isValid) return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 });
  } catch {
    // During dev, allow unverified
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Verification failed' }, { status: 401 });
    }
  }

  const data = JSON.parse(body);

  switch (topic) {
    case 'app/uninstalled':
      // Clean up shop data
      await prisma.session.deleteMany({ where: { shop } });
      break;
    case 'orders/create':
      // Track new orders with charms
      console.log(`New order ${data.name} for shop ${shop}`);
      break;
    case 'products/update':
      console.log(`Product updated: ${data.title}`);
      break;
  }

  return NextResponse.json({ ok: true });
}
