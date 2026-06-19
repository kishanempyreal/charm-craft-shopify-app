import { NextRequest, NextResponse } from 'next/server';

const STOREFRONT_TOKEN = process.env.STOREFRONT_TOKEN || '';
const SHOP = process.env.SHOPIFY_STORE || 'jewellery-app-3.myshopify.com';

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const res = await fetch(`https://${SHOP}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
