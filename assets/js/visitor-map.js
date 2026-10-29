/* Self-hosted visitor analytics widget.
 * Records a visit via /api/hit (10-minute session de-dup, server-side) and renders a counter
 * plus an ECharts world map: countries shaded by visit count + dots for the
 * busiest cities, and the top countries' share below it. No third-party
 * services. Loaded lazily on footer scroll. */
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
    // Orange stands out against the blue country shading; blue dots vanished on the US.
    var dot = dark ? '#fb923c' : '#f97316';
    // One country (or city) can hold most of the visits, so shading and dot size use a
    // log scale; with a linear one every other country sits at the bottom of the ramp.
    var maxC = Math.max.apply(null, (stats.countries || []).map(function (c) { return logc(c.count); }).concat([1]));
    // Only the busiest cities get a dot; with every city drawn the US and China
    // turn into solid clusters. Country shading covers the rest.
    var points = (stats.points || []).slice().sort(function (a, b) { return b.c - a.c; }).slice(0, 12)
      .map(function (p) { return { name: 'Visitors', value: [p.lon, p.lat, p.c] }; });

    // Antarctica has no visitors and takes a fifth of the map's height.
    var world = window.__ECHARTS_WORLD__;
    world = { type: world.type, features: world.features.filter(function (f) { return f.properties.name !== 'AQ'; }) };
    try { echarts.registerMap('world', world); } catch (e) {}
    var chart = echarts.init(el, null, { renderer: 'canvas' });
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: dark ? '#0f1729' : '#1f2937',
        borderColor: 'transparent', textStyle: { color: '#fff', fontSize: 12 },
        padding: [5, 9],
        formatter: function (p) {
          if (p.seriesType !== 'map') return p.name + ': ' + p.value[2];
          return p.name + ': ' + ((p.data && p.data.count) || 0);
        }
      },
      visualMap: {
        // Shade countries only; without seriesIndex it also recolors the city dots.
        type: 'continuous', seriesIndex: 0, min: 0, max: maxC, calculable: false, show: false,
        inRange: { color: [rampLo, rampHi] }
      },
      geo: {
        map: 'world', roam: false, silent: false,
        // True geographic proportions; .vw-map's aspect-ratio matches the map
        // without Antarctica, so it fills the canvas with no crop.
        aspectScale: 1, left: 0, right: 0, top: 0, bottom: 0,
        itemStyle: { areaColor: land, borderColor: border, borderWidth: 0.5 },
        emphasis: { itemStyle: { areaColor: dark ? '#3a496b' : '#dfe6f2' }, label: { show: false } }
      },
      series: [
        {
          type: 'map', map: 'world', geoIndex: 0,
          data: (stats.countries || []).map(function (c) { return { name: c.code, value: logc(c.count), count: c.count }; })
        },
        {
          // The vendored ECharts build has no plain scatter; ripple only on hover.
          type: 'effectScatter', coordinateSystem: 'geo', zlevel: 2,
          showEffectOn: 'emphasis', rippleEffect: { brushType: 'stroke', scale: 2.4 },
          symbolSize: dotSize,
          itemStyle: { color: dot, opacity: 0.8, borderColor: dark ? '#0f1729' : '#fff', borderWidth: 0.6 },
          data: points.slice(3)
        },
        {
          // Only the busiest few cities ripple; on every dot the ripples merge into a haze.
          type: 'effectScatter', coordinateSystem: 'geo', zlevel: 3,
          rippleEffect: { brushType: 'stroke', scale: 2.8, period: 5 },
          symbolSize: dotSize,
          itemStyle: { color: dot, borderColor: dark ? '#0f1729' : '#fff', borderWidth: 0.6 },
          data: points.slice(0, 3)
        }
      ]
    });
    function logc(n) { return Math.log10(Number(n || 0) + 1); }
    function dotSize(val) { return 3 + 2.2 * logc(val[2]); }
    var ro;
    function resize() { try { chart.resize(); } catch (e) {} }
    if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(el); }
    window.addEventListener('resize', resize);
  }

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
      '.vw-map{width:100%;aspect-ratio:2.55/1;margin:6px 0 2px}' +
      '.vw-top{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 14px;font-size:12px;color:var(--color-secondary,#6b7280);margin-top:6px}' +
      '.vw-top b{font-weight:600;color:var(--color-primary,#1d4ed8)}' +
      '.vw-since{text-align:center;font-size:11px;color:var(--color-secondary,#9aa3b2);margin-top:4px;opacity:.8}' +
      '@media(max-width:600px){.vw-num b{font-size:17px}}';
    var st = document.createElement('style');
    st.id = 'vw-style'; st.textContent = css;
    document.head.appendChild(st);
  }
})();
