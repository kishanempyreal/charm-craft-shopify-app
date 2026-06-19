(function () {
  'use strict';

  const APP_URL = 'https://charmcraft-seven.vercel.app';
  const SHOP = window.Shopify?.shop || document.querySelector('[data-shop]')?.dataset?.shop || '';

  // Get current product handle from Shopify global
  const PRODUCT_HANDLE = window.ShopifyAnalytics?.meta?.product?.handle
    || document.querySelector('[data-product-handle]')?.dataset?.productHandle
    || window.location.pathname.split('/products/')[1]?.split('?')[0]
    || '';

  // Find where to inject the configurator (after the product form / add-to-cart section)
  function findProductFormContainer() {
    return (
      document.querySelector('[data-product-form]') ||
      document.querySelector('.product-form') ||
      document.querySelector('#product_form') ||
      document.querySelector('form[action="/cart/add"]') ||
      document.querySelector('.product__info-wrapper') ||
      document.querySelector('.product-single__meta')
    );
  }

  // State
  const state = {
    config: null,
    slots: [],
    selectedSlot: null,
    selectedVariantTitle: null,
    loading: true,
    adding: false,
  };

  function getActiveCharms() {
    if (!state.config) return [];
    const { variations, charms } = state.config;
    if (state.selectedVariantTitle && variations && variations.length > 0) {
      const varConfig = variations.find(function (v) {
        return v.variantTitle && v.variantTitle.toLowerCase() === state.selectedVariantTitle.toLowerCase();
      });
      if (varConfig && varConfig.charmIds && varConfig.charmIds.length > 0) {
        return charms.filter(function (c) { return varConfig.charmIds.includes(c.id); });
      }
    }
    return charms || [];
  }

  function getMaxSlots() {
    if (!state.config) return 5;
    const { variations } = state.config;
    if (state.selectedVariantTitle && variations && variations.length > 0) {
      const varConfig = variations.find(function (v) {
        return v.variantTitle && v.variantTitle.toLowerCase() === state.selectedVariantTitle.toLowerCase();
      });
      if (varConfig && varConfig.maxSlots) return varConfig.maxSlots;
    }
    return state.config.maxSlots || 5;
  }

  function fmt(price) {
    return '₹' + parseFloat(price).toLocaleString('en-IN');
  }

  function totalExtra() {
    return state.slots.filter(Boolean).reduce(function (s, c) { return s + (c && c.price ? c.price : 0); }, 0);
  }

  // Inject styles
  function injectStyles() {
    if (document.getElementById('cc-styles')) return;
    var style = document.createElement('style');
    style.id = 'cc-styles';
    style.textContent = [
      '#cc-configurator { margin-top: 24px; border-top: 2px solid #f0e6cc; padding-top: 24px; }',
      '#cc-configurator * { box-sizing: border-box; }',
      '.cc-config-title { font-size: 1rem; font-weight: 700; color: #3d2c00; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }',
      '.cc-config-title span { background: linear-gradient(135deg, #c9a84c, #f0d882); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }',
      '.cc-config-sub { font-size: 0.8rem; color: #888; margin-bottom: 14px; }',
      '.cc-slots-wrap { margin-bottom: 14px; }',
      '.cc-slots-label { font-size: 0.8rem; font-weight: 600; color: #555; margin-bottom: 8px; }',
      '.cc-slots { display: flex; flex-wrap: wrap; gap: 8px; }',
      '.cc-slot { width: 52px; height: 52px; border: 2px dashed #ccc; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; background: #fafafa; transition: all 0.15s; flex-shrink: 0; }',
      '.cc-slot:hover { border-color: #c9a84c; }',
      '.cc-slot.cc-active { border: 2px solid #c9a84c; box-shadow: 0 0 0 3px rgba(201,168,76,0.25); background: #fffbf0; }',
      '.cc-slot.cc-filled { border: 2px solid #c9a84c; background: #fff; }',
      '.cc-slot img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }',
      '.cc-slot-num { font-size: 0.7rem; color: #bbb; font-weight: 700; }',
      '.cc-slot-remove { position: absolute; top: -4px; right: -4px; width: 16px; height: 16px; background: #e53935; border: none; border-radius: 50%; color: white; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; line-height: 1; z-index: 1; }',
      '.cc-hint { font-size: 0.75rem; color: #aaa; font-style: italic; margin: 6px 0 12px; }',
      '.cc-charms-label { font-size: 0.8rem; font-weight: 600; color: #555; margin-bottom: 8px; }',
      '.cc-charms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 4px; }',
      '.cc-charms-grid::-webkit-scrollbar { width: 4px; }',
      '.cc-charms-grid::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }',
      '.cc-charm-item { border: 2px solid #eee; border-radius: 8px; padding: 8px 6px; cursor: pointer; text-align: center; transition: all 0.15s; background: #fff; }',
      '.cc-charm-item:hover { border-color: #c9a84c; transform: translateY(-1px); }',
      '.cc-charm-item.cc-disabled { opacity: 0.45; pointer-events: none; }',
      '.cc-charm-img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; margin: 0 auto 4px; display: block; background: #f5f5f5; }',
      '.cc-charm-img-ph { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #f5f5f5, #e0e0e0); margin: 0 auto 4px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }',
      '.cc-charm-name { font-size: 0.65rem; color: #444; font-weight: 600; line-height: 1.2; margin-bottom: 2px; }',
      '.cc-charm-price { font-size: 0.7rem; color: #c9a84c; font-weight: 700; }',
      '.cc-charm-badge { font-size: 0.55rem; padding: 1px 4px; border-radius: 3px; font-weight: 700; display: inline-block; margin-top: 2px; }',
      '.cc-badge-engrave { background: #e8f5e9; color: #388e3c; }',
      '.cc-badge-premium { background: #fff3e0; color: #f57c00; }',
      '.cc-extra-price { margin-top: 12px; padding: 10px 14px; background: #fffbf0; border: 1px solid #f0e6cc; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }',
      '.cc-extra-price strong { color: #c9a84c; font-size: 1rem; }',
      '.cc-loading { padding: 20px; text-align: center; color: #aaa; font-size: 0.85rem; }',
      '.cc-spinner-inline { width: 20px; height: 20px; border: 2px solid #eee; border-top-color: #c9a84c; border-radius: 50%; animation: cc-spin 0.7s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px; }',
      '@keyframes cc-spin { to { transform: rotate(360deg); } }',
      '.cc-empty { padding: 16px; text-align: center; color: #aaa; font-size: 0.8rem; border: 1px dashed #ddd; border-radius: 8px; }',
      '@media (max-width: 749px) { .cc-charms-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); max-height: 220px; } }',
    ].join('\n');
    document.head.appendChild(style);
  }

  // Create the configurator DOM
  function createContainer() {
    var container = document.createElement('div');
    container.id = 'cc-configurator';
    container.innerHTML = '<div class="cc-loading"><span class="cc-spinner-inline"></span>Loading charm options...</div>';
    return container;
  }

  function render() {
    var root = document.getElementById('cc-configurator');
    if (!root) return;

    if (state.loading) {
      root.innerHTML = '<div class="cc-loading"><span class="cc-spinner-inline"></span>Loading charm options...</div>';
      return;
    }

    if (!state.config || !state.config.configured) {
      root.innerHTML = '';
      return;
    }

    var maxSlots = getMaxSlots();
    var activeCharms = getActiveCharms();
    var filledSlots = state.slots.filter(Boolean).length;
    var extra = totalExtra();

    var slotsHtml = '';
    for (var i = 0; i < maxSlots; i++) {
      var s = state.slots[i];
      var isActive = state.selectedSlot === i;
      var isFilled = !!s;
      var innerHtml = '';
      if (isFilled) {
        innerHtml = (s.image
          ? '<img src="' + s.image + '" alt="' + s.name + '">'
          : '<div class="cc-charm-img-ph">✨</div>') +
          '<button class="cc-slot-remove" data-remove="' + i + '" title="Remove">×</button>';
      } else {
        innerHtml = '<span class="cc-slot-num">' + (i + 1) + '</span>';
      }
      slotsHtml += '<div class="cc-slot' + (isActive ? ' cc-active' : '') + (isFilled ? ' cc-filled' : '') + '" data-slot="' + i + '">' + innerHtml + '</div>';
    }

    var charmsHtml = '';
    if (activeCharms.length === 0) {
      charmsHtml = '<div class="cc-empty">No charms configured for this product.</div>';
    } else {
      var gridItems = '';
      for (var ci = 0; ci < activeCharms.length; ci++) {
        var c = activeCharms[ci];
        var imgHtml = c.image
          ? '<img class="cc-charm-img" src="' + c.image + '" alt="' + c.name + '">'
          : '<div class="cc-charm-img-ph">✨</div>';
        var badges = '';
        if (c.engravable) badges += '<span class="cc-charm-badge cc-badge-engrave">Engravable</span>';
        if (c.category === 'premium') badges += '<span class="cc-charm-badge cc-badge-premium">Premium</span>';
        gridItems += '<div class="cc-charm-item' + (state.selectedSlot === null ? ' cc-disabled' : '') + '" data-charm="' + c.id + '">' +
          imgHtml +
          '<div class="cc-charm-name">' + c.name + '</div>' +
          '<div class="cc-charm-price">' + fmt(c.price) + '</div>' +
          badges +
          '</div>';
      }
      charmsHtml = '<div class="cc-charms-grid" id="cc-charms-grid">' + gridItems + '</div>';
    }

    var extraHtml = '';
    if (extra > 0) {
      extraHtml = '<div class="cc-extra-price"><span>Charm addition: ' + filledSlots + ' charm' + (filledSlots !== 1 ? 's' : '') + '</span><strong>+ ' + fmt(extra) + '</strong></div>';
    }

    var hintText = state.selectedSlot !== null
      ? 'Slot ' + (state.selectedSlot + 1) + ' selected — click a charm below'
      : 'Click a slot to select it, then pick a charm';

    root.innerHTML =
      '<div class="cc-config-title"><span>✦</span> Customize with Charms</div>' +
      '<div class="cc-config-sub">Add up to ' + maxSlots + ' charms · Each charm priced separately</div>' +
      '<div class="cc-slots-wrap">' +
        '<div class="cc-slots-label">Your charm slots (' + filledSlots + '/' + maxSlots + ' filled):</div>' +
        '<div class="cc-slots" id="cc-slots-row">' + slotsHtml + '</div>' +
        '<div class="cc-hint">' + hintText + '</div>' +
      '</div>' +
      '<div class="cc-charms-label">Available charms (' + activeCharms.length + '):</div>' +
      charmsHtml +
      extraHtml;

    // Bind slot events
    root.querySelectorAll('.cc-slot').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var removeBtn = e.target.closest('[data-remove]');
        if (removeBtn) {
          var idx = parseInt(removeBtn.getAttribute('data-remove') || '0');
          state.slots[idx] = null;
          state.selectedSlot = null;
          render();
          updateCartHiddenFields();
          return;
        }
        var slotIdx = parseInt(el.dataset.slot || '0');
        state.selectedSlot = state.selectedSlot === slotIdx ? null : slotIdx;
        render();
      });
    });

    // Bind charm events
    root.querySelectorAll('.cc-charm-item').forEach(function (el) {
      el.addEventListener('click', function () {
        if (state.selectedSlot === null) return;
        var charmId = el.dataset.charm;
        var charm = getActiveCharms().find(function (c) { return c.id === charmId; });
        if (!charm) return;
        var engraving = '';
        if (charm.engravable) {
          var text = prompt('Enter engraving text for "' + charm.name + '" (max 15 chars):', '');
          engraving = (text || '').slice(0, 15);
        }
        state.slots[state.selectedSlot] = Object.assign({}, charm, { engraving: engraving });
        // Move to next empty slot
        var currentSlot = state.selectedSlot;
        var next = -1;
        for (var ni = currentSlot + 1; ni < state.slots.length; ni++) {
          if (!state.slots[ni]) { next = ni; break; }
        }
        state.selectedSlot = next >= 0 ? next : null;
        render();
        updateCartHiddenFields();
      });
    });
  }

  // Update hidden form fields so charm data goes with the Add to Cart
  function updateCartHiddenFields() {
    var form = document.querySelector('form[action="/cart/add"]');
    if (!form) return;

    form.querySelectorAll('.cc-hidden-field').forEach(function (el) { el.remove(); });

    var filled = state.slots.filter(Boolean);
    if (filled.length === 0) return;

    var charmSummary = filled.map(function (c, i) {
      return (i + 1) + '. ' + c.name + (c.engraving ? ' ("' + c.engraving + '")' : '') + ' +₹' + c.price;
    }).join(' | ');

    function addHidden(name, value) {
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      input.className = 'cc-hidden-field';
      form.appendChild(input);
    }

    addHidden('properties[_charms]', charmSummary);
    addHidden('properties[_charm_count]', String(filled.length));
    addHidden('properties[_charm_extra_price]', String(totalExtra()));

    filled.forEach(function (c, i) {
      addHidden('properties[Charm ' + (i + 1) + ']', c.name + (c.engraving ? ' — "' + c.engraving + '"' : ''));
    });
  }

  // Watch for variant changes
  function watchVariantChanges() {
    document.querySelectorAll('[name="id"], select[name="id"]').forEach(function (el) {
      el.addEventListener('change', function () {
        var selectedOption = el.querySelector('option:checked') || el;
        var variantTitle = (selectedOption.dataset && selectedOption.dataset.variantTitle)
          || (document.querySelector('.product-form__selected-variant') && document.querySelector('.product-form__selected-variant').textContent)
          || '';
        state.selectedVariantTitle = variantTitle;
        state.slots = [];
        state.selectedSlot = null;
        render();
      });
    });

    // Also watch Shopify variant change events
    document.addEventListener('variant:change', function (e) {
      state.selectedVariantTitle = (e.detail && e.detail.variant && e.detail.variant.title) || '';
      state.slots = [];
      state.selectedSlot = null;
      render();
    });
  }

  function init() {
    if (!PRODUCT_HANDLE) return;

    injectStyles();

    // Wait for DOM
    setTimeout(function () {
      var container = createContainer();
      var formContainer = findProductFormContainer();
      if (formContainer) {
        formContainer.parentNode && formContainer.parentNode.insertBefore(container, formContainer.nextSibling);
      } else {
        var product = document.querySelector('.product');
        if (product) {
          product.appendChild(container);
        } else {
          document.body.appendChild(container);
        }
      }

      render();

      // Fetch charm config from App Proxy
      var shop = (window.__charmcraft && window.__charmcraft.shop) ? window.__charmcraft.shop : SHOP;
      var handle = (window.__charmcraft && window.__charmcraft.productHandle) ? window.__charmcraft.productHandle : PRODUCT_HANDLE;
      var proxyUrl = '/apps/charmcraft/charm-config?product=' + encodeURIComponent(handle) + '&shop=' + encodeURIComponent(shop);

      fetch(proxyUrl)
        .then(function (res) { return res.json(); })
        .then(function (config) {
          state.config = config;
          state.slots = new Array(config.maxSlots || 5).fill(null);
          state.loading = false;
          render();
          watchVariantChanges();
          updateCartHiddenFields();
        })
        .catch(function () {
          state.config = { configured: false };
          state.loading = false;
          render();
        });
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
