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

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/product-configs?shop=${shop}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }, [shop]);

  useEffect(() => { load(); }, [load]);

  return (
    <Page title="Product Configurations" subtitle="Choose which products show the charm selector and configure their options">
      <Layout>
        <Layout.Section>
          <Banner tone="info">
            <p>For each product, click <strong>Configure Charms</strong> to set which charms appear on that product's page and optionally set different charms per variation.</p>
          </Banner>
        </Layout.Section>
        <Layout.Section>
          {loading ? (
            <Card><BlockStack gap="400" align="center"><Spinner /></BlockStack></Card>
          ) : products.length === 0 ? (
            <Card>
              <EmptyState heading="No products found" image="">
                <p>Add products to your Shopify store first, then configure charm options here.</p>
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <ResourceList
                items={products}
                renderItem={(product) => (
                  <ResourceItem
                    id={product.id}
                    media={<Thumbnail source={product.image || ''} alt={product.title} size="medium" />}
                    onClick={() => {}}
                  >
                    <InlineStack align="space-between" blockAlign="center" wrap={false}>
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="semibold" as="h3">{product.title}</Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''} · {product.handle}
                        </Text>
                        {product.config ? (
                          <InlineStack gap="200">
                            <Badge tone="success">Charms configured</Badge>
                            <Badge>{product.config.charms?.length || 0} charms</Badge>
                            <Badge>{product.config.maxSlots} slots</Badge>
                          </InlineStack>
                        ) : (
                          <Badge tone="attention">Not configured</Badge>
                        )}
                      </BlockStack>
                      <Button
                        variant={product.config ? 'secondary' : 'primary'}
                        onClick={() => router.push(`/admin/products/configure/${product.id}?shop=${shop}&title=${encodeURIComponent(product.title)}&handle=${product.handle}&image=${encodeURIComponent(product.image || '')}&variants=${encodeURIComponent(JSON.stringify(product.variants))}`)}
                      >
                        {product.config ? 'Edit Config' : 'Configure Charms'}
                      </Button>
                    </InlineStack>
                  </ResourceItem>
                )}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default function ProductsPage() {
  return <Suspense fallback={<div>Loading...</div>}><ProductsContent /></Suspense>;
}
