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

// Salted, truncated SHA-256 of the IP. One-way: we can dedupe/count visitors
// but never recover the original address.
export async function hashIp(ip, salt) {
  const data = new TextEncoder().encode((salt || 'cv-default-salt') + '|' + (ip || ''));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
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

// Aggregate numbers that are safe to expose publicly (no IPs, no per-visit rows).
export async function publicStats(db) {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const month = day.slice(0, 7);

  const total = (await db.prepare('SELECT COUNT(*) AS c FROM visits').first('c')) || 0;
  const today = (await db.prepare('SELECT COUNT(*) AS c FROM visits WHERE day=?').bind(day).first('c')) || 0;
  const monthCount = (await db.prepare('SELECT COUNT(*) AS c FROM visits WHERE month=?').bind(month).first('c')) || 0;
  const unique = (await db.prepare('SELECT COUNT(DISTINCT ip_hash) AS c FROM visits').first('c')) || 0;
  const since = (await db.prepare('SELECT MIN(ts) AS t FROM visits').first('t')) || null;

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
