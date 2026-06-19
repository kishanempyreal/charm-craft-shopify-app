import { NextRequest, NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || '';
const SHOP = process.env.SHOPIFY_STORE || 'jewellery-app-3.myshopify.com';

const SAMPLE_CHARMS = [
  {
    title: 'Gold Heart Charm',
    body_html: '<p>Beautiful 18k gold-plated heart charm. Perfect for any necklace.</p>',
    vendor: 'Charm Craft',
    product_type: 'Charm',
    tags: ['cc-charm-core', 'heart', 'gold'],
    variants: [{ price: '299.00', sku: 'CC-HEART-GOLD', inventory_quantity: 100, inventory_management: 'shopify' }],
    images: [{ src: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', alt: 'Gold Heart Charm' }],
  },
  {
    title: 'Silver Star Charm',
    body_html: '<p>925 sterling silver star charm with intricate detailing.</p>',
    vendor: 'Charm Craft',
    product_type: 'Charm',
    tags: ['cc-charm-core', 'star', 'silver'],
    variants: [{ price: '249.00', sku: 'CC-STAR-SILVER', inventory_quantity: 100, inventory_management: 'shopify' }],
    images: [{ src: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', alt: 'Silver Star Charm' }],
  },
  {
    title: 'Rose Gold Moon Charm',
    body_html: '<p>Delicate rose gold crescent moon charm, beautifully crafted.</p>',
    vendor: 'Charm Craft',
    product_type: 'Charm',
    tags: ['cc-charm-premium', 'moon', 'rose-gold'],
    variants: [{ price: '499.00', sku: 'CC-MOON-ROSEGOLD', inventory_quantity: 50, inventory_management: 'shopify' }],
    images: [{ src: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400', alt: 'Rose Gold Moon Charm' }],
  },
  {
    title: 'Diamond Initial Charm (Engravable)',
    body_html: '<p>Premium crystal-set initial charm. Add your personal letter with engraving.</p>',
    vendor: 'Charm Craft',
    product_type: 'Charm',
    tags: ['cc-charm-engravable', 'initial', 'diamond', 'engravable'],
    variants: [{ price: '799.00', sku: 'CC-INITIAL-DIAMOND', inventory_quantity: 30, inventory_management: 'shopify' }],
    images: [{ src: 'https://images.unsplash.com/photo-1573408301185-9519f94815d8?w=400', alt: 'Diamond Initial Charm' }],
    options: [{ name: 'Letter', values: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'] }],
  },
  {
    title: 'Gold Butterfly Charm',
    body_html: '<p>Elegant butterfly charm in shiny gold finish.</p>',
    vendor: 'Charm Craft',
    product_type: 'Charm',
    tags: ['cc-charm-core', 'butterfly', 'gold'],
    variants: [{ price: '349.00', sku: 'CC-BUTTERFLY-GOLD', inventory_quantity: 80, inventory_management: 'shopify' }],
    images: [{ src: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400', alt: 'Gold Butterfly Charm' }],
  },
  {
    title: 'Evil Eye Charm',
    body_html: '<p>Traditional blue evil eye charm with gold accents. Brings good luck and protection.</p>',
    vendor: 'Charm Craft',
    product_type: 'Charm',
    tags: ['cc-charm-premium', 'evil-eye', 'blue', 'protection'],
    variants: [{ price: '599.00', sku: 'CC-EVILEYE-BLUE', inventory_quantity: 60, inventory_management: 'shopify' }],
    images: [{ src: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400', alt: 'Evil Eye Charm' }],
  },
  {
    title: 'Pearl Spacer Charm',
    body_html: '<p>Elegant freshwater pearl spacer to separate your charms beautifully.</p>',
    vendor: 'Charm Craft',
    product_type: 'Charm',
    tags: ['cc-charm-spacer', 'pearl', 'spacer'],
    variants: [{ price: '149.00', sku: 'CC-SPACER-PEARL', inventory_quantity: 200, inventory_management: 'shopify' }],
    images: [{ src: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400', alt: 'Pearl Spacer' }],
  },
  {
    title: 'Infinity Love Charm',
    body_html: '<p>Gold infinity symbol charm representing endless love.</p>',
    vendor: 'Charm Craft',
    product_type: 'Charm',
    tags: ['cc-charm-core', 'infinity', 'love', 'gold'],
    variants: [{ price: '399.00', sku: 'CC-INFINITY-GOLD', inventory_quantity: 70, inventory_management: 'shopify' }],
    images: [{ src: 'https://images.unsplash.com/photo-1561828995-aa79a2db86dd?w=400', alt: 'Infinity Charm' }],
  },
  {
    title: 'Gold Chain - Delicate (16 inch)',
    body_html: '<p>Delicate 18k gold-plated chain necklace, 16 inches. Perfect base for your charm creation.</p>',
    vendor: 'Charm Craft',
    product_type: 'Chain',
    tags: ['cc-base', 'chain', 'gold', 'delicate'],
    variants: [
      { title: '16 inch', price: '999.00', sku: 'CC-CHAIN-GOLD-16', inventory_quantity: 50, inventory_management: 'shopify' },
      { title: '18 inch', price: '1199.00', sku: 'CC-CHAIN-GOLD-18', inventory_quantity: 50, inventory_management: 'shopify' },
    ],
    images: [{ src: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', alt: 'Gold Chain' }],
  },
  {
    title: 'Silver Chain - Classic (18 inch)',
    body_html: '<p>Classic 925 sterling silver chain, 18 inches. A timeless base for your charm necklace.</p>',
    vendor: 'Charm Craft',
    product_type: 'Chain',
    tags: ['cc-base', 'chain', 'silver', 'classic'],
    variants: [
      { title: '16 inch', price: '799.00', sku: 'CC-CHAIN-SILVER-16', inventory_quantity: 50, inventory_management: 'shopify' },
      { title: '18 inch', price: '999.00', sku: 'CC-CHAIN-SILVER-18', inventory_quantity: 50, inventory_management: 'shopify' },
    ],
    images: [{ src: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', alt: 'Silver Chain' }],
  },
];

export async function POST(req: NextRequest) {
  if (!ADMIN_TOKEN) {
    return NextResponse.json({ error: 'SHOPIFY_ADMIN_TOKEN not set in env vars' }, { status: 400 });
  }

  const results: any[] = [];
  const errors: any[] = [];

  for (const charm of SAMPLE_CHARMS) {
    try {
      const res = await fetch(`https://${SHOP}/admin/api/2024-01/products.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ADMIN_TOKEN,
        },
        body: JSON.stringify({ product: { ...charm, status: 'active', published: true } }),
      });
      const data = await res.json();
      if (data.product) {
        results.push({ id: data.product.id, title: data.product.title, tags: data.product.tags });
      } else {
        errors.push({ title: charm.title, error: data.errors });
      }
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      errors.push({ title: charm.title, error: String(e) });
    }
  }

  return NextResponse.json({
    created: results.length,
    failed: errors.length,
    products: results,
    errors,
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed sample charm products',
    requires: 'SHOPIFY_ADMIN_TOKEN env var',
    products: SAMPLE_CHARMS.map(c => ({ title: c.title, tags: c.tags, price: c.variants[0].price })),
  });
}
