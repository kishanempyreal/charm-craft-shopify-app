(function () {
  'use strict';

  // Direct Vercel API — no App Proxy dependency
  var API = 'https://charmcraft-seven.vercel.app/api/proxy';

  // Get product handle from URL
  var HANDLE = '';
  try {
    var m = window.location.pathname.match(/\/products\/([^/?#]+)/);
    if (m) HANDLE = m[1];
  } catch (e) {}
  if (!HANDLE) return;

  // ─── STATE ──────────────────────────────────────────────
  var S = {
    loading: true,
    config: null,
    slots: [],
    active: null,
    cat: 'all',
    variantTitle: ''
  };

  // ─── STYLES ─────────────────────────────────────────────
  var CSS = `
    #cc-wrap {
      margin: 28px 0 0;
      border-top: 1px solid #e8dcc8;
      padding-top: 24px;
      font-family: inherit;
    }
    #cc-wrap * { box-sizing: border-box; }

    .cc-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }
    .cc-head-bar {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, #c9a84c55, transparent);
    }
    .cc-head-bar.right {
      background: linear-gradient(270deg, #c9a84c55, transparent);
    }
    .cc-head-text {
      font-size: 0.92rem;
      font-weight: 700;
      color: #2a1a00;
      display: flex;
      align-items: center;
      gap: 7px;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .cc-gem {
      width: 16px;
      height: 16px;
      background: linear-gradient(135deg, #c9a84c, #f5d76e);
      clip-path: polygon(50% 0%,100% 35%,80% 100%,20% 100%,0% 35%);
    }

    /* ── NECKLACE CHAIN ── */
    .cc-necklace {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 8px;
      margin-bottom: 10px;
    }
    .cc-chain-svg {
      position: absolute;
      top: 50%; left: 5%; right: 5%;
      width: 90%; height: 2px;
      transform: translateY(-50%);
      z-index: 0;
    }
    .cc-chain-path {
      stroke: url(#ccGold);
      stroke-width: 2;
      fill: none;
      stroke-dasharray: 4 3;
    }

    .cc-slot {
      position: relative;
      z-index: 1;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 2px dashed #d4b96680;
      background: #fafaf8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin: 0 7px;
      transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
    }
    .cc-slot:hover {
      border-color: #c9a84c;
      transform: scale(1.07);
      box-shadow: 0 0 0 4px #c9a84c22;
    }
    .cc-slot.cc-active {
      border: 2.5px solid #c9a84c;
      box-shadow: 0 0 0 5px #c9a84c30;
      background: #fffbf0;
      transform: scale(1.12);
    }
    .cc-slot.cc-filled {
      border: 2px solid #c9a84c;
      background: #fff;
      box-shadow: 0 2px 8px #c9a84c44;
    }
    .cc-slot img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    .cc-slot-empty-icon {
      font-size: 0.7rem;
      color: #c9a84c99;
      font-weight: 700;
    }
    .cc-slot-rm {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 18px;
      height: 18px;
      background: #fff;
      border: 1.5px solid #e53935;
      border-radius: 50%;
      color: #e53935;
      font-size: 10px;
      font-weight: 900;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      z-index: 2;
    }

    .cc-instruction {
      text-align: center;
      font-size: 0.76rem;
      color: #b0915a;
      margin-bottom: 14px;
      font-style: italic;
      min-height: 18px;
    }

    /* ── CATEGORY TABS ── */
    .cc-tabs {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .cc-tab {
      padding: 4px 13px;
      border-radius: 20px;
      font-size: 0.73rem;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid #e8dcc8;
      background: #fff;
      color: #8a7050;
      transition: all 0.12s;
      white-space: nowrap;
      text-transform: capitalize;
    }
    .cc-tab:hover, .cc-tab.cc-on {
      border-color: #c9a84c;
      background: linear-gradient(135deg, #c9a84c, #e8c06a);
      color: #fff;
    }

    /* ── CHARM GRID ── */
    .cc-grid-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #6a5030;
      margin-bottom: 8px;
    }
    .cc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
      gap: 8px;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 2px;
    }
    .cc-grid::-webkit-scrollbar { width: 3px; }
    .cc-grid::-webkit-scrollbar-thumb { background: #d4b966; border-radius: 4px; }

    .cc-card {
      border: 1.5px solid #ede8de;
      border-radius: 10px;
      padding: 10px 6px 8px;
      cursor: pointer;
      text-align: center;
      background: #fff;
      transition: all 0.15s ease;
    }
    .cc-card:hover {
      border-color: #c9a84c;
      transform: translateY(-2px);
      box-shadow: 0 4px 14px #c9a84c28;
    }
    .cc-card.cc-dim {
      opacity: 0.38;
      cursor: not-allowed;
      pointer-events: none;
    }
    .cc-card img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      margin: 0 auto 6px;
      background: #f5f0e8;
    }
    .cc-card-ph {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f5f0e8, #e8dcc8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      margin: 0 auto 6px;
    }
    .cc-card-name {
      font-size: 0.64rem;
      font-weight: 600;
      color: #333;
      line-height: 1.3;
      margin-bottom: 2px;
    }
    .cc-card-price {
      font-size: 0.71rem;
      font-weight: 700;
      color: #b08828;
    }
    .cc-badge {
      display: inline-block;
      font-size: 0.54rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      margin-top: 3px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .cc-b-eng { background: #e8f5e9; color: #2e7d32; }
    .cc-b-prm { background: #fff3e0; color: #e65100; }

    /* ── SUMMARY ── */
    .cc-summary {
      margin-top: 14px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #fffbf0 0%, #fff8e4 100%);
      border: 1px solid #e8d49a;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .cc-sum-info {
      font-size: 0.8rem;
      color: #6a5030;
    }
    .cc-sum-names {
      font-size: 0.72rem;
      color: #999;
      margin-top: 1px;
    }
    .cc-sum-price {
      font-size: 1.05rem;
      font-weight: 700;
      color: #c9a84c;
      white-space: nowrap;
    }

    /* ── LOADING ── */
    .cc-loading-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px;
      color: #b09070;
      font-size: 0.82rem;
    }
    .cc-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid #f0e8d4;
      border-top-color: #c9a84c;
      border-radius: 50%;
      animation: cc-spin 0.65s linear infinite;
      flex-shrink: 0;
    }
    @keyframes cc-spin { to { transform: rotate(360deg); } }

    /* ── EMPTY ── */
    .cc-empty {
      text-align: center;
      padding: 20px;
      color: #bbb;
      font-size: 0.8rem;
      border: 1.5px dashed #e0d8c8;
      border-radius: 10px;
    }

    @media (max-width: 749px) {
      .cc-slot { width: 48px; height: 48px; margin: 0 5px; }
      .cc-grid { grid-template-columns: repeat(3, 1fr); max-height: 230px; }
    }
  `;

  // ─── HELPERS ────────────────────────────────────────────
  function fmt(n) {
    return '₹' + parseFloat(n).toLocaleString('en-IN');
  }

  function getCharms() {
    if (!S.config) return [];
    var all = S.config.charms || [];
    if (S.variantTitle && S.config.variations && S.config.variations.length) {
      var vConf = null;
      for (var i = 0; i < S.config.variations.length; i++) {
        if ((S.config.variations[i].variantTitle || '').toLowerCase() === S.variantTitle.toLowerCase()) {
          vConf = S.config.variations[i];
          break;
        }
      }
      if (vConf && vConf.charmIds && vConf.charmIds.length) {
        all = all.filter(function (c) { return vConf.charmIds.indexOf(c.id) >= 0; });
      }
    }
    if (S.cat === 'all') return all;
    return all.filter(function (c) { return c.category === S.cat; });
  }

  function getCats() {
    if (!S.config || !S.config.charms) return [];
    var seen = { all: true };
    var cats = ['all'];
    (S.config.charms || []).forEach(function (c) {
      if (!seen[c.category]) { seen[c.category] = true; cats.push(c.category); }
    });
    return cats;
  }

  function totalExtra() {
    return S.slots.reduce(function (s, c) { return s + (c ? (parseFloat(c.price) || 0) : 0); }, 0);
  }

  function filledSlots() { return S.slots.filter(Boolean); }

  // ─── RENDER ─────────────────────────────────────────────
  function render() {
    var root = document.getElementById('cc-wrap');
    if (!root) return;

    if (S.loading) {
      root.innerHTML = '<div class="cc-loading-wrap"><div class="cc-spinner"></div>Loading charm options…</div>';
      return;
    }

    if (!S.config || !S.config.configured) {
      root.innerHTML = '';
      return;
    }

    var maxSlots = S.config.maxSlots || 5;
    var charms = getCharms();
    var cats = getCats();
    var extra = totalExtra();
    var filled = filledSlots();

    // Slots HTML
    var slotsHTML = '';
    for (var i = 0; i < maxSlots; i++) {
      var s = S.slots[i];
      var cls = 'cc-slot' + (S.active === i ? ' cc-active' : '') + (s ? ' cc-filled' : '');
      var inner = '';
      if (s) {
        inner = (s.image
          ? '<img src="' + s.image + '" alt="' + s.name + '">'
          : '<div class="cc-card-ph" style="width:100%;height:100%;margin:0;font-size:1.4rem">✨</div>') +
          '<span class="cc-slot-rm" data-remove="' + i + '" title="Remove">✕</span>';
      } else {
        inner = '<span class="cc-slot-empty-icon">' + (i + 1) + '</span>';
      }
      slotsHTML += '<div class="' + cls + '" data-slot="' + i + '">' + inner + '</div>';
    }

    // Categories HTML
    var catsHTML = '';
    if (cats.length > 2) {
      cats.forEach(function (c) {
        var label = c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1);
        catsHTML += '<button class="cc-tab' + (S.cat === c ? ' cc-on' : '') + '" data-cat="' + c + '">' + label + '</button>';
      });
    }

    // Grid HTML
    var gridHTML = '';
    if (charms.length === 0) {
      gridHTML = '<div class="cc-empty">No charms available for this selection.</div>';
    } else {
      charms.forEach(function (c) {
        var dim = S.active === null ? ' cc-dim' : '';
        var badge = '';
        if (c.engravable) badge = '<span class="cc-badge cc-b-eng">Engravable</span>';
        else if (c.category === 'premium') badge = '<span class="cc-badge cc-b-prm">Premium</span>';
        var imgEl = c.image
          ? '<img src="' + c.image + '" alt="' + c.name + '">'
          : '<div class="cc-card-ph">✨</div>';
        gridHTML += '<div class="cc-card' + dim + '" data-cid="' + c.id + '">' + imgEl + '<div class="cc-card-name">' + c.name + '</div><div class="cc-card-price">' + fmt(c.price) + '</div>' + badge + '</div>';
      });
    }

    var hint = S.active !== null
      ? 'Slot ' + (S.active + 1) + ' selected — pick a charm below'
      : 'Click a slot to select it, then pick a charm';

    // Summary
    var summaryHTML = '';
    if (extra > 0) {
      summaryHTML = '<div class="cc-summary"><div><div class="cc-sum-info">' +
        filled.length + ' charm' + (filled.length !== 1 ? 's' : '') + ' added</div>' +
        '<div class="cc-sum-names">' + filled.map(function (c) { return c.name; }).join(' · ') + '</div></div>' +
        '<div class="cc-sum-price">+' + fmt(extra) + '</div></div>';
    }

    root.innerHTML =
      // Header
      '<div class="cc-head"><div class="cc-head-bar"></div><div class="cc-head-text"><span class="cc-gem"></span>Customize with Charms</div><div class="cc-head-bar right"></div></div>' +
      // Necklace chain
      '<div class="cc-necklace">' +
        '<svg class="cc-chain-svg" height="2" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
          '<defs><linearGradient id="ccGold" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="transparent"/><stop offset="30%" stop-color="#c9a84c"/><stop offset="70%" stop-color="#c9a84c"/><stop offset="100%" stop-color="transparent"/></linearGradient></defs>' +
          '<line x1="0" y1="1" x2="100%" y2="1" stroke="url(#ccGold)" stroke-width="2" stroke-dasharray="5 4"/>' +
        '</svg>' +
        slotsHTML +
      '</div>' +
      // Instruction
      '<div class="cc-instruction">' + hint + '</div>' +
      // Category tabs
      (catsHTML ? '<div class="cc-tabs">' + catsHTML + '</div>' : '') +
      // Grid label + grid
      '<div class="cc-grid-label">Available charms (' + charms.length + ')</div>' +
      '<div class="cc-grid">' + gridHTML + '</div>' +
      // Summary
      summaryHTML;

    // ── EVENTS ──────────────────────────────────────────
    root.querySelectorAll('.cc-slot').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var rmBtn = e.target.closest('[data-remove]');
        if (rmBtn) {
          e.stopPropagation();
          var idx = parseInt(rmBtn.getAttribute('data-remove'), 10);
          S.slots[idx] = null;
          if (S.active === idx) S.active = null;
          syncCart();
          render();
          return;
        }
        var idx = parseInt(el.getAttribute('data-slot'), 10);
        S.active = (S.active === idx) ? null : idx;
        render();
      });
    });

    root.querySelectorAll('.cc-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        S.cat = btn.getAttribute('data-cat');
        render();
      });
    });

    root.querySelectorAll('.cc-card').forEach(function (card) {
      card.addEventListener('click', function () {
        if (S.active === null) return;
        var cid = card.getAttribute('data-cid');
        var charm = null;
        for (var i = 0; i < (S.config.charms || []).length; i++) {
          if (S.config.charms[i].id === cid) { charm = S.config.charms[i]; break; }
        }
        if (!charm) return;

        var copy = { id: charm.id, name: charm.name, image: charm.image, price: charm.price, category: charm.category, engravable: charm.engravable };

        if (charm.engravable) {
          var eng = prompt('Enter engraving text for "' + charm.name + '" (max 15 characters):', '');
          if (eng !== null) copy.engraving = eng.slice(0, 15);
        }

        S.slots[S.active] = copy;

        // Auto-advance to next empty slot
        var max = S.config.maxSlots || 5;
        var next = -1;
        for (var i = S.active + 1; i < max; i++) {
          if (!S.slots[i]) { next = i; break; }
        }
        if (next < 0) {
          for (var i = 0; i < S.active; i++) {
            if (!S.slots[i]) { next = i; break; }
          }
        }
        S.active = next >= 0 ? next : null;

        syncCart();
        render();
      });
    });
  }

  // ─── CART SYNC ──────────────────────────────────────────
  function syncCart() {
    // Find form in Horizon (inside product-form custom element) or any theme
    var form = document.querySelector('product-form form') ||
               document.querySelector('form[action*="/cart/add"]');
    if (!form) return;

    // Remove old fields
    form.querySelectorAll('.cc-hidden').forEach(function (el) { el.remove(); });

    var filled = filledSlots();
    if (!filled.length) return;

    function addField(name, value) {
      var inp = document.createElement('input');
      inp.type = 'hidden';
      inp.name = name;
      inp.value = value;
      inp.className = 'cc-hidden';
      form.appendChild(inp);
    }

    filled.forEach(function (c, i) {
      addField('properties[Charm ' + (i + 1) + ']', c.name + (c.engraving ? ' — “' + c.engraving + '”' : ''));
    });
    addField('properties[Charm Extra]', fmt(totalExtra()));
    addField('properties[_charm_ids]', filled.map(function (c) { return c.id; }).join(','));
  }

  // ─── INJECT ─────────────────────────────────────────────
  function inject() {
    var styleEl = document.createElement('style');
    styleEl.id = 'cc-styles';
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    var div = document.createElement('div');
    div.id = 'cc-wrap';
    div.innerHTML = '<div class="cc-loading-wrap"><div class="cc-spinner"></div>Loading charm options…</div>';

    // Horizon: inject after <buy-buttons> element
    var target =
      document.querySelector('buy-buttons') ||
      document.querySelector('product-form') ||
      document.querySelector('.product-form') ||
      document.querySelector('form[action*="/cart/add"]');

    if (target) {
      target.insertAdjacentElement('afterend', div);
    } else {
      // Fallback: append to product container
      var container = document.querySelector('.product, .product-single, [data-section-type="product"], main');
      (container || document.body).appendChild(div);
    }
  }

  // ─── VARIANT WATCHER ────────────────────────────────────
  function watchVariants() {
    // Horizon + Dawn dispatch 'variant:change'
    document.addEventListener('variant:change', function (e) {
      if (e.detail && e.detail.variant) {
        S.variantTitle = e.detail.variant.title || '';
        S.slots = Array(S.config ? S.config.maxSlots : 5).fill(null);
        S.active = null;
        syncCart();
        render();
      }
    });
  }

  // ─── INIT ───────────────────────────────────────────────
  function start() {
    if (document.getElementById('cc-wrap')) return; // Already injected
    inject();

    fetch(API + '?product=' + encodeURIComponent(HANDLE))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        S.loading = false;
        if (data && data.configured) {
          S.config = data;
          S.slots = Array(data.maxSlots || 5).fill(null);
        } else {
          S.config = { configured: false };
        }
        render();
        watchVariants();
      })
      .catch(function () {
        S.loading = false;
        S.config = { configured: false };
        render();
      });
  }

  // Horizon uses custom elements that render async — wait a bit
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 400); });
  } else {
    setTimeout(start, 400);
  }
})();
