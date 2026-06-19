/* Charm Craft — Popup Builder */
(function () {
  'use strict';

  var API = 'https://charmcraft-seven.vercel.app/api';
  var HANDLE = (location.pathname.match(/\/products\/([^/?#]+)/) || [])[1] || '';
  if (!HANDLE) return;

  /* ── STATE ── */
  var S = {
    product: null,
    config: null,
    variant: null,
    slots: [],
    active: null,
    cat: 'all'
  };

  /* ── CSS ── */
  function injectCSS() {
    if (document.getElementById('cc-css')) return;
    var el = document.createElement('style');
    el.id = 'cc-css';
    el.textContent = [
      /* trigger */
      '.cc-btn-wrap{margin-top:18px}',
      '.cc-trigger{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px 20px;border:2px solid #c9a84c;border-radius:8px;background:linear-gradient(135deg,#fff9ee,#fffbf4);color:#8a6020;font-size:.93rem;font-weight:700;cursor:pointer;letter-spacing:.04em;text-transform:uppercase;transition:all .18s;font-family:inherit}',
      '.cc-trigger:hover{background:linear-gradient(135deg,#c9a84c,#e8c06a);color:#fff;box-shadow:0 4px 20px #c9a84c44;transform:translateY(-1px)}',
      /* overlay */
      '#cc-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:999999;align-items:center;justify-content:center;padding:12px;backdrop-filter:blur(3px)}',
      '#cc-ov.open{display:flex}',
      /* modal */
      '#cc-m{background:#fff;border-radius:16px;width:min(960px,96vw);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.35)}',
      /* header */
      '.cc-hd{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0e8d8;flex-shrink:0}',
      '.cc-hd-t{font-size:.95rem;font-weight:700;color:#2a1a00}',
      '.cc-hd-s{font-size:.72rem;color:#a08050;margin-top:2px}',
      '.cc-x{width:32px;height:32px;border:none;background:#f5f0e8;border-radius:50%;cursor:pointer;font-size:1rem;color:#666;display:flex;align-items:center;justify-content:center;transition:background .15s;flex-shrink:0}',
      '.cc-x:hover{background:#ffe0e0;color:#e53935}',
      /* body */
      '.cc-body{display:grid;grid-template-columns:360px 1fr;flex:1;overflow:hidden;min-height:0}',
      /* left */
      '.cc-lft{background:linear-gradient(180deg,#faf7f0,#f5f0e8);display:flex;flex-direction:column;align-items:center;padding:18px 14px 14px;border-right:1px solid #ede8de;gap:12px}',
      '#cc-cv{border-radius:12px;max-width:100%;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.08)}',
      '.cc-acts{display:flex;gap:8px;width:100%}',
      '.cc-act{flex:1;padding:8px 0;border-radius:8px;border:1.5px solid #e0d8c8;background:#fff;color:#8a7050;font-size:.75rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .14s;font-family:inherit}',
      '.cc-act:hover{border-color:#c9a84c;color:#c9a84c;background:#fffbf0}',
      /* right */
      '.cc-rgt{display:flex;flex-direction:column;overflow:hidden}',
      '.cc-scroll{flex:1;overflow-y:auto;padding:18px 18px 10px;display:flex;flex-direction:column;gap:16px}',
      '.cc-scroll::-webkit-scrollbar{width:4px}',
      '.cc-scroll::-webkit-scrollbar-thumb{background:#d8c8a8;border-radius:4px}',
      /* section label */
      '.cc-lbl{font-size:.73rem;font-weight:700;color:#a08050;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}',
      /* variant pills */
      '.cc-opts{display:flex;flex-direction:column;gap:8px}',
      '.cc-og{display:flex;flex-direction:column;gap:4px}',
      '.cc-ogn{font-size:.72rem;color:#888;font-weight:600}',
      '.cc-pills{display:flex;flex-wrap:wrap;gap:6px}',
      '.cc-pill{padding:6px 16px;border-radius:20px;border:1.5px solid #e0d8c8;background:#fff;color:#555;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .13s;font-family:inherit}',
      '.cc-pill:hover{border-color:#c9a84c;color:#c9a84c}',
      '.cc-pill.on{border-color:#c9a84c;background:linear-gradient(135deg,#c9a84c,#e8c06a);color:#fff}',
      /* slots */
      '.cc-slots{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.cc-sl{width:50px;height:50px;border-radius:50%;border:2px dashed #d0bc8888;background:#fafaf8;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}',
      '.cc-sl:hover{border-color:#c9a84c;box-shadow:0 0 0 4px #c9a84c22}',
      '.cc-sl.act{border:2.5px solid #c9a84c;box-shadow:0 0 0 5px #c9a84c30;background:#fffbf0;transform:scale(1.1)}',
      '.cc-sl.fil{border:2px solid #c9a84c}',
      '.cc-sl img{width:100%;height:100%;border-radius:50%;object-fit:cover}',
      '.cc-sln{font-size:.65rem;color:#c9a84c99;font-weight:700}',
      '.cc-rm{position:absolute;top:-4px;right:-4px;width:17px;height:17px;background:#fff;border:1.5px solid #e53935;border-radius:50%;color:#e53935;font-size:9px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1}',
      '.cc-hint{font-size:.72rem;color:#b09070;font-style:italic;margin-top:4px}',
      /* category tabs */
      '.cc-cats{display:flex;flex-wrap:wrap;gap:5px}',
      '.cc-cat{padding:5px 13px;border-radius:20px;border:1.5px solid #e8dcc8;background:#fff;color:#8a7050;font-size:.73rem;font-weight:600;cursor:pointer;transition:all .12s;text-transform:capitalize;font-family:inherit}',
      '.cc-cat:hover,.cc-cat.on{border-color:#c9a84c;background:linear-gradient(135deg,#c9a84c,#e8c06a);color:#fff}',
      /* charm grid */
      '.cc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px}',
      '.cc-card{border:1.5px solid #ede8de;border-radius:10px;padding:10px 6px 8px;cursor:pointer;text-align:center;background:#fff;transition:all .15s}',
      '.cc-card:hover{border-color:#c9a84c;transform:translateY(-2px);box-shadow:0 4px 14px #c9a84c28}',
      '.cc-card.dim{opacity:.35;pointer-events:none}',
      '.cc-card img{width:48px;height:48px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 5px;background:#f5f0e8}',
      '.cc-cph{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#f5f0e8,#e8dcc8);display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin:0 auto 5px}',
      '.cc-cn{font-size:.63rem;font-weight:600;color:#333;line-height:1.3}',
      '.cc-cp{font-size:.7rem;font-weight:700;color:#b08828;margin-top:2px}',
      '.cc-bg{display:inline-block;font-size:.52rem;font-weight:700;padding:1px 4px;border-radius:3px;margin-top:3px;text-transform:uppercase}',
      '.cc-be{background:#e8f5e9;color:#2e7d32}',
      '.cc-bp{background:#fff3e0;color:#e65100}',
      /* footer */
      '.cc-ft{padding:13px 18px;border-top:1px solid #f0e8d8;background:#faf8f4;flex-shrink:0}',
      '.cc-pr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}',
      '.cc-prl{font-size:.78rem;color:#888}',
      '.cc-prv{font-size:1.1rem;font-weight:700;color:#2a1a00}',
      '.cc-atc{width:100%;padding:13px;border:none;border-radius:10px;background:linear-gradient(135deg,#2a1a00,#4a3010);color:#f5d76e;font-size:.93rem;font-weight:700;cursor:pointer;letter-spacing:.04em;text-transform:uppercase;transition:all .18s;display:flex;align-items:center;justify-content:center;gap:10px;font-family:inherit}',
      '.cc-atc:hover{background:linear-gradient(135deg,#c9a84c,#e8c06a);color:#fff;box-shadow:0 4px 20px #c9a84c44;transform:translateY(-1px)}',
      '.cc-atc:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}',
      '.cc-sp{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#f5d76e;border-radius:50%;animation:cc-r .6s linear infinite}',
      '@keyframes cc-r{to{transform:rotate(360deg)}}',
      /* success */
      '.cc-ok{position:absolute;inset:0;background:rgba(255,255,255,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;gap:10px;z-index:10;animation:cc-fi .3s ease}',
      '@keyframes cc-fi{from{opacity:0}to{opacity:1}}',
      '.cc-ok-ic{width:60px;height:60px;background:linear-gradient(135deg,#c9a84c,#e8c06a);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.8rem}',
      '.cc-ok-t{font-size:1.15rem;font-weight:700;color:#2a1a00}',
      '.cc-ok-s{font-size:.82rem;color:#888}',
      '.cc-ok-bs{display:flex;gap:10px;margin-top:6px}',
      '.cc-ok-v{padding:10px 22px;border-radius:8px;background:linear-gradient(135deg,#2a1a00,#4a3010);color:#f5d76e;font-size:.83rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-family:inherit}',
      '.cc-ok-c{padding:10px 22px;border-radius:8px;border:1.5px solid #e0d8c8;background:#fff;color:#666;font-size:.83rem;font-weight:600;cursor:pointer;font-family:inherit}',
      /* mobile */
      '@media(max-width:768px){',
        '#cc-m{width:100vw;height:100dvh;max-height:100dvh;border-radius:0}',
        '.cc-body{grid-template-columns:1fr;grid-template-rows:auto 1fr;overflow-y:auto}',
        '.cc-lft{border-right:none;border-bottom:1px solid #ede8de;padding:12px;flex-direction:row;align-items:flex-start;gap:10px}',
        '#cc-cv{width:160px;height:160px;flex-shrink:0}',
        '.cc-acts{flex-direction:column;width:auto}',
        '.cc-rgt{overflow:visible}',
        '.cc-scroll{overflow:visible;padding:14px 14px 90px}',
        '.cc-ft{position:fixed;bottom:0;left:0;right:0;z-index:10;border-top:1px solid #e0d8c8}',
      '}'
    ].join('');
    document.head.appendChild(el);
  }

  /* ── HELPERS ── */
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(n) { return '₹' + parseFloat(n || 0).toLocaleString('en-IN'); }
  function totalExtra() {
    return S.slots.reduce(function (a, c) { return a + (c ? parseFloat(c.price) || 0 : 0); }, 0);
  }
  function filledSlots() { return S.slots.filter(Boolean); }
  function getCharms() {
    var all = (S.config && S.config.charms) || [];
    return S.cat === 'all' ? all : all.filter(function (c) { return c.category === S.cat; });
  }
  function getCats() {
    var seen = { all: 1 }, cats = ['all'];
    ((S.config && S.config.charms) || []).forEach(function (c) {
      if (!seen[c.category]) { seen[c.category] = 1; cats.push(c.category); }
    });
    return cats;
  }

  /* ── POPUP ── */
  function buildPopup() {
    if (document.getElementById('cc-ov')) return;
    var ov = document.createElement('div');
    ov.id = 'cc-ov';
    ov.innerHTML = '<div id="cc-m"><div class="cc-hd"><div><div class="cc-hd-t">❆ Customize Your Necklace</div><div class="cc-hd-s" id="cc-pname">Loading…</div></div><button class="cc-x" id="cc-xb">✕</button></div><div class="cc-body"><div class="cc-lft"><canvas id="cc-cv" width="300" height="300"></canvas><div class="cc-acts"><button class="cc-act" id="cc-sb">⎘ Share</button><button class="cc-act" id="cc-vb">♡ Save</button></div></div><div class="cc-rgt"><div class="cc-scroll" id="cc-opts"></div><div class="cc-ft"><div class="cc-pr"><div class="cc-prl">Charm total:</div><div class="cc-prv" id="cc-tot">₹0</div></div><button class="cc-atc" id="cc-ab" disabled>Add to Cart</button></div></div></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.getElementById('cc-xb').addEventListener('click', close);
    document.getElementById('cc-sb').addEventListener('click', shareDesign);
    document.getElementById('cc-vb').addEventListener('click', saveDesign);
    document.getElementById('cc-ab').addEventListener('click', doAddToCart);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  function open() {
    document.getElementById('cc-ov').classList.add('open');
    document.body.style.overflow = 'hidden';
    var nm = document.getElementById('cc-pname');
    if (nm && S.product) nm.textContent = S.product.title;
    renderOpts();
    drawCanvas();
  }

  function close() {
    var ov = document.getElementById('cc-ov');
    if (ov) ov.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── RENDER OPTIONS PANEL ── */
  function renderOpts() {
    var el = document.getElementById('cc-opts');
    if (!el || !S.config) return;

    var max = S.config.maxSlots || 5;
    var charms = getCharms();
    var cats = getCats();

    /* variant picker */
    var vHTML = '';
    if (S.product && S.product.options && !(S.product.options.length === 1 && S.product.options[0].name === 'Title')) {
      vHTML = '<div><div class="cc-lbl">Options</div><div class="cc-opts">';
      S.product.options.forEach(function (opt, oi) {
        vHTML += '<div class="cc-og"><div class="cc-ogn">' + esc(opt.name) + '</div><div class="cc-pills">';
        (opt.values || []).forEach(function (val) {
          var sel = S.variant && S.variant['option' + (oi + 1)] === val;
          vHTML += '<button class="cc-pill' + (sel ? ' on' : '') + '" data-opt="' + esc(opt.name) + '" data-val="' + esc(val) + '">' + esc(val) + '</button>';
        });
        vHTML += '</div></div>';
      });
      vHTML += '</div></div>';
    }

    /* slots */
    var sHTML = '<div class="cc-slots">';
    for (var i = 0; i < max; i++) {
      var s = S.slots[i];
      var cls = 'cc-sl' + (S.active === i ? ' act' : '') + (s ? ' fil' : '');
      var inn = s
        ? (s.image ? '<img src="' + esc(s.image) + '" alt="">' : '<div style="font-size:1.2rem">✨</div>') + '<span class="cc-rm" data-rm="' + i + '">✕</span>'
        : '<span class="cc-sln">' + (i + 1) + '</span>';
      sHTML += '<div class="' + cls + '" data-sl="' + i + '">' + inn + '</div>';
    }
    sHTML += '</div>';
    var hint = S.active !== null ? 'Slot ' + (S.active + 1) + ' selected — pick a charm' : 'Tap a slot to start';

    /* category tabs */
    var cHTML = '<div class="cc-cats">';
    cats.forEach(function (c) {
      cHTML += '<button class="cc-cat' + (S.cat === c ? ' on' : '') + '" data-cat="' + esc(c) + '">' + (c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)) + '</button>';
    });
    cHTML += '</div>';

    /* charm grid */
    var gHTML = '<div class="cc-grid">';
    if (!charms.length) {
      gHTML += '<div style="grid-column:1/-1;text-align:center;padding:16px;color:#bbb;font-size:.8rem;border:1.5px dashed #e0d8c8;border-radius:10px">No charms for this filter</div>';
    } else {
      charms.forEach(function (c) {
        var dim = S.active === null ? ' dim' : '';
        var img = c.image ? '<img src="' + esc(c.image) + '" alt="">' : '<div class="cc-cph">✨</div>';
        var badge = c.engravable ? '<br><span class="cc-bg cc-be">Engravable</span>' : c.category === 'premium' ? '<br><span class="cc-bg cc-bp">Premium</span>' : '';
        gHTML += '<div class="cc-card' + dim + '" data-cid="' + esc(c.id) + '">' + img + '<div class="cc-cn">' + esc(c.name) + '</div><div class="cc-cp">' + fmt(c.price) + '</div>' + badge + '</div>';
      });
    }
    gHTML += '</div>';

    el.innerHTML = vHTML +
      '<div><div class="cc-lbl">Charm Slots (' + filledSlots().length + '/' + max + ')</div>' + sHTML + '<div class="cc-hint">' + hint + '</div></div>' +
      '<div><div class="cc-lbl">Choose a Charm</div>' + cHTML + '<div style="height:6px"></div>' + gHTML + '</div>';

    updatePriceUI();

    /* events */
    el.querySelectorAll('.cc-pill').forEach(function (b) {
      b.addEventListener('click', function () { pickOption(b.dataset.opt, b.dataset.val); });
    });
    el.querySelectorAll('.cc-sl').forEach(function (b) {
      b.addEventListener('click', function (e) {
        var rm = e.target.closest('[data-rm]');
        if (rm) { S.slots[+rm.dataset.rm] = null; if (S.active === +rm.dataset.rm) S.active = null; renderOpts(); drawCanvas(); return; }
        S.active = S.active === +b.dataset.sl ? null : +b.dataset.sl;
        renderOpts();
      });
    });
    el.querySelectorAll('.cc-cat').forEach(function (b) {
      b.addEventListener('click', function () { S.cat = b.dataset.cat; renderOpts(); });
    });
    el.querySelectorAll('.cc-card').forEach(function (b) {
      b.addEventListener('click', function () {
        if (S.active === null) return;
        var charm = (S.config.charms || []).find(function (c) { return c.id === b.dataset.cid; });
        if (!charm) return;
        var copy = { id: charm.id, name: charm.name, image: charm.image || '', price: parseFloat(charm.price) || 0, category: charm.category, engravable: charm.engravable };
        if (charm.engravable) {
          var t = prompt('Engraving for "' + charm.name + '" (max 15 chars):', '');
          if (t !== null) copy.engraving = t.slice(0, 15);
        }
        S.slots[S.active] = copy;
        var max2 = S.config.maxSlots || 5;
        var nx = -1;
        for (var i = S.active + 1; i < max2; i++) { if (!S.slots[i]) { nx = i; break; } }
        if (nx < 0) for (var i = 0; i < S.active; i++) { if (!S.slots[i]) { nx = i; break; } }
        S.active = nx >= 0 ? nx : null;
        renderOpts();
        drawCanvas();
      });
    });
  }

  function updatePriceUI() {
    var tot = document.getElementById('cc-tot');
    var ab = document.getElementById('cc-ab');
    var extra = totalExtra();
    if (tot) tot.textContent = extra > 0 ? '+' + fmt(extra) : fmt(0);
    if (ab) {
      ab.disabled = !S.variant;
      var fc = filledSlots().length;
      ab.textContent = fc > 0 ? 'Add to Cart — ' + fc + ' charm' + (fc !== 1 ? 's' : '') : 'Add to Cart';
    }
  }

  /* ── VARIANT LOGIC ── */
  function pickOption(optName, val) {
    if (!S.product) return;
    var curr = {};
    (S.product.options || []).forEach(function (o, i) {
      curr[o.name] = S.variant ? S.variant['option' + (i + 1)] : null;
    });
    curr[optName] = val;
    var match = (S.product.variants || []).find(function (v) {
      return (S.product.options || []).every(function (o, i) { return v['option' + (i + 1)] === curr[o.name]; });
    });
    if (match) { S.variant = match; }
    renderOpts();
  }

  /* ── CANVAS ── */
  function drawCanvas() {
    var cv = document.getElementById('cc-cv');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#faf8f4';
    ctx.fillRect(0, 0, W, H);

    var max = (S.config && S.config.maxSlots) || 5;
    var imgSrc = S.product && S.product.images && S.product.images[0] ? S.product.images[0].src : '';

    function drawSlots() {
      var chainY = H * 0.76;
      var x0 = W * 0.1, x1 = W * 0.9;
      var grad = ctx.createLinearGradient(x0, 0, x1, 0);
      grad.addColorStop(0, 'transparent'); grad.addColorStop(0.15, '#c9a84c'); grad.addColorStop(0.85, '#c9a84c'); grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(x0, chainY); ctx.lineTo(x1, chainY); ctx.stroke(); ctx.setLineDash([]);

      var step = max > 1 ? (x1 - x0) / (max - 1) : 0;
      for (var i = 0; i < max; i++) {
        var cx = x0 + i * step, cy = chainY, r = 21;
        var sl = S.slots[i];
        if (sl && sl.image) {
          (function (cx, cy, r, sl) {
            var ci = new Image(); ci.crossOrigin = 'anonymous';
            ci.onload = function () {
              ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
              ctx.drawImage(ci, cx - r, cy - r, r * 2, r * 2); ctx.restore();
              ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
            };
            ci.src = sl.image;
          })(cx, cy, r, sl);
        } else {
          var act = S.active === i;
          ctx.fillStyle = act ? '#fffbf0' : '#fff';
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = act ? '#c9a84c' : '#d4b96660'; ctx.lineWidth = act ? 2.5 : 1.5;
          ctx.setLineDash(act ? [] : [3, 3]); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
          if (sl) {
            ctx.fillStyle = '#c9a84c'; ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✨', cx, cy);
          } else {
            ctx.fillStyle = '#c9a84c88'; ctx.font = '600 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(i + 1, cx, cy);
          }
        }
      }
      ctx.fillStyle = '#c9a84c55'; ctx.font = '500 9px sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('❆ CHARM CRAFT', W - 8, H - 6);
    }

    if (imgSrc) {
      var pi = new Image(); pi.crossOrigin = 'anonymous';
      pi.onload = function () {
        var sc = Math.min((W * 0.8) / pi.width, (H * 0.55) / pi.height);
        var iw = pi.width * sc, ih = pi.height * sc;
        ctx.drawImage(pi, (W - iw) / 2, H * 0.04, iw, ih);
        drawSlots();
      };
      pi.onerror = drawSlots;
      pi.src = imgSrc;
    } else { drawSlots(); }
  }

  /* ── CART ── */
  function doAddToCart() {
    if (!S.variant) return;
    var btn = document.getElementById('cc-ab');
    btn.disabled = true;
    btn.innerHTML = '<div class="cc-sp"></div> Adding…';

    var props = {};
    filledSlots().forEach(function (c, i) {
      props['Charm ' + (i + 1)] = c.name + (c.engraving ? ' — "' + c.engraving + '"' : '');
    });
    var extra = totalExtra();
    if (extra > 0) props['Charm Extra'] = '+' + fmt(extra);

    /* capture canvas as PNG after a short delay to ensure charm images loaded */
    var shop = (window.Shopify && window.Shopify.shop) || 'jewellery-app-3.myshopify.com';
    setTimeout(function () {
      var cv = document.getElementById('cc-cv');
      var canvasData = cv ? cv.toDataURL('image/png') : null;
      fetch(API + '/designs?shop=' + encodeURIComponent(shop), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: shop,
          designData: JSON.stringify({ handle: HANDLE, variant: S.variant ? S.variant.id : null, slots: S.slots }),
          name: S.product ? S.product.title : HANDLE,
          canvasData: canvasData
        })
      })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.imageUrl) props['_cc_img'] = d.imageUrl;
        if (d.shareToken) props['Share Design'] = location.origin + '/products/' + HANDLE + '?cc_charms=' + filledSlots().map(function(c){return c.id;}).join(',');
        return submitCart(props);
      })
      .catch(function () { return submitCart(props); });
    }, 400);
  }

  function submitCart(props) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: S.variant.id, quantity: 1, properties: props })
    })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.status && d.status >= 400) throw new Error(d.description || 'Cart error');
      showSuccess();
    })
    .catch(function (e) {
      var btn = document.getElementById('cc-ab');
      if (btn) { btn.disabled = false; btn.textContent = 'Add to Cart'; }
      alert('Error adding to cart: ' + e.message);
    });
  }

  function showSuccess() {
    var modal = document.getElementById('cc-m');
    var fc = filledSlots().length;
    var ok = document.createElement('div');
    ok.className = 'cc-ok';
    ok.innerHTML = '<div class="cc-ok-ic">❆</div><div class="cc-ok-t">Added to Cart!</div><div class="cc-ok-s">' + fc + ' charm' + (fc !== 1 ? 's' : '') + ' added to your necklace</div><div class="cc-ok-bs"><a href="/cart" class="cc-ok-v">View Cart</a><button class="cc-ok-c" id="cc-ok-c">Continue Shopping</button></div>';
    modal.style.position = 'relative';
    modal.appendChild(ok);
    document.getElementById('cc-ok-c').addEventListener('click', function () {
      modal.removeChild(ok);
      modal.style.position = '';
      S.slots = Array(S.config.maxSlots || 5).fill(null);
      S.active = null;
      close();
    });
    /* refresh mini-cart if present */
    document.dispatchEvent(new CustomEvent('cart:refresh'));
    fetch('/cart.js').then(function(r){return r.json();}).then(function(cart){
      document.querySelectorAll('[data-cart-count]').forEach(function(el){el.textContent=cart.item_count;});
    }).catch(function(){});
  }

  /* ── SHARE ── */
  function shareDesign() {
    var ids = filledSlots().map(function (c) { return c.id; }).join(',');
    var url = location.origin + location.pathname + '?cc_charms=' + ids + '&cc_v=' + (S.variant ? S.variant.id : '');
    navigator.clipboard.writeText(url).then(function () {
      var b = document.getElementById('cc-sb');
      b.textContent = '✓ Copied!'; b.style.color = '#2e7d32'; b.style.borderColor = '#4caf50';
      setTimeout(function () { b.textContent = '⎘ Share'; b.style.color = ''; b.style.borderColor = ''; }, 2000);
    }).catch(function(){
      prompt('Copy this link:', url);
    });
  }

  /* ── SAVE / LOAD ── */
  function saveDesign() {
    try {
      localStorage.setItem('cc_d_' + HANDLE, JSON.stringify({ v: S.variant ? S.variant.id : null, s: S.slots }));
      var b = document.getElementById('cc-vb');
      b.textContent = '✓ Saved!'; b.style.color = '#2e7d32'; b.style.borderColor = '#4caf50';
      setTimeout(function () { b.textContent = '♡ Save'; b.style.color = ''; b.style.borderColor = ''; }, 2000);
    } catch (e) {}
  }

  function loadSaved() {
    try {
      var raw = localStorage.getItem('cc_d_' + HANDLE);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d.s) S.slots = d.s;
      if (d.v && S.product) {
        var v = (S.product.variants || []).find(function (x) { return String(x.id) === String(d.v); });
        if (v) S.variant = v;
      }
    } catch (e) {}
  }

  function loadFromURL() {
    var p = new URLSearchParams(location.search);
    var ids = p.get('cc_charms'), vid = p.get('cc_v');
    if (ids && S.config && S.config.charms) {
      ids.split(',').forEach(function (id, i) {
        if (i >= (S.config.maxSlots || 5)) return;
        var c = S.config.charms.find(function (x) { return x.id === id; });
        if (c) S.slots[i] = { id: c.id, name: c.name, image: c.image || '', price: parseFloat(c.price) || 0, category: c.category };
      });
    }
    if (vid && S.product) {
      var v = (S.product.variants || []).find(function (x) { return String(x.id) === vid; });
      if (v) S.variant = v;
      if (ids) setTimeout(open, 600); /* auto-open if shared URL */
    }
  }

  /* ── TRIGGER BUTTON ── */
  function injectButton() {
    if (document.getElementById('cc-btn-w')) return;
    var w = document.createElement('div');
    w.id = 'cc-btn-w'; w.className = 'cc-btn-wrap';
    w.innerHTML = '<button class="cc-trigger" id="cc-open">❆ Build Your Necklace</button>';
    var target = document.querySelector('buy-buttons') || document.querySelector('product-form') || document.querySelector('.product-form') || document.querySelector('form[action*="/cart/add"]');
    if (target) target.insertAdjacentElement('afterend', w);
    else { var c = document.querySelector('.product, main'); (c || document.body).appendChild(w); }
    document.getElementById('cc-open').addEventListener('click', open);
  }

  /* ── INIT ── */
  function init() {
    injectCSS();
    buildPopup();

    var product = null, config = null, done = 0;
    function check() {
      if (++done < 2) return;
      S.product = product;
      if (!config || !config.configured) return; /* not configured — hide button */
      S.config = config;
      S.slots = Array(config.maxSlots || 5).fill(null);
      if (product && product.variants && product.variants.length) S.variant = product.variants[0];
      var nm = document.getElementById('cc-pname');
      if (nm && product) nm.textContent = product.title;
      loadFromURL();
      if (!filledSlots().length) loadSaved();
      injectButton();
    }

    fetch('/products/' + HANDLE + '.js').then(function (r) { return r.json(); }).then(function (d) { product = d; check(); }).catch(function () { product = {}; check(); });
    fetch(API + '/proxy?product=' + encodeURIComponent(HANDLE)).then(function (r) { return r.json(); }).then(function (d) { config = d; check(); }).catch(function () { config = { configured: false }; check(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 500); });
  } else {
    setTimeout(init, 500);
  }
})();
