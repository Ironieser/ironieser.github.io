/* Self-hosted visitor analytics widget.
 * Records a visit via /api/hit (10-minute session de-dup, server-side) and renders a counter
 * plus an SVG dot-grid world map: land dots darken with each country's visits,
 * the busiest cities are marked, and the top countries' share sits below it.
 * No third-party services. Loaded lazily on footer scroll. */
(function () {
  var mount = document.getElementById('visitor-widget-mount');
  if (!mount || mount.dataset.inited) return;
  mount.dataset.inited = '1';
  var api = mount.getAttribute('data-api') || '/api';
  var VENDOR = 'assets/js/vendor/';

  injectStyle();
  mount.innerHTML = skeleton();

  hit().then(function (stats) {
    if (!stats || stats.error) { renderError(); return; }
    renderCounts(stats);
    loadMapWhenVisible(stats);
  }).catch(renderError);

  function hit() {
    var p = encodeURIComponent((location.pathname || '/') + (location.search || ''));
    var referrer = '';
    var eventId = '';
    try {
      referrer = document.referrer ? new URL(document.referrer).hostname : '';
    } catch (e) {}
    try {
      eventId = crypto.randomUUID();
    } catch (e) {
      eventId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
    return fetch(api + '/hit?p=' + p + '&r=' + encodeURIComponent(referrer) + '&e=' + encodeURIComponent(eventId), { method: 'POST', keepalive: true })
      .then(function (r) { return r.json(); })
      .catch(function () { return fetch(api + '/stats').then(function (r) { return r.json(); }); });
  }

  function loadMapWhenVisible(stats) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            io.disconnect();
            loadMap(stats);
          }
        });
      }, { rootMargin: '300px' });
      io.observe(mount);
    } else {
      loadMap(stats);
    }
  }

  function renderCounts(s) {
    set('vw-total', fmt(s.total));
    set('vw-today', fmt(s.today));
    set('vw-month', fmt(s.month));
    // Older API responses have no halfYear; leave the placeholder instead of showing 0.
    if (s.halfYear != null) set('vw-half', fmt(s.halfYear));
    renderTopCountries(s.countries, s.total);
    renderViewerLocation(s.viewer);
    var sinceEl = document.getElementById('vw-since');
    if (sinceEl) {
      // Display in UTC to match the UTC day/month buckets the counters use.
      sinceEl.textContent = s.since ? 'Tracking since ' + new Date(s.since * 1000).toISOString().slice(0, 10) + ' UTC' : '';
    }
  }

  // Share of all visits for the five largest countries, shown under the map.
  // Intl's English names for these run long ("Hong Kong SAR China").
  var SHORT_NAMES = { HK: 'Hong Kong', MO: 'Macao', TW: 'Taiwan' };
  function renderTopCountries(countries, total) {
    var el = document.getElementById('vw-top');
    if (!el || !countries || !countries.length || !total) return;
    var names = null;
    try { names = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) {}
    el.innerHTML = '';
    countries.slice(0, 5).forEach(function (c) {
      var pct = c.count / total * 100;
      var item = document.createElement('span');
      var name = c.code;
      try { name = SHORT_NAMES[c.code] || (names && names.of(c.code)) || c.code; } catch (e) {}
      item.textContent = name + ' ';
      var b = document.createElement('b');
      b.textContent = pct < 1 ? '<1%' : Math.round(pct) + '%';
      item.appendChild(b);
      el.appendChild(item);
    });
  }

  function renderViewerLocation(viewer) {
    var item = document.getElementById('visitor-location-item');
    var value = document.getElementById('visitor-location');
    if (!item || !value) return;
    var text = formatViewerLocation(viewer);
    if (!text) {
      item.hidden = true;
      item.style.display = 'none';
      return;
    }
    value.textContent = text;
    item.hidden = false;
    item.style.display = 'flex';
  }

  function formatViewerLocation(viewer) {
    if (!viewer) return '';
    var country = viewer.country || '';
    try {
      if (country && typeof Intl !== 'undefined' && Intl.DisplayNames) {
        country = new Intl.DisplayNames([navigator.language || 'en'], { type: 'region' }).of(country) || country;
      }
    } catch (e) {}
    var parts = [viewer.city, viewer.region, country].filter(Boolean);
    return parts.filter(function (part, index) {
      return parts.findIndex(function (candidate) {
        return String(candidate).toLowerCase() === String(part).toLowerCase();
      }) === index;
    }).join(', ');
  }

  function loadMap(stats) {
    loadScript(VENDOR + 'world-dots.js')
      .then(function () { initMap(stats); })
      .catch(function () { /* map optional; counts already shown */ });
  }

  // Land is a precomputed dot grid (scripts/build-world-dots.js). Dots in visited
  // countries step from gray toward ink with visits; the busiest cities sit on top.
  // Colors live in CSS (.vw-l0..4, .vw-city) so the theme toggle restyles it live.
  function initMap(stats) {
    var grid = window.__WORLD_DOTS__;
    var el = document.getElementById('vw-map');
    if (!grid || !el) return;
    var cols = grid.cols, rows = grid.rows, step = grid.step;

    // One country holds most of the visits, so levels use a log scale, and the
    // power curve keeps lightly visited countries gray instead of tinting half the map.
    var counts = {};
    var maxLog = 0;
    (stats.countries || []).forEach(function (c) {
      counts[c.code] = c.count;
      maxLog = Math.max(maxLog, logc(c.count));
    });
    function level(code) {
      if (!counts[code] || !maxLog) return 0;
      // Countries stop at level 4; the darkest step is kept for the city markers.
      return Math.round(Math.pow(logc(counts[code]) / maxLog, 2.2) * 4);
    }

    var out = [];
    Object.keys(grid.countries).forEach(function (code) {
      var lv = level(code);
      var r = lv ? 0.4 : 0.36;
      grid.countries[code].split(',').forEach(function (k) {
        var i = parseInt(k, 36);
        out.push('<circle class="vw-l' + lv + '" cx="' + (i % cols + 0.5) + '" cy="' + (Math.floor(i / cols) + 0.5) + '" r="' + r + '"/>');
      });
    });

    // Only the busiest cities get a marker; with every city drawn the US and China
    // turn into solid clusters. The top three pulse.
    var cities = (stats.points || []).slice().sort(function (a, b) { return b.c - a.c; }).slice(0, 12);
    var maxCity = cities.length ? cities[0].c : 1;
    cities.forEach(function (p, i) {
      var x = ((p.lon + 180) / step).toFixed(2);
      var y = ((grid.latTop - p.lat) / step).toFixed(2);
      var r = (0.7 + 0.55 * Math.sqrt(p.c / maxCity)).toFixed(2);
      if (i < 3) out.push('<circle class="vw-pulse" cx="' + x + '" cy="' + y + '" r="' + r + '"/>');
      out.push('<circle class="vw-city" cx="' + x + '" cy="' + y + '" r="' + r + '"><title>' + p.c + ' visits</title></circle>');
    });

    el.innerHTML = '<svg viewBox="0 0 ' + cols + ' ' + rows + '" role="img" aria-label="World map of visitor locations">' + out.join('') + '</svg>';
  }
  function logc(n) { return Math.log10(Number(n || 0) + 1); }

  /* ---------- helpers ---------- */
  function skeleton() {
    return '' +
      '<div class="vw-card">' +
      '  <div class="vw-head"><span class="vw-dot"></span>Visitors</div>' +
      '  <div class="vw-nums">' +
      '    <div class="vw-num"><b id="vw-total">—</b><span>Total</span></div>' +
      '    <div class="vw-num"><b id="vw-half">—</b><span>6 months</span></div>' +
      '    <div class="vw-num"><b id="vw-month">—</b><span>This month</span></div>' +
      '    <div class="vw-num"><b id="vw-today">—</b><span>Today</span></div>' +
      '  </div>' +
      '  <div id="vw-map" class="vw-map"></div>' +
      '  <div id="vw-top" class="vw-top"></div>' +
      '  <div id="vw-since" class="vw-since"></div>' +
      '</div>';
  }

  function renderError() { mount.style.display = 'none'; }
  function set(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  function fmt(n) {
    n = Number(n || 0);
    return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n);
  }
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function injectStyle() {
    if (document.getElementById('vw-style')) return;
    var css =
      '.visitor-widget{width:100%;max-width:560px;margin:0 auto}' +
      '.vw-card{border:1px solid var(--color-border,#e6e9ef);border-radius:16px;padding:18px 18px 14px;background:var(--color-surface,#fff)}' +
      '.vw-head{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;color:var(--color-primary,#222);margin-bottom:12px}' +
      '.vw-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.18)}' +
      '.vw-nums{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:6px}' +
      '.vw-num{text-align:center}' +
      '.vw-num b{display:block;font-size:20px;line-height:1.1;color:var(--color-primary,#1d4ed8);font-variant-numeric:tabular-nums}' +
      '.vw-num span{font-size:11px;color:var(--color-secondary,#888)}' +
      '.vw-map{margin:8px 0 2px}.vw-map svg{display:block;width:100%;height:auto}' +
      // Gray land to ink in five steps; dark mode runs the same ramp from slate to near-white.
      '.vw-map{--vw-l0:#d1d5db;--vw-l1:#adb3ba;--vw-l2:#8a9099;--vw-l3:#666e79;--vw-l4:#434b58;--vw-l5:#1f2937}' +
      '[data-theme="dark"] .vw-map{--vw-l0:#334155;--vw-l1:#566274;--vw-l2:#798493;--vw-l3:#9ca5b2;--vw-l4:#bfc7d1;--vw-l5:#e2e8f0}' +
      '.vw-l0{fill:var(--vw-l0)}.vw-l1{fill:var(--vw-l1)}.vw-l2{fill:var(--vw-l2)}.vw-l3{fill:var(--vw-l3)}.vw-l4{fill:var(--vw-l4)}' +
      '.vw-city{fill:var(--vw-l5);stroke:var(--color-surface,#f9fafb);stroke-width:.32}' +
      '.vw-pulse{fill:none;stroke:var(--vw-l5);stroke-width:.2;transform-box:fill-box;transform-origin:center;animation:vw-pulse 3.2s ease-out infinite}' +
      '@keyframes vw-pulse{from{transform:scale(1);opacity:.6}to{transform:scale(3.2);opacity:0}}' +
      '@media(prefers-reduced-motion:reduce){.vw-pulse{animation:none;opacity:0}}' +
      '.vw-top{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 14px;font-size:12px;color:var(--color-secondary,#6b7280);margin-top:6px}' +
      '.vw-top b{font-weight:600;color:var(--color-primary,#111827)}' +
      '.vw-since{text-align:center;font-size:11px;color:var(--color-secondary,#9aa3b2);margin-top:4px;opacity:.8}' +
      '@media(max-width:600px){.vw-num b{font-size:17px}}';
    var st = document.createElement('style');
    st.id = 'vw-style'; st.textContent = css;
    document.head.appendChild(st);
  }
})();
