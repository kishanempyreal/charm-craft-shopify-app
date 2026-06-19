'use client';
import {
  Page, Layout, Card, BlockStack, InlineStack, Text, Button,
  Checkbox, Select, TextField, Badge, Thumbnail, Divider,
  Banner, Spinner, FormLayout, Tag
} from '@shopify/polaris';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';

interface Charm { id: string; name: string; image?: string; price: number; category: string; }
interface Variant { id: string; title: string; price: string; }
interface VariationConfig { variantTitle: string; charmIds: string[]; maxSlots: number; useDefault: boolean; }

function ConfigureContent({ productId }: { productId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shop = searchParams.get('shop') || 'jewellery-app-3.myshopify.com';
  const title = searchParams.get('title') || '';
  const handle = searchParams.get('handle') || '';
  const image = searchParams.get('image') || '';
  const variants: Variant[] = JSON.parse(decodeURIComponent(searchParams.get('variants') || '[]'));

  const [charms, setCharms] = useState<Charm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maxSlots, setMaxSlots] = useState('5');
  const [selectedCharms, setSelectedCharms] = useState<string[]>([]);
  const [variationConfigs, setVariationConfigs] = useState<VariationConfig[]>([]);
  const [showVariationConfig, setShowVariationConfig] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [charmsRes] = await Promise.all([
      fetch(`/api/charm-library?shop=${shop}`),
    ]);
    const charmsData = await charmsRes.json();
    setCharms(charmsData.charms || []);

    // Load existing config if any
    const configRes = await fetch(`/api/product-configs?shop=${shop}`);
    const configData = await configRes.json();
    const existing = configData.products?.find((p: any) => p.id === productId)?.config;
    if (existing) {
      setMaxSlots(String(existing.maxSlots || 5));
      setSelectedCharms(existing.charms?.map((pc: any) => pc.charm.id) || []);
      if (existing.variations?.length > 0) {
        setShowVariationConfig(true);
        setVariationConfigs(existing.variations.map((v: any) => ({
          variantTitle: v.variantTitle,
          charmIds: JSON.parse(v.charmIds || '[]'),
          maxSlots: v.maxSlots || 5,
          useDefault: false,
        })));
      } else {
        setVariationConfigs(variants.map(v => ({ variantTitle: v.title, charmIds: [], maxSlots: 5, useDefault: true })));
      }
    } else {
      setVariationConfigs(variants.map(v => ({ variantTitle: v.title, charmIds: [], maxSlots: 5, useDefault: true })));
    }
    setLoading(false);
  }, [shop, productId, variants]);

  useEffect(() => { load(); }, [load]);

  function toggleCharm(id: string) {
    setSelectedCharms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleVariationCharm(variantTitle: string, charmId: string) {
    setVariationConfigs(prev => prev.map(v =>
      v.variantTitle === variantTitle
        ? { ...v, charmIds: v.charmIds.includes(charmId) ? v.charmIds.filter(x => x !== charmId) : [...v.charmIds, charmId] }
        : v
    ));
  }

  async function save() {
    setSaving(true);
    const body = {
      shopifyProductId: productId,
      productTitle: title,
      productHandle: handle,
      productImage: image,
      maxSlots: parseInt(maxSlots),
      charmIds: selectedCharms,
      variations: showVariationConfig
        ? variationConfigs.filter(v => !v.useDefault).map(v => ({ variantTitle: v.variantTitle, charmIds: v.charmIds, maxSlots: v.maxSlots }))
        : [],
    };
    await fetch(`/api/product-configs?shop=${shop}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const categoryColors: any = { core: '#4caf50', premium: '#ff9800', engravable: '#2196f3', spacer: '#9c27b0' };

  if (loading) return <Page title="Configure Charms"><Card><BlockStack gap="400" align="center"><Spinner /></BlockStack></Card></Page>;

  return (
    <Page
      title={`Configure: ${title}`}
      backAction={{ content: 'Products', onAction: () => router.push(`/admin/products?shop=${shop}`) }}
      primaryAction={{ content: saving ? 'Saving...' : 'Save Configuration', onAction: save, disabled: saving }}
    >
      {saved && <Banner tone="success" onDismiss={() => setSaved(false)}><p>Configuration saved! The charm selector will now appear on this product's page.</p></Banner>}
      <Layout>
        {/* Product Info */}
        <Layout.Section>
          <Card>
            <InlineStack gap="400" blockAlign="center">
              {image && <Thumbnail source={image} alt={title} size="large" />}
              <BlockStack gap="100">
                <Text variant="headingMd" as="h2">{title}</Text>
                <Text variant="bodySm" tone="subdued" as="p">Handle: {handle}</Text>
                <Text variant="bodySm" tone="subdued" as="p">{variants.length} variant{variants.length !== 1 ? 's' : ''}: {variants.map(v => v.title).join(', ')}</Text>
              </BlockStack>
            </InlineStack>
          </Card>
        </Layout.Section>

        {/* Slot Config */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Charm Slots</Text>
              <FormLayout>
                <Select
                  label="Maximum charm slots on this product"
                  options={['1','2','3','4','5','6','7','8'].map(n => ({ label: `${n} slot${n==='1'?'':'s'}`, value: n }))}
                  value={maxSlots}
                  onChange={setMaxSlots}
                  helpText="How many charms can a customer add to this product"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Charm Selection */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h3">Available Charms (Default)</Text>
                  <Text variant="bodySm" tone="subdued" as="p">These charms will appear for ALL variants unless you configure per-variation below</Text>
                </BlockStack>
                <Badge>{String(selectedCharms.length) + ' selected'}</Badge>
              </InlineStack>

              {charms.length === 0 ? (
                <Banner tone="warning">
                  <p>No charms in library. <Button variant="plain" url={`/admin/charms?shop=${shop}`}>Add charms first</Button></p>
                </Banner>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {charms.map(charm => (
                    <div
                      key={charm.id}
                      onClick={() => toggleCharm(charm.id)}
                      style={{
                        border: `2px solid ${selectedCharms.includes(charm.id) ? '#c9a84c' : '#e0e0e0'}`,
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'pointer',
                        background: selectedCharms.includes(charm.id) ? '#fffbf0' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.15s',
                      }}
                    >
                      {charm.image && <img src={charm.image} alt={charm.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{charm.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>₹{charm.price}</div>
                        <span style={{ fontSize: '0.65rem', background: categoryColors[charm.category] + '22', color: categoryColors[charm.category], padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{charm.category}</span>
                      </div>
                      {selectedCharms.includes(charm.id) && <div style={{ marginLeft: 'auto', color: '#c9a84c', fontSize: '1.2rem' }}>✓</div>}
                    </div>
                  ))}
                </div>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Per-Variation Config */}
        {variants.length > 1 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h3">Per-Variation Charms</Text>
                    <Text variant="bodySm" tone="subdued" as="p">Show different charms for different product variants (optional)</Text>
                  </BlockStack>
                  <Checkbox label="Enable per-variation config" checked={showVariationConfig} onChange={setShowVariationConfig} />
                </InlineStack>

                {showVariationConfig && (
                  <BlockStack gap="600">
                    {variationConfigs.map((vc, idx) => (
                      <BlockStack key={vc.variantTitle} gap="300">
                        <Divider />
                        <InlineStack align="space-between" blockAlign="center">
                          <Text variant="headingSm" as="h4">Variant: {vc.variantTitle}</Text>
                          <Checkbox
                            label="Use default charms"
                            checked={vc.useDefault}
                            onChange={v => setVariationConfigs(prev => prev.map((x, i) => i === idx ? { ...x, useDefault: v } : x))}
                          />
                        </InlineStack>
                        {!vc.useDefault && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                            {charms.map(charm => (
                              <div
                                key={charm.id}
                                onClick={() => toggleVariationCharm(vc.variantTitle, charm.id)}
                                style={{
                                  border: `2px solid ${vc.charmIds.includes(charm.id) ? '#c9a84c' : '#e0e0e0'}`,
                                  borderRadius: '8px', padding: '8px', cursor: 'pointer',
                                  background: vc.charmIds.includes(charm.id) ? '#fffbf0' : '#fff',
                                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem',
                                }}
                              >
                                {charm.image && <img src={charm.image} alt={charm.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />}
                                <span>{charm.name}</span>
                                {vc.charmIds.includes(charm.id) && <span style={{ marginLeft: 'auto', color: '#c9a84c' }}>✓</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </BlockStack>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h3">How to show on product page</Text>
              <Text as="p" tone="subdued">After saving, add this code to your product page template in Shopify:</Text>
              <div style={{ background: '#1e1e1e', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: '0.8rem', color: '#c9a84c', overflowX: 'auto' }}>
                {'{% render \'charm-builder\', product: product %}'}
              </div>
              <Text as="p" tone="subdued" variant="bodySm">Go to: Online Store → Themes → Edit code → Find <code>product.json</code> or <code>main-product.liquid</code> → Add above snippet after the product form.</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default function ConfigurePage({ params }: { params: { productId: string } }) {
  return <Suspense fallback={<div>Loading...</div>}><ConfigureContent productId={params.productId} /></Suspense>;
}
