/* Self-hosted visitor analytics widget.
 * Records a visit via /api/hit (1h de-dup, server-side) and renders a counter
 * plus an ECharts world map: countries shaded by visit count + rippling city
 * dots (lat/lon). No third-party services. Loaded lazily on footer scroll. */
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
    set('vw-unique', fmt(s.unique));
    renderViewerLocation(s.viewer);
    var sinceEl = document.getElementById('vw-since');
    if (sinceEl) {
      // Display in UTC to match the UTC day/month buckets the counters use.
      sinceEl.textContent = s.since ? 'Tracking since ' + new Date(s.since * 1000).toISOString().slice(0, 10) + ' UTC' : '';
    }
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
        // Keep the map's true geographic proportions while filling the compact
        // footer canvas. A larger layoutSize removes the empty bands that appear
        // when ECharts scales from the canvas's shorter dimension.
        aspectScale: 1, layoutCenter: ['50%', '50%'], layoutSize: '180%',
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
      '.visitor-widget{max-width:560px;margin:0 auto}' +
      '.vw-card{border:1px solid var(--color-border,#e6e9ef);border-radius:16px;padding:18px 18px 14px;background:var(--color-surface,#fff)}' +
      '.vw-head{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;color:var(--color-primary,#222);margin-bottom:12px}' +
      '.vw-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.18)}' +
      '.vw-nums{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:6px}' +
      '.vw-num{text-align:center}' +
      '.vw-num b{display:block;font-size:20px;line-height:1.1;color:var(--color-primary,#1d4ed8);font-variant-numeric:tabular-nums}' +
      '.vw-num span{font-size:11px;color:var(--color-secondary,#888)}' +
      '.vw-map{width:100%;height:150px;margin:2px 0}' +
      '.vw-since{text-align:center;font-size:11px;color:var(--color-secondary,#9aa3b2);margin-top:4px;opacity:.8}' +
      '@media(max-width:600px){.vw-num b{font-size:17px}.vw-map{height:140px}}';
    var st = document.createElement('style');
    st.id = 'vw-style'; st.textContent = css;
    document.head.appendChild(st);
  }
})();
