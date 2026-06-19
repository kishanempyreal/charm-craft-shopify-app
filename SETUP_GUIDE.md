# Charm Craft — Full Shopify App Setup Guide

## Overview
This is a complete Shopify App with:
- Admin panel (embedded in Shopify Admin)
- Charm & Product management
- Theme extension (storefront configurator)
- Cart + Checkout integration with charm details
- Saved designs (per customer)
- Vercel deployment

---

## STEP 1: Create Required Accounts

### A) Shopify Partners Account (FREE)
1. Go to https://partners.shopify.com
2. Sign up with your email
3. This gives you access to register your app

### B) GitHub Account (FREE)
1. Go to https://github.com
2. Sign up
3. Create a new repository named `charm-craft-shopify-app`
4. Push this project code to that repository

### C) Vercel Account (FREE)
1. Go to https://vercel.com
2. Sign up using your GitHub account
3. This links GitHub → Vercel for automatic deployment

---

## STEP 2: Register App in Shopify Partners

1. Go to https://partners.shopify.com → **Apps** → **Create App**
2. Choose **Create app manually**
3. App name: **Charm Craft**
4. App URL: `https://charm-craft-app.vercel.app` (your Vercel URL — update after Step 4)
5. Allowed redirection URLs:
   - `https://charm-craft-app.vercel.app/api/auth/callback`
6. Click **Create app**
7. Copy your **API key** (Client ID) and **API secret key**

---

## STEP 3: Set Up Database (Vercel Postgres — FREE)

1. In Vercel dashboard → your project → **Storage** tab
2. Click **Create Database** → choose **Postgres**
3. This gives you a `DATABASE_URL` connection string
4. Copy it for the next step

OR for development, use SQLite (no setup needed, just uses a local file)

---

## STEP 4: Deploy to Vercel

### A) Push code to GitHub
```bash
cd "charm-craft-shopify-app"
git init
git add .
git commit -m "Initial Charm Craft app"
git remote add origin https://github.com/YOUR_USERNAME/charm-craft-shopify-app.git
git push -u origin main
```

### B) Import to Vercel
1. Go to https://vercel.com → **Add New** → **Project**
2. Select your `charm-craft-shopify-app` GitHub repo
3. Click **Import**

### C) Add Environment Variables in Vercel
In Vercel project → **Settings** → **Environment Variables**, add:

| Variable | Value |
|---|---|
| `SHOPIFY_API_KEY` | From Partners dashboard |
| `SHOPIFY_API_SECRET` | From Partners dashboard |
| `SHOPIFY_SCOPES` | `read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_metafields,write_metafields` |
| `SESSION_SECRET` | Any random 32-character string |
| `DATABASE_URL` | Your Vercel Postgres URL (or `file:./dev.db` for dev) |
| `HOST` | `https://charm-craft-app.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://charm-craft-app.vercel.app` |

4. Click **Deploy** — Vercel will build and deploy automatically

### D) Update Partners Dashboard
After deployment, update the App URL in Partners dashboard to your actual Vercel URL.

---

## STEP 5: Install App on Your Store

1. In Partners dashboard → your app → **Test on development store**
2. Select `jewellery-app-3.myshopify.com`
3. Click **Install app**
4. You'll be redirected to your admin — click **Install**

The app is now installed! Access it at:
`https://jewellery-app-3.myshopify.com/admin/apps/charm-craft`

---

## STEP 6: Add Products to Shopify

### Chains (Base Products)
In Shopify Admin → Products → Add product:
- Title: e.g., `Classic Gold Chain`
- Tag: `cc-base`
- Add variants: Metal (Gold, Silver) × Length (16", 18")
- Upload chain images — one per variant if possible

### Charms
Add products with these tags:
- `cc-charm-core` — regular charms
- `cc-charm-premium` — premium/special charms  
- `cc-charm-engravable` — charms that can be engraved
- `cc-charm-spacer` — spacer beads

---

## STEP 7: Add Configurator to Store Page

1. Shopify Admin → **Online Store** → **Pages** → **Build Your Necklace** (or create new page)
2. Go to **Online Store** → **Themes** → **Customize**
3. Navigate to the Build Your Necklace page
4. Click **Add section** → find **Charm Configurator**
5. In section settings:
   - App URL: your Vercel URL
6. **Save** → **Preview** → your configurator is live!

---

## Daily Operations

### Admin Panel
Access at: `https://jewellery-app-3.myshopify.com/admin/apps/charm-craft`
- **Charms** — see all charm products, sync from Shopify
- **Products** — configure slot positions for each chain
- **Orders** — see orders with charm details + engraving text
- **Settings** — customize title, max charms, engraving, currency

### Adding New Charms
1. Add product in Shopify Admin
2. Add the `cc-charm-core` (or other) tag
3. Click **Sync from Shopify** in the Charms admin page

---

## Troubleshooting

**App not loading in admin?**
→ Check that Content-Security-Policy headers allow `*.myshopify.com`

**Products not showing in configurator?**
→ Make sure products have `cc-base` or `cc-charm-*` tags
→ Products must be published and available

**Cart not working?**
→ Check Storefront API token is set correctly

**Database errors?**
→ Run `npm run db:push` to sync the database schema
