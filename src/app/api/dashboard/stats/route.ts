import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_SHOP = process.env.SHOPIFY_STORE || 'jewellery-app-3.myshopify.com';
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || '';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop') || DEFAULT_SHOP;

  try {
    if (ADMIN_TOKEN) {
      const [productsRes, ordersRes] = await Promise.all([
        fetch(`https://${shop}/admin/api/2024-01/products/count.json?status=active`, {
          headers: { 'X-Shopify-Access-Token': ADMIN_TOKEN },
        }),
        fetch(`https://${shop}/admin/api/2024-01/orders/count.json?status=any`, {
          headers: { 'X-Shopify-Access-Token': ADMIN_TOKEN },
        }),
      ]);

      const [prodData, orderData] = await Promise.all([
        productsRes.json(),
        ordersRes.json(),
      ]);

      return NextResponse.json({
        totalCharms: prodData.count || 0,
        totalDesigns: 0,
        totalOrders: orderData.count || 0,
        revenue: '₹0',
      });
    }

    return NextResponse.json({ totalCharms: 0, totalDesigns: 0, totalOrders: 0, revenue: '₹0' });
  } catch {
    return NextResponse.json({ totalCharms: 0, totalDesigns: 0, totalOrders: 0, revenue: '₹0' });
  }
}
