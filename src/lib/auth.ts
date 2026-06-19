import { NextRequest, NextResponse } from 'next/server';
import { shopify } from './shopify';
import { getShopSession } from './session';

export async function verifyRequest(req: NextRequest): Promise<{
  shop: string;
  accessToken: string;
} | null> {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop') ||
    req.headers.get('x-shopify-shop-domain') || '';

  if (!shop) return null;

  const session = await getShopSession(shop);
  if (!session || !session.accessToken) return null;

  return { shop: session.shop, accessToken: session.accessToken };
}
