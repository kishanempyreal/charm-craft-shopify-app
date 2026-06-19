/* Charm Craft Configurator — Storefront Widget v2.0 */
(function () {
  'use strict';

  const ROOT = document.getElementById('charm-craft-root');
  if (!ROOT) return;

  const SHOP = ROOT.dataset.shop || window.Shopify?.shop || '';
  const STOREFRONT_TOKEN = ROOT.dataset.storefrontToken || '';
  const CURRENCY = ROOT.dataset.currency || 'INR';
  const CUSTOMER_ID = ROOT.dataset.customerId || '';
  const APP_URL = ROOT.dataset.appUrl || '';
  const MAX_CHARMS = parseInt(ROOT.dataset.maxCharms || '8', 10);
  const ENABLE_ENGRAVING = ROOT.dataset.enableEngraving !== 'false';
  const TITLE = ROOT.dataset.title || 'Build Your Necklace';

  // State
  const state = {
    chains: [],
    charms: [],
    selectedChain: null,
    selectedMetal: 'Gold',
    selectedLength: '18"',
    slots: [],
    filledSlots: {}, // slotId -> { charm, engraving }
    selectedSlotId: null,
    searchQuery: '',
    categoryFilter: 'all',
    engravingText: '',
    loading: true,
    addingToCart: false,
  };

  const formatPrice = (amount) => {
    const num = parseFloat(amount || 0);
    if (CURRENCY === 'INR') return '₹' + num.toFixed(0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY }).format(num);
  };

  // Storefront API fetch
  async function storefrontQuery(query, variables = {}) {
    const res = await fetch(`https://${SHOP}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    return json.data;
  }

  // Load products from Storefront API
  async function loadProducts() {
    const PRODUCTS_QUERY = `
      query GetProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id title handle tags
              images(first: 5) { edges { node { url altText } } }
              priceRange { minVariantPrice { amount } }
              variants(first: 10) {
                edges {
                  node {
                    id title price { amount }
                    availableForSale
                    selectedOptions { name value }
                    image { url }
                  }
                }
              }
            }
          }
        }
      }
    `;
    try {
      const data = await storefrontQuery(PRODUCTS_QUERY, { first: 250 });
      const products = data?.products?.edges?.map(e => e.node) || [];

      state.chains = products
        .filter(p => p.tags.includes('cc-base'))
        .map(p => ({
          id: p.id,
          title: p.title,
          handle: p.handle,
          image: p.images.edges[0]?.node.url || '',
          images: p.images.edges.map(e => e.node),
          basePrice: parseFloat(p.priceRange.minVariantPrice.amount),
          variants: p.variants.edges.map(e => ({
            id: e.node.id,
            title: e.node.title,
            price: parseFloat(e.node.price.amount),
            available: e.node.availableForSale,
            image: e.node.image?.url,
            options: e.node.selectedOptions,
          })),
        }));

      state.charms = products
        .filter(p => p.tags.some(t => t.startsWith('cc-charm')))
        .map(p => {
          const type = p.tags.find(t => t.startsWith('cc-charm')) || 'cc-charm-core';
          return {
            id: p.id,
            variantId: p.variants.edges[0]?.node.id || '',
            title: p.title,
            type,
            category: type.replace('cc-charm-', ''),
            price: parseFloat(p.priceRange.minVariantPrice.amount),
            image: p.images.edges[0]?.node.url || '',
            isEngravable: type === 'cc-charm-engravable',
            available: p.variants.edges.some(e => e.node.availableForSale),
          };
        });

      if (state.chains.length > 0) {
        state.selectedChain = state.chains[0];
        await loadSlots();
      }
    } catch (err) {
      console.error('CharmCraft: Failed to load products', err);
    }
  }

  // Load slot config from app proxy
  async function loadSlots() {
    if (!state.selectedChain || !APP_URL) {
      state.slots = generateDefaultSlots(MAX_CHARMS);
      return;
    }
    try {
      const res = await fetch(`${APP_URL}/api/proxy?shop=${SHOP}&action=slots&chainId=${encodeURIComponent(state.selectedChain.id)}`);
      const json = await res.json();
      state.slots = json.slots?.length ? json.slots : generateDefaultSlots(MAX_CHARMS);
    } catch {
      state.slots = generateDefaultSlots(MAX_CHARMS);
    }
  }

  function generateDefaultSlots(count) {
    const slots = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const angle = t * Math.PI;
      const x = 15 + 70 * Math.sin(angle);
      const y = 55 - 20 * Math.sin(angle * 0.5);
      slots.push({ id: `slot-${i + 1}`, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, label: `Slot ${i + 1}` });
    }
    return slots;
  }

  // Get current chain variant based on metal + length selection
  function getCurrentVariant() {
    if (!state.selectedChain) return null;
    return state.selectedChain.variants.find(v => {
      const optValues = v.options.map(o => o.value.toLowerCase());
      const metalMatch = optValues.some(v => v.includes(state.selectedMetal.toLowerCase()));
      const lengthMatch = optValues.some(v => v.includes(state.selectedLength.replace('"', '')));
      return metalMatch && lengthMatch;
    }) || state.selectedChain.variants[0];
  }

  // Calculate total price
  function calcTotal() {
    const variant = getCurrentVariant();
    const chainPrice = variant?.price || state.selectedChain?.basePrice || 0;
    const charmsTotal = Object.values(state.filledSlots).reduce((sum, s) => sum + (s.charm?.price || 0), 0);
    return chainPrice + charmsTotal;
  }

  // Get filtered charms
  function getFilteredCharms() {
    return state.charms.filter(c => {
      const matchSearch = !state.searchQuery || c.title.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchCat = state.categoryFilter === 'all' || c.category === state.categoryFilter;
      return matchSearch && matchCat;
    });
  }

  // Get unique categories
  function getCategories() {
    const cats = [...new Set(state.charms.map(c => c.category))];
    return cats;
  }

  // Add to Cart
  async function addToCart() {
    const variant = getCurrentVariant();
    if (!variant) { showToast('Please select a chain first'); return; }

    const filledList = Object.values(state.filledSlots);
    if (filledList.length === 0) { showToast('Please add at least one charm!'); return; }

    state.addingToCart = true;
    render();

    const charmDetails = filledList.map(s => s.charm.title);
    const engravings = filledList
      .filter(s => s.engraving)
      .map(s => `${s.charm.title}: ${s.engraving}`);

    const items = [
      {
        id: variant.id.replace('gid://shopify/ProductVariant/', ''),
        quantity: 1,
        properties: {
          '_charms': JSON.stringify(charmDetails),
          'Charms': charmDetails.join(', '),
          ...(engravings.length ? { '_engraving': engravings.join(' | '), 'Engraving': engravings.join(', ') } : {}),
          '_design_preview': state.previewDataUrl || '',
          '_cc_total': calcTotal().toFixed(2),
        },
      },
      // Add individual charm line items
      ...filledList.map(s => ({
        id: s.charm.variantId.replace('gid://shopify/ProductVariant/', ''),
        quantity: 1,
        properties: {
          '_charm_for': variant.title,
          ...(s.engraving ? { 'Engraving': s.engraving } : {}),
        },
      })),
    ];

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Cart error');
      showToast('✓ Added to cart!');
      setTimeout(() => { window.location.href = '/cart'; }, 1200);
    } catch (err) {
      showToast('Failed to add to cart. Please try again.');
      console.error(err);
    } finally {
      state.addingToCart = false;
      render();
    }
  }

  // Save design
  async function saveDesign() {
    if (!APP_URL) { showToast('App not configured'); return; }
    const designData = {
      chainId: state.selectedChain?.id,
      metal: state.selectedMetal,
      length: state.selectedLength,
      slots: state.filledSlots,
    };
    try {
      const res = await fetch(`${APP_URL}/api/designs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: SHOP, customerId: CUSTOMER_ID, designData }),
      });
      const json = await res.json();
      showToast('Design saved!');
    } catch {
      showToast('Save failed');
    }
  }

  // Share design
  function shareDesign() {
    const designData = btoa(JSON.stringify({
      c: state.selectedChain?.id,
      m: state.selectedMetal,
      l: state.selectedLength,
      s: Object.fromEntries(Object.entries(state.filledSlots).map(([k, v]) => [k, v.charm?.id])),
    }));
    const url = `${window.location.origin}${window.location.pathname}?cc_design=${designData}`;
    navigator.clipboard.writeText(url).then(() => showToast('Link copied!')).catch(() => {
      prompt('Copy this link:', url);
    });
  }

  // Load shared design from URL
  function loadSharedDesign() {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('cc_design');
    if (!encoded) return;
    try {
      const data = JSON.parse(atob(encoded));
      state.selectedMetal = data.m || 'Gold';
      state.selectedLength = data.l || '18"';
      if (data.c) {
        const chain = state.chains.find(c => c.id === data.c);
        if (chain) state.selectedChain = chain;
      }
      if (data.s) {
        Object.entries(data.s).forEach(([slotId, charmId]) => {
          const charm = state.charms.find(c => c.id === charmId);
          if (charm) state.filledSlots[slotId] = { charm };
        });
      }
    } catch (e) { console.error('CharmCraft: Failed to load shared design', e); }
  }

  function showToast(msg) {
    let toast = document.querySelector('.cc-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'cc-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // Get chain image for current metal/length selection
  function getChainImage() {
    if (!state.selectedChain) return '';
    const variant = getCurrentVariant();
    if (variant?.image) return variant.image;
    // Try to find image matching metal in chain images
    const metalLower = state.selectedMetal.toLowerCase();
    const img = state.selectedChain.images?.find(i =>
      i.altText?.toLowerCase().includes(metalLower) ||
      i.url.toLowerCase().includes(metalLower)
    );
    return img?.url || state.selectedChain.image || '';
  }

  // Render
  function render() {
    if (state.loading) {
      ROOT.innerHTML = `
        <div style="text-align:center;padding:4rem;font-family:sans-serif;">
          <div style="display:inline-block;width:40px;height:40px;border:3px solid #f0e6d3;border-top-color:#c9a96e;border-radius:50%;animation:cc-spin 0.8s linear infinite;"></div>
          <p style="color:#666;margin-top:1rem;">Loading Charm Configurator...</p>
        </div>`;
      return;
    }

    const metals = ['Gold', 'Silver'];
    const lengths = ['16"', '18"'];
    const categories = getCategories();
    const filteredCharms = getFilteredCharms();
    const chainImg = getChainImage();
    const total = calcTotal();
    const filledCount = Object.keys(state.filledSlots).length;
    const hasEngravable = Object.values(state.filledSlots).some(s => s.charm?.isEngravable);

    ROOT.innerHTML = `
      <div class="cc-configurator">
        <div class="cc-header">
          <h1>${TITLE}</h1>
          <p>Choose your chain, add charms, and create something beautiful</p>
        </div>
        <div class="cc-layout">
          <!-- Left: Preview -->
          <div>
            <div class="cc-preview-panel">
              <div class="cc-preview-title">Your Necklace Preview</div>
              <div class="cc-canvas-wrap" id="cc-canvas">
                ${chainImg ? `<img class="cc-chain-img" src="${chainImg}" alt="Chain" />` : '<div style="width:100%;height:100%;background:linear-gradient(135deg,#f8f4ee,#fdf9f4);"></div>'}
                ${state.slots.map(slot => {
                  const filled = state.filledSlots[slot.id];
                  const isSelected = state.selectedSlotId === slot.id;
                  return `
                    <div class="cc-slot" style="left:${slot.x}%;top:${slot.y}%;" data-slot="${slot.id}">
                      <div class="cc-slot-ring${filled ? ' filled' : ''}${isSelected ? ' selected' : ''}"
                           style="${isSelected ? 'border-color:#c9a96e;box-shadow:0 0 0 3px rgba(201,169,110,0.3);' : ''}">
                        ${filled
                          ? `<img class="cc-slot-charm-img" src="${filled.charm.image}" alt="${filled.charm.title}" title="${filled.charm.title}" />
                             <button class="cc-slot-remove" data-remove="${slot.id}" title="Remove charm">×</button>`
                          : `<span class="cc-slot-add-btn">+</span>`
                        }
                      </div>
                    </div>`;
                }).join('')}
              </div>

              <!-- Chain selector -->
              <div class="cc-base-selector">
                ${state.chains.length > 1 ? `
                  <div class="cc-section-label">Chain Style</div>
                  <div class="cc-option-tabs">
                    ${state.chains.map(c => `
                      <button class="cc-option-tab${state.selectedChain?.id === c.id ? ' active' : ''}" data-chain="${c.id}">${c.title}</button>
                    `).join('')}
                  </div>
                ` : ''}
                <div style="display:flex;gap:1rem;margin-top:0.75rem;">
                  <div style="flex:1;">
                    <div class="cc-section-label">Metal</div>
                    <div class="cc-option-tabs">
                      ${metals.map(m => `<button class="cc-option-tab${state.selectedMetal === m ? ' active' : ''}" data-metal="${m}">${m}</button>`).join('')}
                    </div>
                  </div>
                  <div style="flex:1;">
                    <div class="cc-section-label">Length</div>
                    <div class="cc-option-tabs">
                      ${lengths.map(l => `<button class="cc-option-tab${state.selectedLength === l ? ' active' : ''}" data-length="${l}">${l}</button>`).join('')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Charm library + footer -->
          <div class="cc-right-panel">
            <!-- Charm library -->
            <div class="cc-charm-library">
              <div class="cc-charm-library-header">
                <h3>Choose Charms ${filledCount > 0 ? `(${filledCount}/${MAX_CHARMS})` : ''}</h3>
              </div>
              <input class="cc-charm-search" type="text" placeholder="Search charms..." value="${state.searchQuery}" id="cc-charm-search" />
              <div class="cc-charm-category-tabs">
                <button class="cc-charm-category-tab${state.categoryFilter === 'all' ? ' active' : ''}" data-cat="all">All</button>
                ${categories.map(c => `<button class="cc-charm-category-tab${state.categoryFilter === c ? ' active' : ''}" data-cat="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</button>`).join('')}
              </div>
              <div class="cc-charm-grid">
                ${filteredCharms.length === 0
                  ? '<div style="grid-column:1/-1;text-align:center;color:#888;padding:1rem;font-size:0.85rem;">No charms found</div>'
                  : filteredCharms.map(charm => `
                    <div class="cc-charm-item${state.selectedCharmId === charm.id ? ' selected' : ''}"
                         data-charm="${charm.id}"
                         title="${charm.title}${!charm.available ? ' (Out of stock)' : ''}"
                         style="${!charm.available ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                      <img src="${charm.image || ''}" alt="${charm.title}" loading="lazy" />
                      <div class="cc-charm-name">${charm.title}</div>
                      <div class="cc-charm-price">${formatPrice(charm.price)}</div>
                      ${charm.isEngravable ? '<div style="font-size:0.65rem;color:#9b59b6;">✎ Engravable</div>' : ''}
                    </div>
                  `).join('')
                }
              </div>
            </div>

            <!-- Engraving panel (shown when engravable charm selected) -->
            ${hasEngravable && ENABLE_ENGRAVING ? `
              <div class="cc-engraving-panel">
                <h4>✎ Engraving</h4>
                <p style="font-size:0.8rem;color:#888;margin:0 0 0.5rem;">Add custom text to your engravable charm</p>
                <input class="cc-engraving-input" type="text"
                  placeholder="Your initials or text..."
                  maxlength="20"
                  value="${state.engravingText || ''}"
                  id="cc-engraving-input" />
                <div style="font-size:0.75rem;color:#aaa;margin-top:0.3rem;">Max 20 characters</div>
              </div>
            ` : ''}

            <!-- Price + ATC -->
            <div class="cc-footer">
              <div class="cc-price-breakdown">
                ${state.selectedChain ? `
                  <div class="cc-price-row">
                    <span>Chain (${state.selectedMetal}, ${state.selectedLength})</span>
                    <span>${formatPrice(getCurrentVariant()?.price || state.selectedChain.basePrice)}</span>
                  </div>
                ` : ''}
                ${Object.values(state.filledSlots).map(s => `
                  <div class="cc-price-row">
                    <span>${s.charm.title}</span>
                    <span>${formatPrice(s.charm.price)}</span>
                  </div>
                `).join('')}
                <div class="cc-price-row total">
                  <span>Total</span>
                  <span>${formatPrice(total)}</span>
                </div>
              </div>
              <button class="cc-btn-atc" id="cc-atc" ${filledCount === 0 || state.addingToCart ? 'disabled' : ''}>
                ${state.addingToCart ? '<span class="cc-spinner"></span>Adding...' : filledCount === 0 ? 'Select Charms to Continue' : `Add to Cart — ${formatPrice(total)}`}
              </button>
              <div class="cc-footer-actions">
                <button class="cc-btn-save" id="cc-save">💾 Save Design</button>
                <button class="cc-btn-share" id="cc-share">🔗 Share</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Chain selection
    ROOT.querySelectorAll('[data-chain]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.chain;
        state.selectedChain = state.chains.find(c => c.id === id);
        state.filledSlots = {};
        state.selectedSlotId = null;
        await loadSlots();
        render();
      });
    });

    // Metal/Length tabs
    ROOT.querySelectorAll('[data-metal]').forEach(btn => {
      btn.addEventListener('click', () => { state.selectedMetal = btn.dataset.metal; render(); });
    });
    ROOT.querySelectorAll('[data-length]').forEach(btn => {
      btn.addEventListener('click', () => { state.selectedLength = btn.dataset.length; render(); });
    });

    // Slot click
    ROOT.querySelectorAll('[data-slot]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-remove]')) return;
        const slotId = el.dataset.slot;
        state.selectedSlotId = state.selectedSlotId === slotId ? null : slotId;
        render();
      });
    });

    // Remove charm from slot
    ROOT.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slotId = btn.dataset.remove;
        delete state.filledSlots[slotId];
        if (state.selectedSlotId === slotId) state.selectedSlotId = null;
        render();
      });
    });

    // Charm click → fill selected slot
    ROOT.querySelectorAll('[data-charm]').forEach(el => {
      el.addEventListener('click', () => {
        const charmId = el.dataset.charm;
        const charm = state.charms.find(c => c.id === charmId);
        if (!charm || !charm.available) return;

        if (state.selectedSlotId) {
          state.filledSlots[state.selectedSlotId] = { charm, engraving: charm.isEngravable ? state.engravingText : '' };
          state.selectedSlotId = null;
        } else {
          // Auto-fill next empty slot
          const emptySlot = state.slots.find(s => !state.filledSlots[s.id]);
          if (emptySlot) {
            if (Object.keys(state.filledSlots).length >= MAX_CHARMS) {
              showToast(`Maximum ${MAX_CHARMS} charms reached`);
              return;
            }
            state.filledSlots[emptySlot.id] = { charm, engraving: charm.isEngravable ? state.engravingText : '' };
          } else {
            showToast(`Maximum ${MAX_CHARMS} charms reached`);
          }
        }
        render();
      });
    });

    // Category filter
    ROOT.querySelectorAll('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => { state.categoryFilter = btn.dataset.cat; render(); });
    });

    // Charm search
    const searchInput = ROOT.querySelector('#cc-charm-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        render();
        // Re-focus after render
        const newInput = ROOT.querySelector('#cc-charm-search');
        if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = newInput.value.length; }
      });
    }

    // Engraving
    const engravingInput = ROOT.querySelector('#cc-engraving-input');
    if (engravingInput) {
      engravingInput.addEventListener('input', (e) => { state.engravingText = e.target.value; });
    }

    // Add to Cart
    const atcBtn = ROOT.querySelector('#cc-atc');
    if (atcBtn) atcBtn.addEventListener('click', addToCart);

    // Save
    const saveBtn = ROOT.querySelector('#cc-save');
    if (saveBtn) saveBtn.addEventListener('click', saveDesign);

    // Share
    const shareBtn = ROOT.querySelector('#cc-share');
    if (shareBtn) shareBtn.addEventListener('click', shareDesign);
  }

  // Init
  async function init() {
    state.loading = true;
    render();
    await loadProducts();
    loadSharedDesign();
    state.loading = false;
    render();
  }

  init();
})();
