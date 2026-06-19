/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn.shopify.com', 'jewellery-app-3.myshopify.com'],
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors https://*.myshopify.com https://admin.shopify.com;" }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
