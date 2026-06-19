import { NextRequest, NextResponse } from 'next/server';
import { getShopSession } from '@/lib/session';
import { getShopify } from '@/lib/shopify';

const CHARM_TAGS = ['cc-charm-core', 'cc-charm-premium', 'cc-charm-engravable', 'cc-charm-spacer'];
const STOREFRONT_TOKEN = process.env.STOREFRONT_TOKEN || '';
const DEFAULT_SHOP = process.env.SHOPIFY_STORE || 'jewellery-app-3.myshopify.com';

async function getCharmsViaStorefront(shop: string) {
  const query = `
    query {
      products(first: 250) {
        edges {
          node {
            id title tags
            images(first: 1) { edges { node { url } } }
            priceRange { minVariantPrice { amount } }
            variants(first: 10) {
              edges {
                node { id title price { amount } availableForSale }
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch(`https://${shop}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();
  const products = json.data?.products?.edges?.map((e: any) => e.node) || [];

  return products
    .filter((p: any) => p.tags && CHARM_TAGS.some((t: string) => p.tags.includes(t)))
    .map((p: any) => {
      const type = CHARM_TAGS.find((t: string) => p.tags.includes(t)) || 'cc-charm-core';
      const mainVariant = p.variants?.edges?.[0]?.node;
      return {
        id: p.id,
        shopifyId: p.id,
        title: p.title,
        type,
        category: type.replace('cc-charm-', ''),
        price: mainVariant?.price?.amount || '0',
        image: p.images?.edges?.[0]?.node?.url || '',
        available: p.variants?.edges?.some((e: any) => e.node.availableForSale),
        variants: p.variants?.edges?.map((e: any) => ({
          id: e.node.id,
          title: e.node.title,
          price: e.node.price?.amount || '0',
          sku: '',
          options: [],
        })) || [],
      };
    });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop') || DEFAULT_SHOP;

  try {
    // Try Admin API first
    let session = null;
    try {
      session = await getShopSession(shop);
    } catch {}

    if (session?.accessToken) {
      const shopify = getShopify();
      const client = new shopify.clients.Rest({ session: session as any });

      const response = await client.get({
        path: 'products',
        query: { limit: '250', fields: 'id,title,tags,images,variants,status', status: 'any' },
      });

      const products = (response.body as any).products || [];
      const charms = products
        .filter((p: any) => p.tags && CHARM_TAGS.some((t: string) => p.tags.includes(t)))
        .map((p: any) => {
          const type = CHARM_TAGS.find((t: string) => p.tags.includes(t)) || 'cc-charm-core';
          const mainVariant = p.variants?.[0];
          return {
            id: String(p.id),
            shopifyId: `gid://shopify/Product/${p.id}`,
            title: p.title,
            type,
            category: type.replace('cc-charm-', ''),
            price: mainVariant?.price || '0',
            image: p.images?.[0]?.src || '',
            available: p.variants?.some((v: any) => v.inventory_quantity > 0 || v.inventory_management === null),
            variants: (p.variants || []).map((v: any) => ({
              id: String(v.id),
              title: v.title,
              price: v.price,
              sku: v.sku || '',
              options: [],
            })),
          };
        });
      return NextResponse.json({ charms, total: charms.length, source: 'admin' });
    }

    // Fallback: use Storefront API
    const charms = await getCharmsViaStorefront(shop);
    return NextResponse.json({ charms, total: charms.length, source: 'storefront' });

  } catch (error) {
    console.error('Charms fetch error:', error);
    // Return empty rather than error
    return NextResponse.json({ charms: [], total: 0, error: String(error) });
  }
}
