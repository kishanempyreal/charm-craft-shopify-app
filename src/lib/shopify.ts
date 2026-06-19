import { shopifyApi, ApiVersion, LogSeverity } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

// Lazy initialization — only creates the client when first used (not at build time)
let _shopify: ReturnType<typeof shopifyApi> | null = null;

export function getShopify() {
  if (!_shopify) {
    _shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY || 'placeholder',
      apiSecretKey: process.env.SHOPIFY_API_SECRET || 'placeholder',
      scopes: process.env.SHOPIFY_SCOPES?.split(',') ?? [
        'read_products', 'write_products', 'read_orders', 'write_orders',
        'read_customers', 'write_customers', 'read_metafields', 'write_metafields',
      ],
      hostName: process.env.HOST?.replace(/https?:\/\//, '') ?? 'localhost:3001',
      apiVersion: ApiVersion.January24,
      isEmbeddedApp: true,
      logger: {
        level: process.env.NODE_ENV === 'development' ? LogSeverity.Debug : LogSeverity.Error,
      },
    });
  }
  return _shopify;
}

// Keep backward-compatible export using a Proxy
export const shopify = new Proxy({} as ReturnType<typeof shopifyApi>, {
  get(_target, prop) {
    return (getShopify() as any)[prop];
  },
});

export async function getAdminClient(shop: string, accessToken: string) {
  const client = new shopify.clients.Rest({ session: { shop, accessToken } as any });
  return client;
}

export async function getGraphQLClient(shop: string, accessToken: string) {
  const client = new shopify.clients.Graphql({ session: { shop, accessToken } as any });
  return client;
}

// GraphQL queries for products
export const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          handle
          tags
          status
          featuredImage { url altText }
          priceRangeV2 {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                sku
                availableForSale
                image { url altText }
                selectedOptions { name value }
              }
            }
          }
          metafields(identifiers: [
            { namespace: "custom", key: "charm_type" },
            { namespace: "custom", key: "x_y_slots" },
            { namespace: "custom", key: "charm_category" }
          ]) {
            namespace
            key
            value
          }
        }
      }
    }
  }
`;

export const UPDATE_PRODUCT_METAFIELD = `
  mutation UpdateProductMetafield($productId: ID!, $metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id namespace key value }
      userErrors { field message }
    }
  }
`;
