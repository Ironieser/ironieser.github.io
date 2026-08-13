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
    const h = new URL(referer).hostname;
    return h || 'direct';
  } catch {
    return 'direct';
  }
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

// Aggregate numbers that are safe to expose publicly (no IPs, no per-visit rows).
export async function publicStats(db) {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const month = day.slice(0, 7);

  // All five scalar aggregates in one scan instead of five round-trips.
  const agg = (await db
    .prepare(
      'SELECT COUNT(*) AS total, ' +
        'SUM(CASE WHEN day=? THEN 1 ELSE 0 END) AS today, ' +
        'SUM(CASE WHEN month=? THEN 1 ELSE 0 END) AS month, ' +
        'COUNT(DISTINCT ip_hash) AS uniq, ' +
        'MIN(ts) AS since ' +
        'FROM visits'
    )
    .bind(day, month)
    .first()) || {};
  const total = agg.total || 0;
  const today = agg.today || 0;
  const monthCount = agg.month || 0;
  const unique = agg.uniq || 0;
  const since = agg.since || null;

  const cRes = await db
    .prepare("SELECT country AS code, COUNT(*) AS c FROM visits WHERE country IS NOT NULL AND country<>'' GROUP BY country ORDER BY c DESC")
    .all();
  const countries = (cRes.results || []).map((r) => ({ code: r.code, count: r.c }));

  // City-level dots for the map: lat/lon rounded to ~0.1deg (~11km) and aggregated,
  // so we never expose a single visitor's precise coordinates.
  const pRes = await db
    .prepare('SELECT ROUND(lat,1) AS lat, ROUND(lon,1) AS lon, COUNT(*) AS c FROM visits WHERE lat IS NOT NULL AND lon IS NOT NULL GROUP BY ROUND(lat,1), ROUND(lon,1) ORDER BY c DESC LIMIT 300')
    .all();
  const points = (pRes.results || []).map((r) => ({ lat: r.lat, lon: r.lon, c: r.c }));

  return { total, today, month: monthCount, unique, since, countries, points };
}
