/* Visitor analytics widget.
 * Demo mode renders labeled sample data without network requests. Live mode
 * records via /api/hit (1h de-dup, server-side). Both modes render counters
 * plus an ECharts world map. No third-party services; loaded lazily. */
(function () {
  var mount = document.getElementById('visitor-widget-mount');
  if (!mount || mount.dataset.inited) return;
  mount.dataset.inited = '1';
  var api = mount.getAttribute('data-api') || '/api';
  var mode = mount.getAttribute('data-mode') === 'demo' ? 'demo' : 'live';
  var VENDOR = 'assets/js/vendor/';

  injectStyle();
  mount.innerHTML = skeleton();

  var statsRequest = mode === 'demo' ? Promise.resolve(demoStats()) : hit();
  statsRequest.then(function (stats) {
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
      if (mode === 'demo') {
        sinceEl.textContent = 'Demo data · Connect Cloudflare D1 to show live visitors';
      } else {
        // Display in UTC to match the UTC day/month buckets the counters use.
        sinceEl.textContent = s.since ? 'Tracking since ' + new Date(s.since * 1000).toISOString().slice(0, 10) + ' UTC' : '';
      }
    }
  }

  function loadMap(stats) {
    loadScript(VENDOR + 'echarts-slim.js')
      .then(function () { return loadScript(VENDOR + 'echarts-world.js'); })
      .then(function () { initMap(stats); })
      .catch(function () { /* map optional; counts already shown */ });
  }

  function initMap(stats) {
    if (typeof echarts === 'undefined' || !window.__ECHARTS_WORLD__) return;
    var el = document.getElementById('vw-map');
    if (!el) return;
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';

    var land = dark ? '#222c40' : '#eaeef5';
    var border = dark ? '#33405a' : '#d6dce6';
    var rampLo = dark ? '#1e3a63' : '#cfe0ff';
    var rampHi = dark ? '#7aa7f0' : '#3f7fe0';
    var dot = '#38bdf8';
    var maxC = Math.max.apply(null, (stats.countries || []).map(function (c) { return c.count; }).concat([1]));

    try { echarts.registerMap('world', window.__ECHARTS_WORLD__); } catch (e) {}
    var chart = echarts.init(el, null, { renderer: 'canvas' });
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: dark ? '#0f1729' : '#1f2937',
        borderColor: 'transparent', textStyle: { color: '#fff', fontSize: 12 },
        padding: [5, 9],
        formatter: function (p) {
          if (p.seriesType === 'effectScatter') return p.name + ': ' + p.value[2];
          var v = (p.value == null || isNaN(p.value)) ? 0 : p.value;
          return p.name + ': ' + v;
        }
      },
      visualMap: {
        type: 'continuous', min: 0, max: maxC, calculable: false, show: false,
        inRange: { color: [rampLo, rampHi] }
      },
      geo: {
        map: 'world', roam: false, silent: false,
        // Keep the map's true geographic proportions (equirectangular ~2:1).
        // Pinning all four edges would stretch it to fill the box and distort it;
        // layoutSize/layoutCenter fit-to-box while preserving aspect ratio instead.
        aspectScale: 1, layoutCenter: ['50%', '50%'], layoutSize: '100%',
        itemStyle: { areaColor: land, borderColor: border, borderWidth: 0.5 },
        emphasis: { itemStyle: { areaColor: dark ? '#3a496b' : '#dfe6f2' }, label: { show: false } }
      },
      series: [
        {
          type: 'map', map: 'world', geoIndex: 0,
          data: (stats.countries || []).map(function (c) { return { name: c.code, value: c.count }; })
        },
        {
          type: 'effectScatter', coordinateSystem: 'geo', zlevel: 2,
          rippleEffect: { brushType: 'stroke', scale: 3 },
          symbolSize: function (val) { return Math.max(5, Math.sqrt(val[2]) * 5); },
          itemStyle: { color: dot, shadowBlur: 8, shadowColor: dot },
          data: (stats.points || []).map(function (p) { return { name: 'Visitors', value: [p.lon, p.lat, p.c] }; })
        }
      ]
    });
    var ro;
    function resize() { try { chart.resize(); } catch (e) {} }
    if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(el); }
    window.addEventListener('resize', resize);
  }

  /* ---------- helpers ---------- */
  function demoStats() {
    return {
      total: 1284,
      unique: 823,
      month: 147,
      today: 12,
      countries: [
        { code: 'US', count: 420 },
        { code: 'CN', count: 230 },
        { code: 'GB', count: 85 },
        { code: 'DE', count: 72 },
        { code: 'SG', count: 65 },
        { code: 'JP', count: 58 },
        { code: 'CA', count: 47 },
        { code: 'AU', count: 31 }
      ],
      points: [
        { lat: 37.8, lon: -122.4, c: 96 },
        { lat: 40.7, lon: -74.0, c: 81 },
        { lat: 39.9, lon: 116.4, c: 72 },
        { lat: 31.2, lon: 121.5, c: 63 },
        { lat: 51.5, lon: -0.1, c: 48 },
        { lat: 52.5, lon: 13.4, c: 39 },
        { lat: 1.3, lon: 103.8, c: 35 },
        { lat: 35.7, lon: 139.7, c: 32 },
        { lat: 43.7, lon: -79.4, c: 24 },
        { lat: -33.9, lon: 151.2, c: 18 }
      ]
    };
  }

  function skeleton() {
    return '' +
      '<div class="vw-card">' +
      '  <div class="vw-head"><span class="vw-dot"></span>Visitors' +
      (mode === 'demo' ? '<span class="vw-demo-badge">Demo</span>' : '') +
      '  </div>' +
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
      '.vw-head{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;color:var(--color-primary,#222);margin-bottom:14px}' +
      '.vw-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.18)}' +
      '.vw-demo-badge{margin-left:auto;padding:2px 7px;border-radius:999px;background:rgba(59,130,246,.12);color:#3b82f6;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}' +
      '.vw-nums{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:6px}' +
      '.vw-num{text-align:center}' +
      '.vw-num b{display:block;font-size:20px;line-height:1.1;color:var(--color-primary,#1d4ed8);font-variant-numeric:tabular-nums}' +
      '.vw-num span{font-size:11px;color:var(--color-secondary,#888)}' +
      '.vw-map{width:100%;height:260px;margin:4px 0 6px}' +
      '.vw-since{text-align:center;font-size:11px;color:var(--color-secondary,#9aa3b2);margin-top:8px;opacity:.8}' +
      '@media(max-width:600px){.vw-num b{font-size:17px}.vw-map{height:210px}}';
    var st = document.createElement('style');
    st.id = 'vw-style'; st.textContent = css;
    document.head.appendChild(st);
  }
})();
