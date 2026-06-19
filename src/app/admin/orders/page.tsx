'use client';
import {
  Page, Layout, Card, Text, BlockStack, InlineStack, Badge,
  Button, DataTable, Spinner, EmptyState, Banner, TextField
} from '@shopify/polaris';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface CharmOrder {
  id: string;
  orderName: string;
  customer: string;
  date: string;
  status: string;
  financialStatus: string;
  total: string;
  items: Array<{
    title: string;
    quantity: number;
    price: string;
    charms: string[];
    engraving?: string;
  }>;
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || 'jewellery-app-3.myshopify.com';
  const [orders, setOrders] = useState<CharmOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`/api/orders?shop=${encodeURIComponent(shop)}`)
      .then(r => r.json())
      .then(data => { setOrders(data.orders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shop]);

  const statusBadge = (status: string) => {
    const tones: Record<string, 'success' | 'warning' | 'critical' | 'info'> = {
      fulfilled: 'success', unfulfilled: 'warning', cancelled: 'critical', pending: 'info',
    };
    return <Badge tone={tones[status] || 'info'}>{status}</Badge>;
  };

  const filtered = orders.filter(o =>
    o.orderName.toLowerCase().includes(search.toLowerCase()) ||
    o.customer.toLowerCase().includes(search.toLowerCase())
  );

  const rows = filtered.map(order => [
    <Button variant="plain" url={`https://${shop}/admin/orders/${order.id.split('/').pop()}`} external key={order.id}>
      {order.orderName}
    </Button>,
    order.customer,
    order.date,
    statusBadge(order.status),
    statusBadge(order.financialStatus),
    order.total,
    <BlockStack gap="100" key={order.id}>
      {order.items.map((item, i) => (
        <BlockStack gap="050" key={i}>
          <Text as="span" variant="bodySm" fontWeight="semibold">{item.title}</Text>
          {item.charms.length > 0 && (
            <Text as="span" variant="bodySm" tone="subdued">
              Charms: {item.charms.join(', ')}
            </Text>
          )}
          {item.engraving && (
            <Badge tone="magic">{`Engraving: "${item.engraving}"`}</Badge>
          )}
        </BlockStack>
      ))}
    </BlockStack>,
  ]);

  return (
    <Page
      title="Charm Orders"
      subtitle="Orders containing charm necklace products"
    >
      <Layout>
        <Layout.Section>
          <Banner tone="info" title="Engraving Orders">
            <p>Orders with engraved charms are highlighted. Remember to add the engraving text when fulfilling.</p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <TextField
                label=""
                placeholder="Search orders..."
                value={search}
                onChange={setSearch}
                autoComplete="off"
                clearButton
                onClearButtonClick={() => setSearch('')}
              />
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>
              ) : rows.length === 0 ? (
                <EmptyState heading="No orders yet" image="">
                  <p>Orders containing charm products will appear here.</p>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Order', 'Customer', 'Date', 'Fulfillment', 'Payment', 'Total', 'Charm Details']}
                  rows={rows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
