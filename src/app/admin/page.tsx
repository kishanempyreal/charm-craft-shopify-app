'use client';
import {
  Page, Layout, Card, Text, BlockStack, InlineGrid, Badge,
  Button, Icon, Banner, DataTable, EmptyState
} from '@shopify/polaris';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface DashboardStats {
  totalCharms: number;
  totalDesigns: number;
  totalOrders: number;
  revenue: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || 'jewellery-app-3.myshopify.com';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/stats?shop=${encodeURIComponent(shop)}`)
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => {
        setStats({ totalCharms: 0, totalDesigns: 0, totalOrders: 0, revenue: '₹0' });
        setLoading(false);
      });
  }, [shop]);

  return (
    <Page title="Charm Craft Dashboard" subtitle={`Store: ${shop}`}>
      <Layout>
        <Layout.Section>
          <Banner
            title="Welcome to Charm Craft!"
            tone="info"
            action={{ content: 'Open Configurator', url: `https://${shop}/pages/build-your-necklace`, external: true }}
          >
            <p>Manage your charms, products, and customer orders from here.</p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <InlineGrid columns={4} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Total Charms</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  {loading ? '...' : stats?.totalCharms ?? 0}
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">Charm products in catalog</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Saved Designs</Text>
                <Text variant="heading2xl" as="p">
                  {loading ? '...' : stats?.totalDesigns ?? 0}
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">Customer saved designs</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Total Orders</Text>
                <Text variant="heading2xl" as="p">
                  {loading ? '...' : stats?.totalOrders ?? 0}
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">Orders with charms</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Revenue</Text>
                <Text variant="heading2xl" as="p">
                  {loading ? '...' : stats?.revenue ?? '₹0'}
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">From charm orders</Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <InlineGrid columns={2} gap="400">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Quick Actions</Text>
                <BlockStack gap="200">
                  <Button url={`/admin/charms?shop=${shop}`} fullWidth>
                    Manage Charms
                  </Button>
                  <Button url={`/admin/products?shop=${shop}`} fullWidth>
                    Manage Products
                  </Button>
                  <Button url={`/admin/orders?shop=${shop}`} fullWidth>
                    View Orders
                  </Button>
                  <Button url={`/admin/settings?shop=${shop}`} fullWidth>
                    App Settings
                  </Button>
                </BlockStack>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Setup Checklist</Text>
                <BlockStack gap="200">
                  <Text as="p">✅ App installed</Text>
                  <Text as="p">✅ Products synced</Text>
                  <Text as="p">⚙️ Configure charm slots</Text>
                  <Text as="p">⚙️ Set up pricing</Text>
                  <Text as="p">⚙️ Add real product images</Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
