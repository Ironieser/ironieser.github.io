/* Self-hosted visitor analytics widget.
 * Records a visit via /api/hit (1h de-dup, server-side) and renders a counter
 * plus a world map shaded by visitor country. No third-party services.
 * Loaded lazily (only when the footer scrolls into view). */
(function () {
  var mount = document.getElementById('visitor-widget-mount');
  if (!mount || mount.dataset.inited) return;
  mount.dataset.inited = '1';
  var api = mount.getAttribute('data-api') || '/api';
  var VENDOR = 'assets/js/vendor/';

  injectStyle();
  mount.innerHTML = skeleton();

  // 1) Record this visit, then render numbers + map from the returned stats.
  hit().then(function (stats) {
    if (!stats || stats.error) { renderError(); return; }
    renderCounts(stats);
    loadMap(stats);
  }).catch(renderError);

  function hit() {
    var p = encodeURIComponent(location.pathname || '/');
    return fetch(api + '/hit?p=' + p, { method: 'POST', keepalive: true })
      .then(function (r) { return r.json(); })
      .catch(function () { return fetch(api + '/stats').then(function (r) { return r.json(); }); });
  }

  function renderCounts(s) {
    set('vw-total', fmt(s.total));
    set('vw-today', fmt(s.today));
    set('vw-month', fmt(s.month));
    set('vw-unique', fmt(s.unique));
    var sinceEl = document.getElementById('vw-since');
    if (sinceEl) {
      if (s.since) {
        var d = new Date(s.since * 1000);
        var ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        sinceEl.textContent = 'Tracking since ' + ds;
      } else {
        sinceEl.textContent = '';
      }
    }
  }

  function loadMap(stats) {
    loadScript(VENDOR + 'jsvectormap.min.js')
      .then(function () { return loadScript(VENDOR + 'jsvectormap-world.js'); })
      .then(function () { initMap(stats); })
      .catch(function () { /* map optional; counts already shown */ });
  }

  function initMap(stats) {
    if (typeof jsVectorMap === 'undefined') return;
    // Neutral "no data" land color (NOT the near-black --color-border, which made
    // un-visited countries look deliberately blacked out next to a blue one).
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var region = dark ? '#33405a' : '#dde3ec';
    var lo = dark ? '#3f5f93' : '#cfe0ff', hi = dark ? '#8fb6f7' : '#3f7fe0';
    var pts = stats.points || [];
    var maxP = pts.reduce(function (m, p) { return Math.max(m, p.c); }, 1);
    var markers = pts.map(function (p) {
      var r = 3 + Math.min(10, Math.sqrt(p.c / maxP) * 10);
      return { name: p.c + (p.c > 1 ? ' visits' : ' visit'), coords: [p.lat, p.lon], style: { r: r } };
    });
    var byCode = {};
    (stats.countries || []).forEach(function (c) { if (c.code) byCode[c.code] = c.count; });
    var maxC = Math.max.apply(null, (stats.countries || []).map(function (c) { return c.count; }).concat([1]));
    try {
      new jsVectorMap({
        selector: '#vw-map',
        map: 'world',
        zoomButtons: false,
        zoomOnScroll: false,
        backgroundColor: 'transparent',
        regionStyle: { initial: { fill: region, stroke: 'transparent', strokeWidth: 0 }, hover: { fillOpacity: 0.85 } },
        markers: markers,
        markerStyle: {
          initial: { fill: '#3b82f6', stroke: '#3b82f6', strokeWidth: 1.3, fillOpacity: 0.45, r: 5 },
          hover: { fillOpacity: 0.85 }
        },
        onMarkerTooltipShow: function (event, tooltip, i) {
          try { tooltip.text(markers[i].name, true); } catch (e) {}
        }
      });
      // Choropleth done manually (jsVectorMap's built-in scale can emit invalid
      // colors -> black regions when the value range is tiny). Set each visited
      // country's fill directly on its SVG path.
      var mapEl = document.getElementById('vw-map');
      if (mapEl) {
        var nodes = mapEl.querySelectorAll('[data-code]');
        for (var i = 0; i < nodes.length; i++) {
          var code = (nodes[i].getAttribute('data-code') || '').toUpperCase();
          if (byCode[code] != null) {
            var t = maxC > 1 ? Math.log(byCode[code] + 1) / Math.log(maxC + 1) : 1;
            nodes[i].style.fill = lerpHex(lo, hi, t);
          }
        }
      }
    } catch (e) { /* ignore map errors */ }
  }

  function lerpHex(a, b, t) {
    function h(x) { return parseInt(x, 16); }
    function c(x, y) { return Math.round(x + (y - x) * t).toString(16).padStart(2, '0'); }
    return '#' + c(h(a.slice(1, 3)), h(b.slice(1, 3))) + c(h(a.slice(3, 5)), h(b.slice(3, 5))) + c(h(a.slice(5, 7)), h(b.slice(5, 7)));
  }

  /* ---------- helpers ---------- */
  function skeleton() {
    return '' +
      '<div class="vw-card">' +
      '  <div class="vw-head"><span class="vw-dot"></span>Visitors</div>' +
      '  <div class="vw-nums">' +
      '    <div class="vw-num"><b id="vw-total">—</b><span>Total</span></div>' +
      '    <div class="vw-num"><b id="vw-unique">—</b><span>Unique</span></div>' +
      '    <div class="vw-num"><b id="vw-month">—</b><span>This month</span></div>' +
      '    <div class="vw-num"><b id="vw-today">—</b><span>Today</span></div>' +
      '  </div>' +
      '  <div id="vw-map" class="vw-map"></div>' +
      '  <div id="vw-since" class="vw-since"></div>' +
      '</div>';
  }

  function renderError() {
    // Backend not ready yet (e.g. D1 not bound) — hide the widget entirely
    // rather than showing an empty card. It appears once /api is live.
    mount.style.display = 'none';
  }

  function set(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }

  function fmt(n) {
    n = Number(n || 0);
    return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n);
  }

  function flag(cc) {
    if (!cc || cc.length !== 2) return '🌐';
    var A = 0x1f1e6;
    return String.fromCodePoint(A + cc.charCodeAt(0) - 65, A + cc.charCodeAt(1) - 65);
  }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function injectStyle() {
    if (document.getElementById('vw-style')) return;
    var css =
      '.visitor-widget{max-width:560px;margin:0 auto}' +
      '.vw-card{border:1px solid var(--color-border,#e6e9ef);border-radius:14px;padding:18px 18px 14px;background:var(--color-surface,#fff)}' +
      '.vw-card.vw-quiet{opacity:.5}' +
      '.vw-head{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;color:var(--color-text,#222);margin-bottom:14px}' +
      '.vw-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.18)}' +
      '.vw-nums{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}' +
      '.vw-num{text-align:center}' +
      '.vw-num b{display:block;font-size:20px;line-height:1.1;color:var(--color-primary,#1d4ed8)}' +
      '.vw-num span{font-size:11px;color:var(--color-text-muted,#888)}' +
      '.vw-map{width:100%;height:240px;margin:6px 0 10px}' +
      '.vw-since{text-align:center;font-size:11px;color:var(--color-text-muted,#9aa3b2);margin-top:12px;opacity:.8}' +
      '.jvm-container{width:100%;height:100%;position:relative;overflow:hidden;touch-action:none}' +
      '.jvm-tooltip{border-radius:6px;background:#1f2937;color:#fff;font-size:12px;padding:4px 8px;position:absolute;display:none;box-shadow:0 2px 8px rgba(0,0,0,.25);white-space:nowrap;pointer-events:none;z-index:60}' +
      '.jvm-tooltip.active{display:block}.jvm-zoom-btn{display:none}' +
      '.jvm-marker{filter:drop-shadow(0 0 5px rgba(59,130,246,.5));transition:opacity .15s}' +
      '.vw-map svg{overflow:visible}' +
      '@media(max-width:600px){.vw-num b{font-size:17px}.vw-map{height:190px}}';
    var st = document.createElement('style');
    st.id = 'vw-style'; st.textContent = css;
    document.head.appendChild(st);
  }
})();
