// POST/GET /api/hit?p=<path>
// Records one visit, de-duplicated per visitor (ip_hash) within a 1-hour window,
// then returns the public aggregate stats so the widget can render in one round-trip.
import { json, hashIp, refHost, publicStats } from './_lib.js';

const DEDUP_SECONDS = 3600; // 1h visitor de-duplication window

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  if (!db) return json({ error: 'no-db' });

  try {
    const url = new URL(request.url);
    const cf = request.cf || {};
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const ipHash = await hashIp(ip, env.IP_SALT);
    const now = Math.floor(Date.now() / 1000);

    const seen = await db
      .prepare('SELECT 1 FROM visits WHERE ip_hash=? AND ts>? LIMIT 1')
      .bind(ipHash, now - DEDUP_SECONDS)
      .first();

    if (!seen) {
      const d = new Date();
      const day = d.toISOString().slice(0, 10);
      const month = day.slice(0, 7);
      const path = (url.searchParams.get('p') || '/').slice(0, 200);
      const host = refHost(request.headers.get('Referer'));
      const src = host === url.hostname ? 'internal' : host;
      const num = (v) => (v === undefined || v === null || v === '' || isNaN(Number(v)) ? null : Number(v));
      await db
        .prepare(
          'INSERT INTO visits (ts, day, month, ip_hash, country, city, region, postal, lat, lon, timezone, org, referer, path) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        )
        .bind(
          now, day, month, ipHash,
          cf.country || null, cf.city || null, cf.region || null, cf.postalCode || null,
          num(cf.latitude), num(cf.longitude), cf.timezone || null, cf.asOrganization || null,
          src, path
        )
        .run();
    }

    return json(await publicStats(db));
  } catch (e) {
    return json({ error: String(e) });
  }
}
