'use client';
import {
  Page, Layout, Card, ResourceList, ResourceItem, Thumbnail,
  Text, Badge, Button, BlockStack, InlineStack, EmptyState, Spinner, Banner
} from '@shopify/polaris';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';

interface ShopifyVariant { id: string; title: string; price: string; }
interface ProductWithConfig {
  id: string;
  title: string;
  handle: string;
  image: string | null;
  variants: ShopifyVariant[];
  config: any | null;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shop = searchParams.get('shop') || 'jewellery-app-3.myshopify.com';
  const [products, setProducts] = useState<ProductWithConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/product-configs?shop=${shop}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProducts(data.products || []);
    } catch (e) {
      setError('Could not load products. Check your Shopify token.');
    } finally {
      setLoading(false);
    }
  }, [shop]);

  useEffect(() => { load(); }, [load]);

  const configured = products.filter(p => p.config);
  const unconfigured = products.filter(p => !p.config);

  return (
    <Page
      title="Products"
      subtitle="Configure which products show the charm builder popup"
      primaryAction={{ content: 'Refresh', onAction: load }}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical"><p>{error}</p></Banner>
          </Layout.Section>
        )}

        {!loading && products.length > 0 && (
          <Layout.Section>
            <InlineStack gap="400">
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 18px' }}>
                <Text variant="headingLg" as="p" tone="success">{String(configured.length)}</Text>
                <Text variant="bodySm" tone="subdued" as="p">Configured</Text>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 18px' }}>
                <Text variant="headingLg" as="p">{String(unconfigured.length)}</Text>
                <Text variant="bodySm" tone="subdued" as="p">Not configured</Text>
              </div>
            </InlineStack>
          </Layout.Section>
        )}

        <Layout.Section>
          {loading ? (
            <Card>
              <BlockStack gap="400" align="center">
                <Spinner />
                <Text as="p" tone="subdued">Fetching products…</Text>
              </BlockStack>
            </Card>
          ) : products.length === 0 ? (
            <Card>
              <EmptyState heading="No products found" image="">
                <p>Make sure your Shopify store has active products. Charm-type products are filtered out — only necklace/chain products appear here.</p>
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <ResourceList
                items={products}
                renderItem={(product) => (
                  <ResourceItem
                    id={product.id}
                    media={
                      <Thumbnail
                        source={product.image || ''}
                        alt={product.title}
                        size="medium"
                      />
                    }
                    onClick={() => router.push(
                      `/admin/products/configure/${product.id}?shop=${shop}&title=${encodeURIComponent(product.title)}&handle=${product.handle}&image=${encodeURIComponent(product.image || '')}`
                    )}
                  >
                    <InlineStack align="space-between" blockAlign="center" wrap={false}>
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="semibold" as="h3">{product.title}</Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''} · /{product.handle}
                        </Text>
                        {product.config ? (
                          <InlineStack gap="200">
                            <Badge tone="success">Active</Badge>
                            <Badge>{String(product.config.charms?.length || 0) + ' charms'}</Badge>
                            <Badge>{String(product.config.maxSlots) + ' slots'}</Badge>
                          </InlineStack>
                        ) : (
                          <Badge tone="attention">Not configured</Badge>
                        )}
                      </BlockStack>
                      <Button
                        variant={product.config ? 'secondary' : 'primary'}
                        onClick={() => router.push(
                          `/admin/products/configure/${product.id}?shop=${shop}&title=${encodeURIComponent(product.title)}&handle=${product.handle}&image=${encodeURIComponent(product.image || '')}`
                        )}
                      >
                        {product.config ? 'Edit' : 'Configure'}
                      </Button>
                    </InlineStack>
                  </ResourceItem>
                )}
              />
            </Card>
          )}
        </Layout.Section>

        <Layout.Section>
          <Banner tone="info">
            <p>Only necklace/chain products are shown here. Individual charm products (Gold Heart, Silver Star etc.) are managed in the <strong>Charm Library</strong> tab — they are NOT Shopify products.</p>
          </Banner>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default function ProductsPage() {
  return <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}><ProductsContent /></Suspense>;
}
