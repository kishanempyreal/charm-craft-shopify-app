'use client';
import {
  Page, Layout, Card, BlockStack, InlineStack, Text, Button,
  Checkbox, Select, Badge, Thumbnail, Divider,
  Banner, Spinner, FormLayout
} from '@shopify/polaris';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback, useRef } from 'react';

interface Charm { id: string; name: string; image?: string; price: number; category: string; engravable?: boolean; }
interface Variant { id: string; title: string; price: string; image_id: string | null; }
interface SlotPosition { x: number; y: number; }
interface VariationConfig { variantTitle: string; charmIds: string[]; maxSlots: number; useDefault: boolean; }

function ConfigureContent({ productId }: { productId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shop = searchParams.get('shop') || 'jewellery-app-3.myshopify.com';
  const titleFromUrl = searchParams.get('title') || '';

  const [charms, setCharms] = useState<Charm[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [productTitle, setProductTitle] = useState(titleFromUrl);
  const [productImage, setProductImage] = useState('');
  const [allImages, setAllImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [maxSlots, setMaxSlots] = useState('5');
  const [slotPositions, setSlotPositions] = useState<SlotPosition[]>([]);
  const [selectedCharms, setSelectedCharms] = useState<string[]>([]);
  const [variationConfigs, setVariationConfigs] = useState<VariationConfig[]>([]);
  const [showVariationConfig, setShowVariationConfig] = useState(false);
  const [saved, setSaved] = useState(false);
  const [catFilter, setCatFilter] = useState('all');
  const imgRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [charmsData, configData] = await Promise.all([
        fetch(`/api/charm-library?shop=${shop}`).then(r => r.json()),
        fetch(`/api/product-configs?shop=${shop}`).then(r => r.json()),
      ]);

      setCharms(charmsData.charms || []);

      const productFromApi = (configData.products || []).find((p: any) => p.id === productId);
      if (productFromApi?.title) setProductTitle(productFromApi.title);
      if (productFromApi?.image) setProductImage(productFromApi.image);
      if (productFromApi?.images) setAllImages(productFromApi.images);

      const apiVariants: Variant[] = productFromApi?.variants || [];
      setVariants(apiVariants);

      const existing = productFromApi?.config;
      if (existing) {
        const slots = parseInt(String(existing.maxSlots || 5));
        setMaxSlots(String(slots));
        setSlotPositions((existing.slotPositions as SlotPosition[]) || []);
        setSelectedCharms(existing.charms?.map((pc: any) => pc.charm.id) || []);
        if (existing.variations?.length > 0) {
          setShowVariationConfig(true);
          setVariationConfigs(existing.variations.map((v: any) => ({
            variantTitle: v.variantTitle,
            charmIds: JSON.parse(v.charmIds || '[]'),
            maxSlots: v.maxSlots || slots,
            useDefault: false,
          })));
        } else {
          setVariationConfigs(apiVariants.map(v => ({ variantTitle: v.title, charmIds: [], maxSlots: slots, useDefault: true })));
        }
      } else {
        setVariationConfigs(apiVariants.map(v => ({ variantTitle: v.title, charmIds: [], maxSlots: 5, useDefault: true })));
      }
    } catch {
      setError('Failed to load. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [shop, productId]);

  useEffect(() => { load(); }, [load]);

  // Sync maxSlots with number of slot positions
  useEffect(() => {
    if (slotPositions.length > 0) setMaxSlots(String(slotPositions.length));
  }, [slotPositions]);

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = parseFloat(((e.clientX - rect.left) / rect.width).toFixed(3));
    const y = parseFloat(((e.clientY - rect.top) / rect.height).toFixed(3));
    setSlotPositions(prev => [...prev, { x, y }]);
  }

  function removeSlot(idx: number) {
    setSlotPositions(prev => prev.filter((_, i) => i !== idx));
  }

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
        maxSlots: slotPositions.length > 0 ? slotPositions.length : parseInt(maxSlots),
        slotPositions,
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

  const catColor: Record<string, string> = { core: '#16a34a', premium: '#ea580c', engravable: '#2563eb', spacer: '#7c3aed' };
  const cats = ['all', ...Array.from(new Set(charms.map(c => c.category)))];
  const visibleCharms = catFilter === 'all' ? charms : charms.filter(c => c.category === catFilter);

  if (loading) return (
    <Page title="Configure" backAction={{ content: 'Products', onAction: () => router.push(`/admin/products?shop=${shop}`) }}>
      <Card><BlockStack gap="400" align="center"><Spinner /><Text as="p" tone="subdued">Loading…</Text></BlockStack></Card>
    </Page>
  );

  return (
    <Page
      title={`Configure: ${productTitle}`}
      backAction={{ content: 'Products', onAction: () => router.push(`/admin/products?shop=${shop}`) }}
      primaryAction={{ content: saving ? 'Saving…' : 'Save Configuration', onAction: save, disabled: saving }}
    >
      <BlockStack gap="500">
        {error && <Banner tone="critical" onDismiss={() => setError('')}><p>{error}</p></Banner>}
        {saved && <Banner tone="success" onDismiss={() => setSaved(false)}><p>Saved! Charm popup is now active on this product.</p></Banner>}

        <Layout>

          {/* ── PRODUCT IMAGE & SLOT POSITION EDITOR ── */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="050">
                    <Text variant="headingMd" as="h3">Slot Positions</Text>
                    <Text variant="bodySm" tone="subdued" as="p">Click on the image to place charm slots. The circles show exactly where charms appear in the popup.</Text>
                  </BlockStack>
                  <InlineStack gap="200">
                    <Badge tone={slotPositions.length > 0 ? 'success' : 'attention'}>{String(slotPositions.length) + ' slots placed'}</Badge>
                    {slotPositions.length > 0 && (
                      <Button size="slim" tone="critical" onClick={() => setSlotPositions([])}>Clear all</Button>
                    )}
                  </InlineStack>
                </InlineStack>

                {/* Image thumbnails row */}
                {allImages.length > 1 && (
                  <BlockStack gap="200">
                    <Text variant="bodySm" tone="subdued" as="p">Select which image to use as the necklace canvas:</Text>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {allImages.map((src, i) => (
                        <div
                          key={i}
                          onClick={() => setProductImage(src)}
                          style={{
                            border: `2.5px solid ${productImage === src ? '#000' : '#e0e0e0'}`,
                            borderRadius: 8, cursor: 'pointer', overflow: 'hidden',
                            width: 64, height: 64,
                          }}
                        >
                          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                      ))}
                    </div>
                  </BlockStack>
                )}

                {/* Slot editor canvas */}
                <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
                  <div
                    ref={imgRef}
                    onClick={handleImageClick}
                    style={{
                      position: 'relative',
                      cursor: 'crosshair',
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '2px dashed #ccc',
                      background: '#f5f5f5',
                      aspectRatio: '1 / 1',
                      userSelect: 'none',
                    }}
                  >
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={productTitle}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '.9rem' }}>
                        No image — click to place slots anyway
                      </div>
                    )}

                    {/* Slot circles on image */}
                    {slotPositions.map((pos, i) => (
                      <div
                        key={i}
                        onClick={(e) => { e.stopPropagation(); removeSlot(i); }}
                        style={{
                          position: 'absolute',
                          left: `${pos.x * 100}%`,
                          top: `${pos.y * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          width: 36,
                          height: 36,
                          border: '3px solid #000',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '.8rem',
                          fontWeight: 700,
                          color: '#000',
                          cursor: 'pointer',
                          zIndex: 10,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                        title="Click to remove this slot"
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <Text variant="bodySm" tone="subdued" as="p" alignment="center">
                    {slotPositions.length === 0
                      ? '👆 Click on the image to place charm slot positions'
                      : `${slotPositions.length} slot${slotPositions.length !== 1 ? 's' : ''} placed — click a circle to remove it`}
                  </Text>
                </div>

                {slotPositions.length === 0 && (
                  <Banner tone="info">
                    <p>Place slots on the image to show customers exactly where charms will appear. Tip: place them along the necklace chain in the photo.</p>
                  </Banner>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* ── CHARM SELECTION ── */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="050">
                    <Text variant="headingMd" as="h3">Available Charms</Text>
                    <Text variant="bodySm" tone="subdued" as="p">Select charms that appear in the popup for this product</Text>
                  </BlockStack>
                  <InlineStack gap="200">
                    <Badge tone={selectedCharms.length > 0 ? 'success' : 'attention'}>{String(selectedCharms.length) + ' selected'}</Badge>
                    {selectedCharms.length > 0 && (
                      <Button size="slim" onClick={() => setSelectedCharms([])}>Deselect all</Button>
                    )}
                  </InlineStack>
                </InlineStack>

                {charms.length === 0 ? (
                  <Banner tone="warning">
                    <p>No charms yet. <Button variant="plain" url={`/admin/charms?shop=${shop}`}>Add charms →</Button></p>
                  </Banner>
                ) : (
                  <BlockStack gap="300">
                    {/* Category filter tabs */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {cats.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCatFilter(cat)}
                          style={{
                            padding: '4px 14px',
                            borderRadius: 20,
                            border: `1.5px solid ${catFilter === cat ? '#000' : '#d0d0d0'}`,
                            background: catFilter === cat ? '#000' : '#fff',
                            color: catFilter === cat ? '#fff' : '#555',
                            fontSize: '.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {cat === 'all' ? `All (${charms.length})` : `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${charms.filter(c => c.category === cat).length})`}
                        </button>
                      ))}
                    </div>

                    {/* Charm grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                      {visibleCharms.map(charm => {
                        const sel = selectedCharms.includes(charm.id);
                        return (
                          <div
                            key={charm.id}
                            onClick={() => toggleCharm(charm.id)}
                            style={{
                              border: `2px solid ${sel ? '#000' : '#e0e0e0'}`,
                              borderRadius: 10,
                              padding: '10px 12px',
                              cursor: 'pointer',
                              background: sel ? '#f5f5f5' : '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              transition: 'border-color .12s, background .12s',
                            }}
                          >
                            {charm.image
                              ? <img src={charm.image} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                              : <div style={{ width: 40, height: 40, borderRadius: '50%', background: catColor[charm.category] + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>✨</div>
                            }
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{charm.name}</div>
                              <div style={{ fontSize: '.75rem', color: '#888' }}>{charm.price === 0 ? 'Free' : `₹${charm.price}`}</div>
                              <span style={{ fontSize: '.6rem', background: catColor[charm.category] + '22', color: catColor[charm.category], padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{charm.category}</span>
                            </div>
                            {sel && <div style={{ color: '#000', fontSize: '1.1rem', flexShrink: 0 }}>✓</div>}
                          </div>
                        );
                      })}
                    </div>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* ── MAX SLOTS (auto-sync with positions) ── */}
          {slotPositions.length === 0 && (
            <Layout.Section>
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h3">Max Slots (fallback)</Text>
                  <Text variant="bodySm" tone="subdued" as="p">Used if no slot positions are placed on the image above. When positions are set, this auto-syncs.</Text>
                  <FormLayout>
                    <Select
                      label="Max charm slots"
                      options={['1','2','3','4','5','6','7','8'].map(n => ({ label: `${n} slot${n==='1'?'':'s'}`, value: n }))}
                      value={maxSlots}
                      onChange={setMaxSlots}
                    />
                  </FormLayout>
                </BlockStack>
              </Card>
            </Layout.Section>
          )}

          {/* ── PER-VARIANT CHARMS ── */}
          {variants.length > 1 && (
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="050">
                      <Text variant="headingMd" as="h3">Per-Variant Charms</Text>
                      <Text variant="bodySm" tone="subdued" as="p">Show different charms for different variants</Text>
                    </BlockStack>
                    <Checkbox label="Enable per-variant" checked={showVariationConfig} onChange={setShowVariationConfig} />
                  </InlineStack>

                  {showVariationConfig && variationConfigs.map((vc, idx) => (
                    <BlockStack key={vc.variantTitle} gap="300">
                      <Divider />
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="headingSm" as="h4">{vc.variantTitle}</Text>
                        <Checkbox
                          label="Use default charms"
                          checked={vc.useDefault}
                          onChange={v => setVariationConfigs(prev => prev.map((x, i) => i === idx ? { ...x, useDefault: v } : x))}
                        />
                      </InlineStack>
                      {!vc.useDefault && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                          {charms.map(charm => {
                            const sel = vc.charmIds.includes(charm.id);
                            return (
                              <div
                                key={charm.id}
                                onClick={() => toggleVariationCharm(vc.variantTitle, charm.id)}
                                style={{
                                  border: `2px solid ${sel ? '#000' : '#e0e0e0'}`,
                                  borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
                                  background: sel ? '#f5f5f5' : '#fff',
                                  display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem',
                                }}
                              >
                                {charm.image && <img src={charm.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />}
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{charm.name}</span>
                                {sel && <span style={{ color: '#000' }}>✓</span>}
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

          {/* ── HOW TO USE ── */}
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">Storefront Integration</Text>
                <Text tone="subdued" as="p">The charm popup appears automatically on this product's page. Make sure this snippet is in your theme:</Text>
                <div style={{ background: '#111', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: '.8rem', color: '#c9a84c', overflowX: 'auto' }}>
                  {'{% render \'charm-builder\', product: product %}'}
                </div>
                <Text tone="subdued" as="p" variant="bodySm">Or the global script tag in <strong>layout/theme.liquid</strong> handles it automatically if already installed.</Text>
              </BlockStack>
            </Card>
          </Layout.Section>

        </Layout>
      </BlockStack>
    </Page>
  );
}

export default function ConfigurePage({ params }: { params: { productId: string } }) {
  return <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}><ConfigureContent productId={params.productId} /></Suspense>;
}
