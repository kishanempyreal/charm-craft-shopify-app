import { NextRequest, NextResponse } from 'next/server';

// Install redirect — handles ?shop= parameter from Shopify
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  // Redirect to OAuth flow
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://${req.headers.get('host')}`;
  return NextResponse.redirect(`${appUrl}/api/auth?shop=${shop}`);
}
