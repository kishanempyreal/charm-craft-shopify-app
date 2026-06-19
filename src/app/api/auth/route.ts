import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';
import { saveSessionToDB } from '@/lib/session';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  // Sanitize shop domain
  const sanitizedShop = shopify.utils.sanitizeShop(shop);
  if (!sanitizedShop) {
    return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
  }

  const { authRoute, cookie } = await shopify.auth.begin({
    shop: sanitizedShop,
    callbackPath: '/api/auth/callback',
    isOnline: false,
    rawRequest: req,
  });

  const response = NextResponse.redirect(authRoute);
  if (cookie) {
    const [name, value] = cookie.split('=');
    response.cookies.set(name, value, { httpOnly: true, sameSite: 'none', secure: true });
  }
  return response;
}
