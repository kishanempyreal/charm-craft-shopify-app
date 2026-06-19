'use client';
import {
  Page, Layout, Card, BlockStack, InlineStack, Text, Button,
  Checkbox, Select, Badge, Thumbnail, Divider,
  Banner, Spinner, FormLayout
} from '@shopify/polaris';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';

interface Charm { id: string; name: string; image?: string; price: number; category: string; engravable?: boolean; }
interface Variant { id: string; title: string; price: string; }
interface VariationConfig { variantTitle: string; charmIds: string[]; maxSlots: number; useDefault: boolean; }

function ConfigureContent({ productId }: { productId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shop = searchParams.get('shop') || 'jewellery-app-3.myshopify.com';
  const titleFromUrl = searchParams.get('title') || '';
  const imageFromUrl = searchParams.get('image') || '';

  const [charms, setCharms] = useState<Charm[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [productTitle, setProductTitle] = useState(titleFromUrl);
  const [productImage, setProductImage] = useState(imageFromUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [maxSlots, setMaxSlots] = useState('5');
  const [selectedCharms, setSelectedCharms] = useState<string[]>([]);
  const [variationConfigs, setVariationConfigs] = useState<VariationConfig[]>([]);
  const [showVariationConfig, setShowVariationConfig] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [charmsData, configData] = await Promise.all([
        fetch(`/api/charm-library?shop=${shop}`).then(r => r.json()),
        fetch(`/api/product-configs?shop=${shop}`).then(r => r.json()),
      ]);

      setCharms(charmsData.charms || []);

      // Get product variants from API (not URL params which can be too long)
      const productFromApi = (configData.products || []).find((p: any) => p.id === productId);
      const apiVariants: Variant[] = productFromApi?.variants || [];
      setVariants(apiVariants);
      if (productFromApi?.title) setProductTitle(productFromApi.title);
      if (productFromApi?.image) setProductImage(productFromApi.image);

      const existing = productFromApi?.config;
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
          setVariationConfigs(apiVariants.map(v => ({ variantTitle: v.title, charmIds: [], maxSlots: 5, useDefault: true })));
        }
      } else {
        setVariationConfigs(apiVariants.map(v => ({ variantTitle: v.title, charmIds: [], maxSlots: 5, useDefault: true })));
      }
    } catch (e) {
      setError('Failed to load configuration. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [shop, productId]);

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
    try {
      const handle = searchParams.get('handle') || '';
      const body = {
        shopifyProductId: productId,
        productTitle,
        productHandle: handle,
        productImage,
        maxSlots: parseInt(maxSlots),
        charmIds: selectedCharms,
        variations: showVariationConfig
          ? variationConfigs.filter(v => !v.useDefault).map(v => ({ variantTitle: v.variantTitle, charmIds: v.charmIds, maxSlots: v.maxSlots }))
          : [],
      };
      const r = await fetch(`/api/product-configs?shop=${shop}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const catColor: Record<string, string> = { core: '#4caf50', premium: '#ff9800', engravable: '#2196f3', spacer: '#9c27b0' };

  if (loading) return (
    <Page title="Configure Charms" backAction={{ content: 'Products', onAction: () => router.push(`/admin/products?shop=${shop}`) }}>
      <Card><BlockStack gap="400" align="center"><Spinner /><Text as="p" tone="subdued">Loading product data…</Text></BlockStack></Card>
    </Page>
  );

  return (
    <Page
      title={`Configure: ${productTitle}`}
      backAction={{ content: 'Products', onAction: () => router.push(`/admin/products?shop=${shop}`) }}
      primaryAction={{ content: saving ? 'Saving…' : 'Save', onAction: save, disabled: saving || selectedCharms.length === 0 }}
    >
      <BlockStack gap="400">
        {error && <Banner tone="critical" onDismiss={() => setError('')}><p>{error}</p></Banner>}
        {saved && <Banner tone="success" onDismiss={() => setSaved(false)}><p>Saved! The charm popup will now appear on this product's page.</p></Banner>}

        <Layout>
          {/* Product info */}
          <Layout.Section>
            <Card>
              <InlineStack gap="400" blockAlign="center">
                {productImage && <Thumbnail source={productImage} alt={productTitle} size="large" />}
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">{productTitle}</Text>
                  <Text variant="bodySm" tone="subdued" as="p">{variants.length} variant{variants.length !== 1 ? 's' : ''}{variants.length > 0 ? ': ' + variants.map(v => v.title).join(', ') : ''}</Text>
                </BlockStack>
              </InlineStack>
            </Card>
          </Layout.Section>

          {/* Max slots */}
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">Charm Slots</Text>
                <FormLayout>
                  <Select
                    label="Max charms a customer can add"
                    options={['1','2','3','4','5','6','7','8'].map(n => ({ label: `${n} slot${n==='1'?'':'s'}`, value: n }))}
                    value={maxSlots}
                    onChange={setMaxSlots}
                  />
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Charm selection */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="050">
                    <Text variant="headingMd" as="h3">Available Charms</Text>
                    <Text variant="bodySm" tone="subdued" as="p">Tick which charms appear in this product's popup</Text>
                  </BlockStack>
                  <Badge tone={selectedCharms.length > 0 ? 'success' : 'attention'}>{String(selectedCharms.length) + ' selected'}</Badge>
                </InlineStack>

                {charms.length === 0 ? (
                  <Banner tone="warning">
                    <p>No charms in library yet. <Button variant="plain" url={`/admin/charms?shop=${shop}`}>Add charms first →</Button></p>
                  </Banner>
                ) : (
                  <>
                    <InlineStack gap="200" wrap>
                      {['all', 'core', 'premium', 'engravable', 'spacer'].map(cat => (
                        <span key={cat} style={{ fontSize: '.72rem', padding: '3px 10px', borderRadius: 20, background: cat === 'all' ? '#eee' : (catColor[cat] + '22'), color: cat === 'all' ? '#555' : catColor[cat], fontWeight: 700, cursor: 'pointer' }}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)} ({cat === 'all' ? charms.length : charms.filter(c => c.category === cat).length})
                        </span>
                      ))}
                    </InlineStack>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                      {charms.map(charm => {
                        const sel = selectedCharms.includes(charm.id);
                        return (
                          <div
                            key={charm.id}
                            onClick={() => toggleCharm(charm.id)}
                            style={{
                              border: `2px solid ${sel ? '#c9a84c' : '#e0e0e0'}`,
                              borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                              background: sel ? '#fffbf0' : '#fff',
                              display: 'flex', alignItems: 'center', gap: 10,
                              transition: 'all .12s',
                              boxShadow: sel ? '0 2px 8px #c9a84c33' : 'none',
                            }}
                          >
                            {charm.image
                              ? <img src={charm.image} alt={charm.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                              : <div style={{ width: 40, height: 40, borderRadius: '50%', background: catColor[charm.category] + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>✨</div>
                            }
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{charm.name}</div>
                              <div style={{ fontSize: '.75rem', color: '#888' }}>₹{charm.price}</div>
                              <span style={{ fontSize: '.6rem', background: catColor[charm.category] + '22', color: catColor[charm.category], padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{charm.category}</span>
                            </div>
                            {sel && <div style={{ marginLeft: 'auto', color: '#c9a84c', fontSize: '1.1rem', flexShrink: 0 }}>✓</div>}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Per-variant config */}
          {variants.length > 1 && (
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="050">
                      <Text variant="headingMd" as="h3">Per-Variant Charms</Text>
                      <Text variant="bodySm" tone="subdued" as="p">Show different charms for different variants (optional)</Text>
                    </BlockStack>
                    <Checkbox label="Enable per-variant overrides" checked={showVariationConfig} onChange={setShowVariationConfig} />
                  </InlineStack>

                  {showVariationConfig && variationConfigs.map((vc, idx) => (
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                          {charms.map(charm => {
                            const sel = vc.charmIds.includes(charm.id);
                            return (
                              <div
                                key={charm.id}
                                onClick={() => toggleVariationCharm(vc.variantTitle, charm.id)}
                                style={{
                                  border: `2px solid ${sel ? '#c9a84c' : '#e0e0e0'}`,
                                  borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
                                  background: sel ? '#fffbf0' : '#fff',
                                  display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem',
                                }}
                              >
                                {charm.image && <img src={charm.image} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />}
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{charm.name}</span>
                                {sel && <span style={{ color: '#c9a84c' }}>✓</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </BlockStack>
                  ))}
                </BlockStack>
              </Card>
            </Layout.Section>
          )}
        </Layout>
      </BlockStack>
    </Page>
  );
}

export default function ConfigurePage({ params }: { params: { productId: string } }) {
  return <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}><ConfigureContent productId={params.productId} /></Suspense>;
}
