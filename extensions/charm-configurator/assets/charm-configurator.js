(function () {
  'use strict';

  const APP_URL = 'https://charmcraft-seven.vercel.app';
  const SHOP = window.Shopify?.shop || 'jewellery-app-3.myshopify.com';
  const SF_TOKEN = document.querySelector('[data-storefront-token]')?.dataset.storefrontToken || '31f6559e0489e73fb811a461b6950878';

  let state = {
    chain: null,
    slots: [],
    maxSlots: 8,
    selectedSlot: null,
    charms: [],
    chains: [],
    activeTab: 'chains',
    loading: true,
  };

  const SF_QUERY = `
    query GetProducts {
      products(first: 250) {
        edges {
          node {
            id title tags handle
            images(first: 1) { edges { node { url altText } } }
            priceRange { minVariantPrice { amount currencyCode } }
            variants(first: 10) {
              edges {
                node {
                  id title price { amount currencyCode }
                  availableForSale
                  selectedOptions { name value }
                }
              }
            }
          }
        }
      }
    }
  `;

  async function fetchProducts() {
    const res = await fetch(`https://${SHOP}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SF_TOKEN,
      },
      body: JSON.stringify({ query: SF_QUERY }),
    });
    const { data } = await res.json();
    const all = data?.products?.edges?.map(e => e.node) || [];

    state.chains = all.filter(p => p.tags?.includes('cc-base')).map(formatProduct);
    state.charms = all.filter(p =>
      ['cc-charm-core', 'cc-charm-premium', 'cc-charm-engravable', 'cc-charm-spacer']
        .some(t => p.tags?.includes(t))
    ).map(formatProduct);

    state.loading = false;
    render();
  }

  function formatProduct(p) {
    const variant = p.variants?.edges?.[0]?.node;
    const tag = ['cc-charm-core','cc-charm-premium','cc-charm-engravable','cc-charm-spacer','cc-base']
      .find(t => p.tags?.includes(t)) || 'cc-charm-core';
    return {
      id: p.id,
      variantId: variant?.id,
      title: p.title,
      tag,
      price: parseFloat(variant?.price?.amount || '0'),
      currency: variant?.price?.currencyCode || 'INR',
      image: p.images?.edges?.[0]?.node?.url || '',
      available: variant?.availableForSale,
      engravable: p.tags?.includes('cc-charm-engravable'),
    };
  }

  function selectChain(chain) {
    state.chain = chain;
    state.slots = Array(state.maxSlots).fill(null);
    state.selectedSlot = null;
    state.activeTab = 'charms';
    render();
  }

  function selectSlot(idx) {
    state.selectedSlot = idx;
    render();
  }

  function addCharmToSlot(charm, engraving = '') {
    if (state.selectedSlot === null) return;
    state.slots[state.selectedSlot] = { ...charm, engraving };
    state.selectedSlot = null;
    render();
  }

  function removeFromSlot(idx) {
    state.slots[idx] = null;
    render();
  }

  function totalPrice() {
    const chainPrice = state.chain?.price || 0;
    const charmTotal = state.slots.filter(Boolean).reduce((s, c) => s + c.price, 0);
    return chainPrice + charmTotal;
  }

  function formatPrice(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  async function addToCart() {
    if (!state.chain) return;
    const btn = document.getElementById('cc-add-cart');
    if (btn) { btn.disabled = true; btn.textContent = 'Adding...'; }

    const items = [
      { id: state.chain.variantId.replace('gid://shopify/ProductVariant/', ''), quantity: 1,
        properties: { _charm_design: 'true', _charms_count: state.slots.filter(Boolean).length } },
      ...state.slots.filter(Boolean).map(c => ({
        id: c.variantId.replace('gid://shopify/ProductVariant/', ''),
        quantity: 1,
        properties: {
          _charm_for_chain: state.chain.title,
          ...(c.engraving ? { _engraving: c.engraving } : {}),
        },
      })),
    ];

    try {
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      window.location.href = '/cart';
    } catch {
      alert('Error adding to cart. Please try again.');
      if (btn) { btn.disabled = false; btn.textContent = 'Add to Cart'; }
    }
  }

  function render() {
    const root = document.getElementById('cc-root');
    if (!root) return;

    if (state.loading) {
      root.innerHTML = `<div class="cc-loading"><div class="cc-spinner"></div><p>Loading charms...</p></div>`;
      return;
    }

    root.innerHTML = `
      <div class="cc-app">
        <div class="cc-header">
          <h2 class="cc-title">Build Your Necklace</h2>
          ${state.chain ? `<div class="cc-chain-badge">${state.chain.title} — ${formatPrice(state.chain.price)}</div>` : ''}
        </div>

        <div class="cc-tabs">
          <button class="cc-tab ${state.activeTab==='chains'?'cc-tab--active':''}" onclick="window._cc.setTab('chains')">1. Choose Chain</button>
          <button class="cc-tab ${state.activeTab==='charms'?'cc-tab--active':''}" onclick="window._cc.setTab('charms')" ${!state.chain?'disabled':''}>2. Add Charms</button>
          <button class="cc-tab ${state.activeTab==='preview'?'cc-tab--active':''}" onclick="window._cc.setTab('preview')" ${!state.chain?'disabled':''}>3. Preview</button>
        </div>

        <div class="cc-content">
          ${state.activeTab === 'chains' ? renderChains() : ''}
          ${state.activeTab === 'charms' ? renderCharms() : ''}
          ${state.activeTab === 'preview' ? renderPreview() : ''}
        </div>
      </div>
    `;
  }

  function renderChains() {
    if (!state.chains.length) return `<div class="cc-empty"><p>No chains found. Add products tagged <code>cc-base</code> in Shopify.</p></div>`;
    return `
      <div class="cc-section-title">Select a chain to start</div>
      <div class="cc-grid">
        ${state.chains.map(c => `
          <div class="cc-card ${state.chain?.id === c.id ? 'cc-card--selected' : ''}" onclick="window._cc.selectChain('${c.id}')">
            ${c.image ? `<img src="${c.image}" alt="${c.title}" class="cc-card-img">` : '<div class="cc-card-img-placeholder">⛓</div>'}
            <div class="cc-card-body">
              <div class="cc-card-title">${c.title}</div>
              <div class="cc-card-price">${formatPrice(c.price)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderCharms() {
    return `
      <div class="cc-slots-row">
        ${state.slots.map((s, i) => `
          <div class="cc-slot ${state.selectedSlot===i?'cc-slot--active':''} ${s?'cc-slot--filled':''}" onclick="window._cc.selectSlot(${i})">
            ${s ? `<img src="${s.image}" alt="${s.title}" class="cc-slot-img">
                   <button class="cc-slot-remove" onclick="event.stopPropagation();window._cc.removeSlot(${i})">×</button>`
                : `<span class="cc-slot-num">${i+1}</span>`}
          </div>
        `).join('')}
      </div>
      ${state.selectedSlot !== null ? `<div class="cc-hint">Click a charm below to add to slot ${state.selectedSlot+1}</div>` : `<div class="cc-hint">Click a slot above to select it, then pick a charm</div>`}
      <div class="cc-grid cc-grid--charms">
        ${state.charms.map(c => `
          <div class="cc-card cc-card--charm ${state.selectedSlot===null?'cc-card--dim':''}" onclick="window._cc.addCharm('${c.id}')">
            ${c.image ? `<img src="${c.image}" alt="${c.title}" class="cc-card-img">` : '<div class="cc-card-img-placeholder">✨</div>'}
            <div class="cc-card-body">
              <div class="cc-card-title">${c.title}</div>
              <div class="cc-card-price">${formatPrice(c.price)}</div>
              ${c.engravable ? '<div class="cc-badge cc-badge--engrave">Engravable</div>' : ''}
              ${c.tag === 'cc-charm-premium' ? '<div class="cc-badge cc-badge--premium">Premium</div>' : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="cc-footer">
        <div class="cc-total">Total: <strong>${formatPrice(totalPrice())}</strong></div>
        <button class="cc-btn" onclick="window._cc.setTab('preview')">Preview Design →</button>
      </div>
    `;
  }

  function renderPreview() {
    const filled = state.slots.filter(Boolean);
    return `
      <div class="cc-preview">
        <div class="cc-preview-chain">
          ${state.chain?.image ? `<img src="${state.chain.image}" alt="${state.chain.title}" class="cc-preview-chain-img">` : ''}
          <div class="cc-preview-charms">
            ${filled.map(c => `
              <div class="cc-preview-charm">
                <img src="${c.image}" alt="${c.title}" class="cc-preview-charm-img">
                <div class="cc-preview-charm-name">${c.title}</div>
                ${c.engraving ? `<div class="cc-preview-engraving">"${c.engraving}"</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="cc-summary">
          <div class="cc-summary-row"><span>Chain:</span><strong>${state.chain?.title}</strong></div>
          ${filled.map(c => `<div class="cc-summary-row"><span>${c.title}:</span><strong>${formatPrice(c.price)}</strong></div>`).join('')}
          <div class="cc-summary-total"><span>Total:</span><strong>${formatPrice(totalPrice())}</strong></div>
        </div>
        <button id="cc-add-cart" class="cc-btn cc-btn--primary" onclick="window._cc.addToCart()">
          Add to Cart — ${formatPrice(totalPrice())}
        </button>
        <button class="cc-btn cc-btn--secondary" onclick="window._cc.setTab('charms')">← Edit Design</button>
      </div>
    `;
  }

  // Public API
  window._cc = {
    selectChain: (id) => { const c = state.chains.find(x => x.id === id); if (c) selectChain(c); },
    setTab: (tab) => { state.activeTab = tab; render(); },
    selectSlot: (i) => selectSlot(i),
    addCharm: (id) => {
      if (state.selectedSlot === null) return;
      const c = state.charms.find(x => x.id === id);
      if (!c) return;
      if (c.engravable) {
        const text = prompt('Enter engraving text (max 15 chars):', '');
        addCharmToSlot(c, (text || '').slice(0, 15));
      } else {
        addCharmToSlot(c);
      }
    },
    removeSlot: (i) => removeFromSlot(i),
    addToCart: () => addToCart(),
  };

  // Init
  const root = document.getElementById('cc-root');
  if (root) {
    render();
    fetchProducts();
  }
})();
