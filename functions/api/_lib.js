// Shared helpers for the visitor-analytics Pages Functions.
// Files starting with "_" are NOT routed by Cloudflare Pages, so this is import-only.

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

// Per-isolate random fallback salt, used only if IP_SALT is unset (preview env,
// unbound secret). Never a known constant, so stored hashes stay non-reversible
// even when misconfigured (dedup just degrades within that isolate). Lazily
// generated on first use — Workers forbid random generation in global scope.
let _fallbackSalt = null;

// Salted, truncated SHA-256 of the IP. One-way: we can dedupe/count visitors
// but never recover the original address.
export async function hashIp(ip, salt) {
  if (!salt) _fallbackSalt = _fallbackSalt || crypto.randomUUID();
  const data = new TextEncoder().encode((salt || _fallbackSalt) + '|' + (ip || ''));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// Constant-time string compare (avoids leaking the admin key's length/prefix via
// response timing). Length difference still returns false but in fixed time.
export function timingSafeEqual(a, b) {
  a = String(a); b = String(b);
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Reduce a referrer URL to its hostname (the useful "source"), or 'direct'.
export function refHost(referer) {
  if (!referer) return 'direct';
  try {
    const raw = String(referer).trim();
    const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
    const h = new URL(url).hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
    return h || 'direct';
  } catch {
    return 'direct';
  }
}

// Classify the original page referrer reported by the browser. The Referer on
// fetch('/api/hit') points to the current site, so it cannot identify the page
// that originally sent the visitor. Old cached clients without `r` fall back to
// the request header, treating a same-site header as direct rather than internal.
export function refSource(reportedReferrer, requestReferer, siteHost) {
  const hasReportedReferrer = reportedReferrer !== null && reportedReferrer !== undefined;
  const host = refHost(hasReportedReferrer ? reportedReferrer : requestReferer);
  if (host === 'direct') return 'direct';
  const currentHost = refHost(siteHost);
  if (host === currentHost) return hasReportedReferrer ? 'internal' : 'direct';
  return host;
}

// Coarse location for the current requester, supplied by Cloudflare at the edge.
// This is returned only to that requester and never includes the raw IP.
export function viewerLocation(request) {
  const cf = (request && request.cf) || {};
  const location = {
    city: cf.city || null,
    region: cf.regionCode || cf.region || null,
    country: cf.country || null,
  };
  return location.city || location.region || location.country ? location : null;
}

let _pageviewsReady = false;

// Idempotent runtime migration. This keeps existing deployments working even
// when Wrangler credentials are unavailable during a code-only deployment.
export async function ensurePageviews(db) {
  if (_pageviewsReady) return;
  await db.prepare(
    'CREATE TABLE IF NOT EXISTS pageviews (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT NOT NULL UNIQUE, ' +
      'ts INTEGER NOT NULL, day TEXT NOT NULL, month TEXT NOT NULL, visitor_hash TEXT NOT NULL, ' +
      'country TEXT, city TEXT, region TEXT, postal TEXT, lat REAL, lon REAL, ' +
      'timezone TEXT, org TEXT, referer TEXT, path TEXT)'
  ).run();
  for (const sql of [
    'CREATE INDEX IF NOT EXISTS idx_pageviews_ts ON pageviews(ts)',
    'CREATE INDEX IF NOT EXISTS idx_pageviews_day ON pageviews(day)',
    'CREATE INDEX IF NOT EXISTS idx_pageviews_month ON pageviews(month)',
    'CREATE INDEX IF NOT EXISTS idx_pageviews_path ON pageviews(path)',
    'CREATE INDEX IF NOT EXISTS idx_pageviews_visitor ON pageviews(visitor_hash)',
  ]) {
    await db.prepare(sql).run();
  }
  await db.prepare(
    "INSERT OR IGNORE INTO pageviews " +
      "(event_id, ts, day, month, visitor_hash, country, city, region, postal, lat, lon, timezone, org, referer, path) " +
      "SELECT 'legacy-' || id, ts, day, month, ip_hash, country, city, region, postal, lat, lon, timezone, org, referer, path FROM visits"
  ).run();
  _pageviewsReady = true;
}

// Aggregate numbers that are safe to expose publicly (no IPs, no per-visit rows).
export async function publicStats(db) {
  await ensurePageviews(db);
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const month = day.slice(0, 7);

  // Page-view counters. The unique value remains an estimated distinct IP hash.
  const agg = (await db
    .prepare(
      'SELECT COUNT(*) AS total, ' +
        'SUM(CASE WHEN day=? THEN 1 ELSE 0 END) AS today, ' +
        'SUM(CASE WHEN month=? THEN 1 ELSE 0 END) AS month, ' +
        'COUNT(DISTINCT visitor_hash) AS uniq, ' +
        'MIN(ts) AS since ' +
        'FROM pageviews'
    )
    .bind(day, month)
    .first()) || {};
  const total = agg.total || 0;
  const today = agg.today || 0;
  const monthCount = agg.month || 0;
  const unique = agg.uniq || 0;
  const since = agg.since || null;

  const cRes = await db
    .prepare("SELECT country AS code, COUNT(*) AS c FROM pageviews WHERE country IS NOT NULL AND country<>'' GROUP BY country ORDER BY c DESC")
    .all();
  const countries = (cRes.results || []).map((r) => ({ code: r.code, count: r.c }));

  // City-level dots for the map: lat/lon rounded to ~0.1deg (~11km) and aggregated,
  // so we never expose a single visitor's precise coordinates.
  const pRes = await db
    .prepare('SELECT ROUND(lat,1) AS lat, ROUND(lon,1) AS lon, COUNT(*) AS c FROM pageviews WHERE lat IS NOT NULL AND lon IS NOT NULL GROUP BY ROUND(lat,1), ROUND(lon,1) ORDER BY c DESC LIMIT 300')
    .all();
  const points = (pRes.results || []).map((r) => ({ lat: r.lat, lon: r.lon, c: r.c }));

  return { total, today, month: monthCount, unique, since, countries, points };
}
