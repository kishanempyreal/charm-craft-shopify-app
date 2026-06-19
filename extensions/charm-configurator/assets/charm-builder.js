/* Charm Craft Builder v4 — B&W Popup */
(function () {
  'use strict';

  var API    = (window.__charmcraft && window.__charmcraft.appUrl) || 'https://charmcraft-seven.vercel.app/api';
  var SHOP   = (window.__charmcraft && window.__charmcraft.shop)   || location.hostname;
  var HANDLE = (window.__charmcraft && window.__charmcraft.productHandle)
               || (location.pathname.match(/\/products\/([^/?#]+)/) || [])[1] || '';
  if (!HANDLE) return;

  // ── STATE ──────────────────────────────────────────────────────────────────
  var S = {
    product : null,   // Shopify /products/HANDLE.js
    config  : null,   // Our proxy API response
    variant : null,   // Selected variant object
    slots   : [],     // Array of charm objects (null = empty)
    active  : null,   // Currently selected slot index
    cat     : 'all',  // Category tab filter
    loaded  : false,
  };

  // ── CSS ────────────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('cc-css')) return;
    var s = document.createElement('style');
    s.id = 'cc-css';
    s.textContent = [
      /* ─── hide Shopify default controls ─── */
      'variant-selects,variant-radios{display:none!important}',
      '.shopify-payment-button{display:none!important}',
      '.product-form__submit{display:none!important}',

      /* ─── trigger ─── */
      '.cc-wrap{margin:16px 0}',
      '.cc-btn{width:100%;padding:15px 20px;border:2px solid #000;border-radius:10px;background:#000;color:#fff;font-size:1rem;font-weight:700;cursor:pointer;letter-spacing:.03em;font-family:inherit;transition:background .14s,color .14s;display:flex;align-items:center;justify-content:center;gap:10px}',
      '.cc-btn:hover{background:#222}',

      /* ─── overlay ─── */
      '#cc-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:999999;align-items:center;justify-content:center;padding:60px}',
      '@media(max-width:900px){#cc-ov{padding:15px}}',
      '#cc-ov.open{display:flex}',

      /* ─── loader ─── */
      '#cc-ldr{display:flex;flex-direction:column;align-items:center;gap:14px}',
      '.cc-spin{width:38px;height:38px;border:3px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:cc-r .7s linear infinite}',
      '@keyframes cc-r{to{transform:rotate(360deg)}}',
      '#cc-ldr p{color:#fff;font-size:.85rem;font-weight:600;letter-spacing:.05em;margin:0}',

      /* ─── modal ─── */
      '#cc-m{display:none;background:#fff;border-radius:10px;width:100%;max-width:1000px;max-height:100%;flex-direction:column;overflow:hidden;animation:cc-in .22s ease}',
      '#cc-m.go{display:flex}',
      '@keyframes cc-in{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}',

      /* ─── header ─── */
      '.cc-hd{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #e8e8e8;flex-shrink:0}',
      '.cc-hd-t{font-size:.95rem;font-weight:700;color:#000}',
      '.cc-hd-r{display:flex;align-items:center;gap:8px}',
      '.cc-icon-btn{width:36px;height:36px;border:1.5px solid #e0e0e0;border-radius:10px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.95rem;transition:background .12s,border-color .12s;font-family:inherit}',
      '.cc-icon-btn:hover{background:#f5f5f5;border-color:#bbb}',
      '.cc-icon-btn.close:hover{background:#000;color:#fff;border-color:#000}',

      /* ─── body ─── */
      '.cc-body{display:grid;grid-template-columns:420px 1fr;flex:1;overflow:hidden;min-height:0}',
      '@media(max-width:780px){.cc-body{grid-template-columns:1fr;overflow-y:auto}}',

      /* ─── left panel ─── */
      '.cc-left{background:#f9f9f9;border-right:1px solid #e8e8e8;display:flex;flex-direction:column;align-items:center;padding:24px 20px 16px;gap:14px;overflow-y:auto}',
      '@media(max-width:780px){.cc-left{border-right:none;border-bottom:1px solid #e8e8e8;padding:16px}}',

      /* product image with slot circles */
      '.cc-imgw{position:relative;width:100%;max-width:340px;border-radius:10px;overflow:hidden;background:#efefef;aspect-ratio:1;user-select:none;flex-shrink:0}',
      '.cc-imgw img{width:100%;height:100%;object-fit:cover;display:block}',

      /* slot circles on image */
      '.cc-sdot{position:absolute;width:44px;height:44px;border-radius:50%;border:2.5px dashed #ccc;background:rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);cursor:pointer;transition:border .12s,box-shadow .12s,transform .12s;overflow:hidden;font-size:.75rem;font-weight:700;color:#999;z-index:5}',
      '.cc-sdot:hover{border-color:#000;box-shadow:0 0 0 4px rgba(0,0,0,.08)}',
      '.cc-sdot.active{border:2.5px solid #000;box-shadow:0 0 0 5px rgba(0,0,0,.12);transform:translate(-50%,-50%) scale(1.12);background:#fff}',
      '.cc-sdot.filled{border:2.5px solid #000}',
      '.cc-sdot img{width:100%;height:100%;object-fit:cover;border-radius:50%}',
      '.cc-srm{position:absolute;top:-2px;right:-2px;width:16px;height:16px;background:#000;color:#fff;border-radius:50%;border:none;font-size:8px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:6;line-height:1}',

      /* fallback slot buttons (no positions configured) */
      '.cc-slots-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
      '.cc-sbtn{width:48px;height:48px;border-radius:50%;border:2px dashed #ccc;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.75rem;font-weight:700;color:#aaa;transition:all .12s;overflow:hidden;position:relative;font-family:inherit}',
      '.cc-sbtn:hover{border-color:#000}',
      '.cc-sbtn.active{border:2px solid #000;box-shadow:0 0 0 4px rgba(0,0,0,.1)}',
      '.cc-sbtn.filled{border:2px solid #000}',
      '.cc-sbtn img{width:100%;height:100%;object-fit:cover;border-radius:50%}',

      /* ─── right panel ─── */
      '.cc-right{display:flex;flex-direction:column;overflow:hidden}',
      '@media(max-width:780px){.cc-right{overflow:visible}}',
      '.cc-scroll{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:18px}',
      '.cc-scroll::-webkit-scrollbar{width:4px}',
      '.cc-scroll::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}',
      '@media(max-width:780px){.cc-scroll{overflow:visible;padding:16px 16px 110px}}',

      /* product info */
      '.cc-pname{font-size:1.05rem;font-weight:700;color:#000;line-height:1.3;margin:0}',
      '.cc-pprice{font-size:1.4rem;font-weight:700;color:#000;margin:4px 0 0}',
      '.cc-pdesc{font-size:.82rem;color:#555;line-height:1.6;margin:6px 0 0}',

      /* variant pills */
      '.cc-vlabel{font-size:.68rem;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.07em;margin:0 0 5px}',
      '.cc-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px}',
      '.cc-pill{padding:6px 14px;border-radius:10px;border:1.5px solid #e0e0e0;background:#fff;color:#444;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .12s;font-family:inherit}',
      '.cc-pill:hover{border-color:#000;color:#000}',
      '.cc-pill.on{border-color:#000;background:#000;color:#fff}',

      /* charm section */
      '.cc-slbl{font-size:.68rem;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.07em;margin:0 0 8px}',

      /* tabs */
      '.cc-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}',
      '.cc-tab{padding:5px 12px;border-radius:20px;border:1.5px solid #e0e0e0;background:#fff;color:#666;font-size:.73rem;font-weight:600;cursor:pointer;transition:all .12s;font-family:inherit;text-transform:capitalize}',
      '.cc-tab:hover{border-color:#000;color:#000}',
      '.cc-tab.on{border-color:#000;background:#000;color:#fff}',

      /* hint */
      '.cc-hint{padding:12px;border:1.5px dashed #e0e0e0;border-radius:10px;text-align:center;font-size:.8rem;color:#aaa}',

      /* charm grid */
      '.cc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:8px}',
      '.cc-card{border:1.5px solid #e8e8e8;border-radius:10px;padding:10px 6px 8px;cursor:pointer;text-align:center;background:#fff;transition:border-color .12s,box-shadow .12s;position:relative}',
      '.cc-card:hover{border-color:#000;box-shadow:0 2px 10px rgba(0,0,0,.08)}',
      '.cc-card.dim{opacity:.3;pointer-events:none}',
      '.cc-card.picked{border-color:#000;background:#f5f5f5}',
      '.cc-card img{width:48px;height:48px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 5px;background:#f0f0f0}',
      '.cc-cico{width:48px;height:48px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin:0 auto 5px}',
      '.cc-cname{font-size:.62rem;font-weight:600;color:#222;line-height:1.3}',
      '.cc-cprice{font-size:.68rem;color:#777;margin-top:2px;font-weight:700}',
      '.cc-cchk{position:absolute;top:5px;right:5px;width:16px;height:16px;background:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;font-weight:900}',

      /* ─── footer ─── */
      '.cc-ft{padding:14px 20px;border-top:1px solid #e8e8e8;background:#fff;flex-shrink:0;display:flex;flex-direction:column;gap:10px}',
      '@media(max-width:780px){.cc-ft{position:fixed;bottom:0;left:0;right:0;z-index:10}}',
      '.cc-pr{display:flex;justify-content:space-between;align-items:baseline}',
      '.cc-prl{font-size:.75rem;color:#888}',
      '.cc-prv{font-size:1.2rem;font-weight:700;color:#000}',
      '.cc-ftbtns{display:flex;gap:8px}',
      '.cc-atc{flex:1;padding:13px;border:none;border-radius:10px;background:#000;color:#fff;font-size:.92rem;font-weight:700;cursor:pointer;font-family:inherit;transition:background .14s;display:flex;align-items:center;justify-content:center;gap:8px}',
      '.cc-atc:hover{background:#222}',
      '.cc-atc:disabled{opacity:.4;cursor:not-allowed}',
      '.cc-save{padding:13px 16px;border-radius:10px;border:1.5px solid #000;background:#fff;color:#000;font-size:.85rem;font-weight:700;cursor:pointer;font-family:inherit;transition:background .14s,color .14s;white-space:nowrap}',
      '.cc-save:hover{background:#000;color:#fff}',

      /* mini spinner */
      '.cc-spsm{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:cc-r .6s linear infinite;display:inline-block}',

      /* toast */
      '.cc-toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:10px 20px;border-radius:10px;font-size:.83rem;font-weight:600;z-index:9999999;pointer-events:none;animation:cc-tb .3s ease,cc-tf 1.2s ease 2s forwards}',
      '@keyframes cc-tb{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}',
      '@keyframes cc-tf{to{opacity:0}}',

      /* success */
      '.cc-succ{position:absolute;inset:0;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:20;border-radius:10px;animation:cc-si .25s ease}',
      '@keyframes cc-si{from{opacity:0}to{opacity:1}}',
      '.cc-succ-ico{font-size:2.5rem}',
      '.cc-succ-t{font-size:1.1rem;font-weight:700;color:#000}',
      '.cc-succ-s{font-size:.83rem;color:#777}',
      '.cc-succ-bs{display:flex;gap:10px;margin-top:4px}',
      '.cc-succ-v{padding:11px 20px;border-radius:10px;background:#000;color:#fff;border:none;font-size:.85rem;font-weight:700;cursor:pointer;text-decoration:none;font-family:inherit}',
      '.cc-succ-c{padding:11px 20px;border-radius:10px;border:1.5px solid #e0e0e0;background:#fff;color:#555;font-size:.85rem;font-weight:600;cursor:pointer;font-family:inherit}',

      /* load-saved banner */
      '.cc-restore{background:#f5f5f5;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:.8rem;color:#333}',
      '.cc-restore button{padding:6px 12px;border-radius:8px;border:1.5px solid #000;background:#000;color:#fff;font-size:.75rem;font-weight:700;cursor:pointer;font-family:inherit}',
    ].join('');
    document.head.appendChild(s);
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmt(n) { return '₹' + parseFloat(n || 0).toLocaleString('en-IN'); }
  function filled()    { return S.slots.filter(Boolean); }
  function maxSlots()  { return (S.config && S.config.maxSlots) || 5; }
  function positions() { return (S.config && Array.isArray(S.config.slotPositions) && S.config.slotPositions.length) ? S.config.slotPositions : []; }

  function basePrice() {
    if (S.variant) return parseFloat(S.variant.price) || 0;
    return S.product ? parseFloat((S.product.variants[0] || {}).price || 0) : 0;
  }
  function charmExtra() { return S.slots.reduce(function(a,c){ return a+(c?parseFloat(c.price)||0:0); },0); }
  function totalPrice() { return basePrice() + charmExtra(); }

  // ── BUILD POPUP DOM ────────────────────────────────────────────────────────
  function buildPopup() {
    if (document.getElementById('cc-ov')) return;
    var ov = document.createElement('div');
    ov.id = 'cc-ov';
    ov.innerHTML =
      '<div id="cc-ldr"><div class="cc-spin"></div><p>Loading your customizer…</p></div>' +
      '<div id="cc-m">' +
        '<div class="cc-hd">' +
          '<div class="cc-hd-t">Build Your Necklace</div>' +
          '<div class="cc-hd-r">' +
            '<button class="cc-icon-btn" id="cc-sh" title="Share design">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>' +
            '</button>' +
            '<button class="cc-icon-btn close" id="cc-xb">✕</button>' +
          '</div>' +
        '</div>' +
        '<div class="cc-body">' +
          '<div class="cc-left" id="cc-left"></div>' +
          '<div class="cc-right">' +
            '<div class="cc-scroll" id="cc-scroll"></div>' +
            '<div class="cc-ft">' +
              '<div class="cc-pr"><span class="cc-prl">Total price</span><span class="cc-prv" id="cc-tot">₹0</span></div>' +
              '<div class="cc-ftbtns">' +
                '<button class="cc-atc" id="cc-atc" disabled>Add to Cart</button>' +
                '<button class="cc-save" id="cc-sav">Save Design</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    ov.addEventListener('click', function(e){ if(e.target===ov) doClose(); });
    document.getElementById('cc-xb').addEventListener('click', doClose);
    document.getElementById('cc-sh').addEventListener('click', doShare);
    document.getElementById('cc-atc').addEventListener('click', doCart);
    document.getElementById('cc-sav').addEventListener('click', doSave);
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') doClose(); });
  }

  function doOpen() {
    var ov = document.getElementById('cc-ov');
    if (!ov) { buildPopup(); ov = document.getElementById('cc-ov'); }
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (S.loaded) revealModal();
  }

  function doClose() {
    var ov = document.getElementById('cc-ov');
    if (ov) ov.classList.remove('open');
    document.body.style.overflow = '';
  }

  function revealModal() {
    var ldr = document.getElementById('cc-ldr');
    var m   = document.getElementById('cc-m');
    if (ldr) ldr.style.display = 'none';
    if (m && !m.classList.contains('go')) {
      m.classList.add('go');
      renderLeft();
      renderRight();
      updatePrice();
    }
  }

  // ── LEFT PANEL ─────────────────────────────────────────────────────────────
  function renderLeft() {
    var el = document.getElementById('cc-left');
    if (!el) return;

    var pos  = positions();
    var max  = maxSlots();
    var img  = getVariantImage() || (S.config && S.config.productImage) || (S.product && S.product.featured_image) || '';
    var html = '';

    // Main image with slot circles
    html += '<div class="cc-imgw" id="cc-imgw">';
    if (img) html += '<img src="' + esc(img) + '" alt="" id="cc-mimg" onerror="this.style.display=\'none\'">';
    else html += '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:.85rem">No image</div>';

    if (pos.length > 0) {
      for (var i = 0; i < pos.length; i++) {
        var ch  = S.slots[i];
        var cls = 'cc-sdot' + (S.active===i?' active':'') + (ch?' filled':'');
        html += '<div class="' + cls + '" data-slot="' + i + '" style="left:' + (pos[i].x*100) + '%;top:' + (pos[i].y*100) + '%">';
        if (ch) {
          if (ch.image) html += '<img src="' + esc(ch.image) + '" alt="">';
          else          html += '<div style="font-size:.9rem">✨</div>';
          html += '<button class="cc-srm" data-rm="' + i + '">✕</button>';
        } else {
          html += (i+1);
        }
        html += '</div>';
      }
    }
    html += '</div>';

    // Fallback slot row (no positions)
    if (pos.length === 0) {
      html += '<div class="cc-slots-row">';
      for (var j = 0; j < max; j++) {
        var c2  = S.slots[j];
        var cl2 = 'cc-sbtn' + (S.active===j?' active':'') + (c2?' filled':'');
        html += '<button class="' + cl2 + '" data-slot="' + j + '">';
        if (c2 && c2.image) html += '<img src="' + esc(c2.image) + '" alt="">';
        else if (c2)        html += '✨';
        else                html += (j+1);
        html += '</button>';
      }
      html += '</div>';
      html += '<div style="font-size:.75rem;color:#aaa;text-align:center">' +
        (S.active!==null ? 'Slot '+(S.active+1)+' selected — pick a charm →' : 'Tap a slot, then pick a charm') +
      '</div>';
    } else if (S.active === null) {
      html += '<div style="font-size:.75rem;color:#aaa;text-align:center">Tap a circle on the image to select a slot</div>';
    }

    el.innerHTML = html;

    el.querySelectorAll('[data-slot],[data-rm]').forEach(function(b){
      b.addEventListener('click', function(e){
        var rm = e.target.closest('[data-rm]');
        if (rm) {
          var ri = parseInt(rm.dataset.rm);
          S.slots[ri] = null;
          if (S.active === ri) S.active = null;
          renderLeft(); renderCharmGrid(); updatePrice(); return;
        }
        var si = parseInt(b.dataset.slot);
        S.active = (S.active === si) ? null : si;
        renderLeft(); renderCharmGrid();
      });
    });
  }

  // ── RIGHT PANEL ────────────────────────────────────────────────────────────
  function renderRight() {
    var el = document.getElementById('cc-scroll');
    if (!el || !S.product) return;

    var html = '';

    // Product info
    html += '<div>';
    html += '<p class="cc-pname">' + esc(S.product.title) + '</p>';
    html += '<p class="cc-pprice" id="cc-bprice">' + fmt(basePrice()) + '</p>';
    if (S.product.description) {
      var d = S.product.description.replace(/<[^>]+>/g,'').trim();
      if (d) html += '<p class="cc-pdesc">' + esc(d.slice(0,160)) + (d.length>160?'…':'') + '</p>';
    }
    html += '</div>';

    // Variant picker
    if (S.product.options && !(S.product.options.length===1 && S.product.options[0].name==='Title')) {
      S.product.options.forEach(function(opt, oi){
        html += '<div>';
        html += '<div class="cc-vlabel">' + esc(opt.name) + '</div>';
        html += '<div class="cc-pills">';
        (opt.values||[]).forEach(function(val){
          var on = S.variant && S.variant['option'+(oi+1)]===val;
          html += '<button class="cc-pill'+(on?' on':'')+'" data-opt="'+esc(opt.name)+'" data-val="'+esc(val)+'">'+esc(val)+'</button>';
        });
        html += '</div></div>';
      });
    }

    // Charm section
    html += '<div id="cc-csec"></div>';

    el.innerHTML = html;

    el.querySelectorAll('.cc-pill').forEach(function(b){
      b.addEventListener('click', function(){ pickOption(b.dataset.opt, b.dataset.val); });
    });

    // Saved design banner
    var saved = getSavedDesign();
    if (saved) {
      var banner = document.createElement('div');
      banner.className = 'cc-restore';
      banner.innerHTML = '<span>You have a saved design for this product.</span><button id="cc-rload">Load it</button>';
      el.insertBefore(banner, el.firstChild);
      banner.querySelector('#cc-rload').addEventListener('click', function(){
        loadDesignData(saved);
        banner.remove();
      });
    }

    renderCharmGrid();
  }

  function renderCharmGrid() {
    var el = document.getElementById('cc-csec');
    if (!el || !S.config) return;

    var all  = (S.config.charms || []);
    var cats = ['all'];
    all.forEach(function(c){ if(cats.indexOf(c.category)<0) cats.push(c.category); });
    var vis  = S.cat==='all' ? all : all.filter(function(c){ return c.category===S.cat; });

    var html = '';
    html += '<div class="cc-slbl">Choose Charms</div>';

    // Tabs
    html += '<div class="cc-tabs">';
    cats.forEach(function(cat){
      var n = cat==='all' ? all.length : all.filter(function(c){ return c.category===cat; }).length;
      html += '<button class="cc-tab'+(S.cat===cat?' on':'')+'" data-cat="'+esc(cat)+'">'+
        (cat==='all'?'All':cat.charAt(0).toUpperCase()+cat.slice(1))+' ('+n+')</button>';
    });
    html += '</div>';

    // Slot hint or grid
    if (S.active===null) {
      html += '<div class="cc-hint">Select a slot first, then pick a charm</div>';
    } else if (!vis.length) {
      html += '<div class="cc-hint">No charms in this category</div>';
    } else {
      html += '<div class="cc-grid">';
      vis.forEach(function(c){
        var picked = S.slots.some(function(s){ return s&&s.id===c.id; });
        var img    = c.image ? '<img src="'+esc(c.image)+'" alt="" loading="lazy">' : '<div class="cc-cico">✨</div>';
        var price  = parseFloat(c.price)===0 ? 'Free' : fmt(c.price);
        html += '<div class="cc-card'+(picked?' picked':'')+'" data-cid="'+esc(c.id)+'">';
        html += img;
        html += '<div class="cc-cname">'+esc(c.name)+'</div>';
        html += '<div class="cc-cprice">'+price+'</div>';
        if (picked) html += '<div class="cc-cchk">✓</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    el.innerHTML = html;

    el.querySelectorAll('.cc-tab').forEach(function(b){
      b.addEventListener('click', function(){ S.cat = b.dataset.cat; renderCharmGrid(); });
    });

    el.querySelectorAll('.cc-card').forEach(function(card){
      card.addEventListener('click', function(){
        if (S.active===null) return;
        var charm = all.find(function(c){ return c.id===card.dataset.cid; });
        if (!charm) return;
        S.slots[S.active] = { id:charm.id, name:charm.name, image:charm.image||'', price:parseFloat(charm.price)||0, engravable:charm.engravable };
        // advance to next empty slot
        var max = maxSlots(), nx=-1;
        for (var i=S.active+1;i<max;i++) { if(!S.slots[i]){nx=i;break;} }
        if (nx<0) for (var i=0;i<S.active;i++) { if(!S.slots[i]){nx=i;break;} }
        S.active = nx>=0?nx:null;
        renderLeft(); renderCharmGrid(); updatePrice();
      });
    });
  }

  function updatePrice() {
    var el = document.getElementById('cc-tot');
    if (el) el.textContent = fmt(totalPrice());
    var bp = document.getElementById('cc-bprice');
    if (bp) bp.textContent = fmt(basePrice());
    var atc = document.getElementById('cc-atc');
    if (atc) atc.disabled = false;
  }

  // ── VARIANT ────────────────────────────────────────────────────────────────
  function pickOption(name, val) {
    if (!S.product) return;
    var opts = {};
    if (S.variant) {
      S.product.options.forEach(function(o,i){ opts[o.name]=S.variant['option'+(i+1)]; });
    }
    opts[name] = val;
    var match = (S.product.variants||[]).find(function(v){
      return S.product.options.every(function(o,i){ return v['option'+(i+1)]===opts[o.name]; });
    });
    S.variant = match || S.product.variants[0];
    // Swap image
    var vi = getVariantImage();
    var im = document.getElementById('cc-mimg');
    if (im && vi) im.src = vi;
    renderRight(); updatePrice();
  }

  function getVariantImage() {
    return S.variant && S.variant.featured_image ? (S.variant.featured_image.src||'') : '';
  }

  // ── CANVAS ─────────────────────────────────────────────────────────────────
  function buildCanvas(cb) {
    var W=600, H=600;
    var cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    var ctx=cv.getContext('2d');
    var src=getVariantImage()||(S.config&&S.config.productImage)||(S.product&&S.product.featured_image)||'';
    var pos=positions(), max=maxSlots();

    function drawSlots() {
      var pend=0;
      function done(){ if(--pend<=0) cb(cv.toDataURL('image/png')); }

      for (var i=0;i<max;i++) {
        var ch=S.slots[i];
        var px,py;
        if (pos[i]) { px=pos[i].x*W; py=pos[i].y*H; }
        else { var sp=W/(max+1); px=sp*(i+1); py=H*0.82; }

        ctx.beginPath(); ctx.arc(px,py,30,0,Math.PI*2);
        ctx.fillStyle=ch?'#fff':'rgba(240,240,240,0.9)'; ctx.fill();
        ctx.strokeStyle='#000'; ctx.lineWidth=2.5; ctx.stroke();

        if (ch&&ch.image) {
          pend++;
          (function(cx,cy,isrc){
            var img=new Image(); img.crossOrigin='anonymous';
            img.onload=function(){
              ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,27,0,Math.PI*2); ctx.clip();
              ctx.drawImage(img,cx-27,cy-27,54,54); ctx.restore(); done();
            };
            img.onerror=function(){ done(); };
            img.src=isrc;
          })(px,py,ch.image);
        } else {
          ctx.fillStyle=ch?'#555':'rgba(0,0,0,0.3)'; ctx.font='600 15px sans-serif';
          ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(ch?'✨':String(i+1),px,py);
        }
      }
      if (!pend) cb(cv.toDataURL('image/png'));
    }

    if (src) {
      var bg=new Image(); bg.crossOrigin='anonymous';
      bg.onload=function(){ ctx.drawImage(bg,0,0,W,H); drawSlots(); };
      bg.onerror=function(){ ctx.fillStyle='#f5f5f5'; ctx.fillRect(0,0,W,H); drawSlots(); };
      bg.src=src;
    } else {
      ctx.fillStyle='#f5f5f5'; ctx.fillRect(0,0,W,H); drawSlots();
    }
  }

  // ── CART ───────────────────────────────────────────────────────────────────
  function doCart() {
    if (!S.variant && S.product) S.variant = S.product.variants[0];
    if (!S.variant) return toast('Please select a variant first');
    var atc = document.getElementById('cc-atc');
    atc.disabled=true; atc.innerHTML='<div class="cc-spsm"></div> Adding…';

    var props={};
    S.slots.forEach(function(ch,i){ if(ch) props['Charm '+(i+1)]=ch.name+(ch.price>0?' (+'+fmt(ch.price)+')':' (Free)'); });
    if (!filled().length) props['Charms']='No charms added';

    buildCanvas(function(img){
      props['_design_preview']='Charm Craft Design';
      fetch('/cart/add.js',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id:S.variant.id, quantity:1, properties:props }),
      })
      .then(function(r){ if(!r.ok) throw 0; return r.json(); })
      .then(function(){ showSuccess(); })
      .catch(function(){ toast('Could not add to cart. Please try again.'); atc.disabled=false; atc.textContent='Add to Cart'; });
    });
  }

  function showSuccess() {
    var m=document.getElementById('cc-m'); if(!m) return;
    var d=document.createElement('div'); d.className='cc-succ';
    d.innerHTML='<div class="cc-succ-ico">🛍️</div><div class="cc-succ-t">Added to cart!</div>'+
      '<div class="cc-succ-s">Your custom necklace has been added.</div>'+
      '<div class="cc-succ-bs">'+
        '<a class="cc-succ-v" href="/cart">View Cart</a>'+
        '<button class="cc-succ-c" id="cc-cont">Continue</button>'+
      '</div>';
    m.appendChild(d);
    d.querySelector('#cc-cont').addEventListener('click',function(){
      d.remove();
      S.slots=new Array(maxSlots()).fill(null); S.active=null;
      renderLeft(); renderRight(); updatePrice();
      document.getElementById('cc-atc').disabled=false;
      document.getElementById('cc-atc').textContent='Add to Cart';
    });
  }

  // ── SAVE ───────────────────────────────────────────────────────────────────
  function doSave() {
    var data={handle:HANDLE,variantId:S.variant?S.variant.id:null,slots:S.slots.map(function(c,i){return c?{slot:i,charmId:c.id,charmName:c.name}:null;}).filter(Boolean)};
    localStorage.setItem('cc_design_'+HANDLE, JSON.stringify(data));

    buildCanvas(function(img){
      fetch((window.__charmcraft&&window.__charmcraft.appUrl||'https://charmcraft-seven.vercel.app')+'/api/designs',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ shop:SHOP, name:(S.product&&S.product.title)||'My Design', designData:data, canvasData:img }),
      })
      .then(function(r){return r.json();})
      .then(function(d){ if(d.shareToken) localStorage.setItem('cc_token_'+HANDLE,d.shareToken); toast('Design saved ✓'); })
      .catch(function(){ toast('Saved locally ✓'); });
    });
  }

  function getSavedDesign() {
    try { var d=localStorage.getItem('cc_design_'+HANDLE); return d?JSON.parse(d):null; } catch(e){ return null; }
  }

  function loadDesignData(data) {
    if (!S.config||!data.slots) return;
    S.slots=new Array(maxSlots()).fill(null);
    data.slots.forEach(function(entry){
      var charm=(S.config.charms||[]).find(function(c){return c.id===entry.charmId;});
      if(charm&&entry.slot<maxSlots()) S.slots[entry.slot]={id:charm.id,name:charm.name,image:charm.image||'',price:parseFloat(charm.price)||0};
    });
    if (data.variantId&&S.product) {
      var v=(S.product.variants||[]).find(function(v){return String(v.id)===String(data.variantId);});
      if(v) S.variant=v;
    }
    renderLeft(); renderRight(); updatePrice();
  }

  // ── SHARE ──────────────────────────────────────────────────────────────────
  function doShare() {
    var p=new URLSearchParams();
    var ids=S.slots.map(function(c){return c?c.id:'';}).join(',');
    if(ids.replace(/,/g,'')) p.set('cc_charms',ids);
    if(S.variant) p.set('cc_v',S.variant.id);
    p.set('cc_open','1');
    var url=location.origin+location.pathname+'?'+p.toString();
    if(navigator.clipboard&&navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function(){ toast('Share link copied ✓'); }).catch(function(){ prompt('Copy link:',url); });
    } else { prompt('Copy link:',url); }
  }

  // ── TOAST ──────────────────────────────────────────────────────────────────
  function toast(msg) {
    var t=document.createElement('div'); t.className='cc-toast'; t.textContent=msg;
    document.body.appendChild(t); setTimeout(function(){t.remove();},3400);
  }

  // ── TRIGGER BUTTON ─────────────────────────────────────────────────────────
  function injectTrigger() {
    if (document.querySelector('.cc-wrap')) return;
    var target =
      document.querySelector('[id*="buy-button"]') ||
      document.querySelector('.product-form__buttons') ||
      document.querySelector('.product-form') ||
      document.querySelector('form[action*="/cart/add"]');

    var wrap=document.createElement('div'); wrap.className='cc-wrap';
    wrap.innerHTML='<button class="cc-btn" id="cc-trigger">'+
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 12 2 12 2"/><path d="M8 12a4 4 0 1 0 8 0"/><circle cx="12" cy="12" r="1"/></svg>'+
      'Build Your Necklace</button>';

    if (target) target.insertAdjacentElement('afterend', wrap);
    else (document.querySelector('main')||document.body).appendChild(wrap);

    document.getElementById('cc-trigger').addEventListener('click', doOpen);
  }

  // ── RESTORE FROM URL ───────────────────────────────────────────────────────
  function restoreURL() {
    var p=new URLSearchParams(location.search);
    if(p.get('cc_open')!=='1') return;

    var charmParam=p.get('cc_charms'), varId=p.get('cc_v');
    if(charmParam&&S.config) {
      var ids=charmParam.split(',');
      ids.forEach(function(cid,i){
        if(!cid) return;
        var charm=(S.config.charms||[]).find(function(c){return c.id===cid;});
        if(charm&&i<maxSlots()) S.slots[i]={id:charm.id,name:charm.name,image:charm.image||'',price:parseFloat(charm.price)||0};
      });
    }
    if(varId&&S.product) {
      var v=(S.product.variants||[]).find(function(v){return String(v.id)===String(varId);});
      if(v) S.variant=v;
    }
    doOpen();
  }

  // ── LOAD DATA ──────────────────────────────────────────────────────────────
  function loadData(cb) {
    var appUrl=(window.__charmcraft&&window.__charmcraft.appUrl)||'https://charmcraft-seven.vercel.app';
    Promise.all([
      fetch('/products/'+HANDLE+'.js').then(function(r){return r.json();}),
      fetch(appUrl+'/api/proxy?product='+HANDLE+'&shop='+encodeURIComponent(SHOP)).then(function(r){return r.json();}),
    ])
    .then(function(rs){
      S.product=rs[0];
      S.config =rs[1].configured ? rs[1] : null;
      S.variant=(S.product.variants||[])[0]||null;
      S.slots  =new Array(maxSlots()).fill(null);
      S.loaded =true;
      cb(true);
    })
    .catch(function(){ S.loaded=true; cb(false); });
  }

  // ── INIT ───────────────────────────────────────────────────────────────────
  function init() {
    injectCSS();
    buildPopup();

    loadData(function(ok){
      if (!ok||!S.config) return;
      injectTrigger();
      restoreURL();
      // If popup was opened from URL trigger before data loaded
      var ov=document.getElementById('cc-ov');
      if(ov&&ov.classList.contains('open')) revealModal();
    });
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

})();
