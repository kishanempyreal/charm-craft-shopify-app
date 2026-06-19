'use client';
import {
  Page, Layout, Card, Text, BlockStack, InlineStack, Badge,
  Button, DataTable, Thumbnail, EmptyState, TextField, Spinner,
  Banner, Modal, Select, RangeSlider
} from '@shopify/polaris';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';

interface Chain {
  id: string;
  shopifyId: string;
  title: string;
  image: string;
  variants: Array<{
    id: string;
    title: string;
    price: string;
    sku: string;
    options: Array<{ name: string; value: string }>;
  }>;
  slotCount: number;
  hasSlots: boolean;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || 'jewellery-app-3.myshopify.com';
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [slotCount, setSlotCount] = useState(8);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/products/chains?shop=${encodeURIComponent(shop)}`)
      .then(r => r.json())
      .then(data => { setChains(data.chains || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shop]);

  const saveSlotConfig = async () => {
    if (!selectedChain) return;
    setSaving(true);
    await fetch('/api/products/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop,
        chainId: selectedChain.shopifyId,
        chainName: selectedChain.title,
        slotCount,
      }),
    });
    setSaving(false);
    setSelectedChain(null);
    // Refresh
    fetch(`/api/products/chains?shop=${encodeURIComponent(shop)}`)
      .then(r => r.json())
      .then(data => setChains(data.chains || []));
  };

  const rows = chains.map(chain => [
    <InlineStack gap="200" key={chain.id} blockAlign="center">
      <Thumbnail source={chain.image || ''} alt={chain.title} size="small" />
      <Text as="span" variant="bodyMd">{chain.title}</Text>
    </InlineStack>,
    chain.variants.length,
    <Badge tone={chain.hasSlots ? 'success' : 'warning'} key={chain.id}>
      {chain.hasSlots ? `${chain.slotCount} slots` : 'No slots set'}
    </Badge>,
    chain.variants.map(v => `${v.title}: ₹${parseFloat(v.price).toFixed(0)}`).join(', '),
    <InlineStack gap="200" key={chain.id}>
      <Button
        size="slim"
        onClick={() => { setSelectedChain(chain); setSlotCount(chain.slotCount || 8); }}
      >
        Configure Slots
      </Button>
      <Button
        size="slim"
        url={`https://${shop}/admin/products/${chain.shopifyId.split('/').pop()}`}
        external
      >
        Edit
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page
      title="Chain / Necklace Products"
      subtitle="Configure chain variants and charm slot positions"
      primaryAction={{
        content: 'Add Chain Product',
        url: `https://${shop}/admin/products/new`,
        external: true,
      }}
    >
      <Layout>
        <Layout.Section>
          <Banner tone="info" title="How Chain Variants Work">
            <p>
              Each chain should have variants for <strong>Metal (Gold/Silver)</strong> and <strong>Length (16&quot;/18&quot;)</strong>.
              The configurator will show the right base image + slot positions for each combination.
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>
            ) : chains.length === 0 ? (
              <EmptyState
                heading="No chain products found"
                image=""
                action={{
                  content: 'Add chain in Shopify',
                  url: `https://${shop}/admin/products/new`,
                  external: true,
                }}
              >
                <p>Add products tagged <code>cc-base</code> to set up chains/necklaces.</p>
              </EmptyState>
            ) : (
              <DataTable
                columnContentTypes={['text', 'numeric', 'text', 'text', 'text']}
                headings={['Chain Name', 'Variants', 'Slot Config', 'Prices', 'Actions']}
                rows={rows}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>

      {/* Slot Config Modal */}
      <Modal
        open={!!selectedChain}
        onClose={() => setSelectedChain(null)}
        title={`Configure Slots: ${selectedChain?.title}`}
        primaryAction={{ content: saving ? 'Saving...' : 'Save', onAction: saveSlotConfig, loading: saving }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setSelectedChain(null) }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p">
              How many charm slots does this chain have? The configurator will evenly distribute them along the curve.
            </Text>
            <RangeSlider
              label={`Number of charm slots: ${slotCount}`}
              min={1}
              max={12}
              value={slotCount}
              onChange={v => setSlotCount(v as number)}
            />
            <Text as="p" tone="subdued">
              Visual slot positions can be fine-tuned in the Theme Editor after saving.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
