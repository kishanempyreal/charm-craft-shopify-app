import { NextResponse } from 'next/server';

export async function GET() {
  const status = {
    app: 'Charm Craft',
    version: '1.0.0',
    env: {
      shopify_api_key: !!process.env.SHOPIFY_API_KEY,
      shopify_api_secret: !!process.env.SHOPIFY_API_SECRET,
      shopify_admin_token: !!process.env.SHOPIFY_ADMIN_TOKEN,
      database_url: !!process.env.DATABASE_URL,
      host: process.env.HOST || 'not set',
      shop: process.env.SHOPIFY_STORE || 'not set',
      storefront_token: !!process.env.STOREFRONT_TOKEN,
    },
    ready: !!(process.env.SHOPIFY_API_KEY && process.env.DATABASE_URL && process.env.HOST),
  };
  return NextResponse.json(status);
}
