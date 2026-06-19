import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';
import { saveSessionToDB } from '@/lib/session';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  try {
    const { session } = await shopify.auth.callback({
      rawRequest: req,
    });

    // Save session to database
    await saveSessionToDB({
      id: session.id,
      shop: session.shop,
      state: session.state || '',
      isOnline: session.isOnline,
      scope: session.scope,
      expires: session.expires,
      accessToken: session.accessToken || '',
      userId: session.onlineAccessInfo?.associated_user.id
        ? BigInt(session.onlineAccessInfo.associated_user.id)
        : undefined,
    });

    // Create default app settings for this shop
    await prisma.appSettings.upsert({
      where: { shop: session.shop },
      update: {},
      create: { shop: session.shop },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    return NextResponse.redirect(
      `${appUrl}/admin?shop=${session.shop}&host=${url.searchParams.get('host') || ''}`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'OAuth failed', details: String(error) }, { status: 500 });
  }
}
