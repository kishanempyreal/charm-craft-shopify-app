'use client';
import {
  Page, Layout, Card, Text, BlockStack, InlineStack, Badge,
  Button, DataTable, Thumbnail, EmptyState, Filters, ChoiceList,
  Modal, TextField, Select, Spinner, InlineGrid, Banner
} from '@shopify/polaris';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';

interface Charm {
  id: string;
  shopifyId: string;
  title: string;
  price: string;
  image: string;
  type: string;
  category: string;
  available: boolean;
  variants: Array<{ id: string; title: string; price: string }>;
}

type SortableColumn = 'title' | 'price' | 'type';

function CharmsContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || 'jewellery-app-3.myshopify.com';
  const [charms, setCharms] = useState<Charm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortableColumn>('title');
  const [sortDir, setSortDir] = useState<'ascending' | 'descending'>('ascending');
  const [syncing, setSyncing] = useState(false);

  const fetchCharms = useCallback(() => {
    setLoading(true);
    fetch(`/api/charms?shop=${encodeURIComponent(shop)}`)
      .then(r => r.json())
      .then(data => { setCharms(data.charms || []); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [shop]);

  useEffect(() => { fetchCharms(); }, [fetchCharms]);

  const syncProducts = async () => {
    setSyncing(true);
    await fetch(`/api/products/sync?shop=${encodeURIComponent(shop)}`, { method: 'POST' });
    setSyncing(false);
    fetchCharms();
  };

  const filtered = charms
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    .filter(c => typeFilter.length === 0 || typeFilter.includes(c.type))
    .sort((a, b) => {
      const dir = sortDir === 'ascending' ? 1 : -1;
      if (sortColumn === 'price') return (parseFloat(a.price) - parseFloat(b.price)) * dir;
      return a[sortColumn].localeCompare(b[sortColumn]) * dir;
    });

  const rows = filtered.map(charm => [
    <InlineStack gap="200" key={charm.id} blockAlign="center">
      <Thumbnail source={charm.image || ''} alt={charm.title} size="small" />
      <Text as="span" variant="bodyMd">{charm.title}</Text>
    </InlineStack>,
    <Badge tone={charm.type === 'cc-charm-premium' ? 'warning' : charm.type === 'cc-charm-engravable' ? 'magic' : 'info'} key={charm.id}>
      {charm.type.replace('cc-charm-', '')}
    </Badge>,
    `₹${parseFloat(charm.price).toFixed(0)}`,
    charm.variants.length,
    <Badge tone={charm.available ? 'success' : 'critical'} key={charm.id}>
      {charm.available ? 'Available' : 'Out of Stock'}
    </Badge>,
    <Button
      size="slim"
      url={`https://${shop}/admin/products/${charm.shopifyId.split('/').pop()}`}
      external
      key={charm.id}
    >
      Edit in Shopify
    </Button>,
  ]);

  return (
    <Page
      title="Charm Catalog"
      subtitle={`${charms.length} charms in your store`}
      primaryAction={{
        content: syncing ? 'Syncing...' : 'Sync from Shopify',
        onAction: syncProducts,
        loading: syncing,
      }}
      secondaryActions={[
        {
          content: 'Add New Charm',
          url: `https://${shop}/admin/products/new`,
          external: true,
        },
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" title="Error loading charms">
              <p>{error}. Make sure the app is properly connected.</p>
            </Banner>
          </Layout.Section>
        )}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <TextField
                  label=""
                  placeholder="Search charms..."
                  value={search}
                  onChange={setSearch}
                  autoComplete="off"
                  clearButton
                  onClearButtonClick={() => setSearch('')}
                />
                <Select
                  label=""
                  options={[
                    { label: 'All Types', value: '' },
                    { label: 'Core Charms', value: 'cc-charm-core' },
                    { label: 'Premium Charms', value: 'cc-charm-premium' },
                    { label: 'Engravable', value: 'cc-charm-engravable' },
                    { label: 'Spacer Beads', value: 'cc-charm-spacer' },
                  ]}
                  value={typeFilter[0] || ''}
                  onChange={v => setTypeFilter(v ? [v] : [])}
                />
              </InlineStack>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Spinner />
                </div>
              ) : rows.length === 0 ? (
                <EmptyState
                  heading="No charms found"
                  image=""
                  action={{
                    content: 'Add charm in Shopify',
                    url: `https://${shop}/admin/products/new`,
                    external: true,
                  }}
                >
                  <p>Add products with tags like <code>cc-charm-core</code>, <code>cc-charm-premium</code>, or <code>cc-charm-engravable</code> in Shopify.</p>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'numeric', 'text', 'text']}
                  headings={['Charm', 'Type', 'Price', 'Variants', 'Status', 'Actions']}
                  rows={rows}
                  sortable={[true, false, true, false, false, false]}
                  defaultSortDirection="ascending"
                  initialSortColumnIndex={0}
                  onSort={(index, dir) => {
                    const cols: SortableColumn[] = ['title', 'title', 'price'];
                    setSortColumn(cols[index] || 'title');
                    if (dir === 'ascending' || dir === 'descending') setSortDir(dir);
                  }}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Charm Type Tags Guide</Text>
              <InlineGrid columns={2} gap="400">
                <BlockStack gap="200">
                  <Badge tone="info">cc-charm-core</Badge>
                  <Text as="p" tone="subdued">Standard charms — most common type</Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Badge tone="warning">cc-charm-premium</Badge>
                  <Text as="p" tone="subdued">Premium/higher-priced special charms</Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Badge tone="magic">cc-charm-engravable</Badge>
                  <Text as="p" tone="subdued">Charms that can be engraved with text</Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Badge>cc-charm-spacer</Badge>
                  <Text as="p" tone="subdued">Spacer beads — usually free or low cost</Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Badge tone="success">cc-base</Badge>
                  <Text as="p" tone="subdued">Chains/necklaces — the base product</Text>
                </BlockStack>
              </InlineGrid>
              <Text as="p" tone="subdued">
                To add a new charm: go to Shopify Admin → Products → Add product, then add the appropriate tag above.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default function CharmsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CharmsContent />
    </Suspense>
  );
}
