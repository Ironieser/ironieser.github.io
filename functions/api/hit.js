// POST /api/hit?p=<path>
// Records every page view plus one 10-minute session per visitor.
// Only POST records a visit; GET just returns stats (prevents prefetch/crawler/img inflation).
import { json, hashIp, refSource, publicStats, viewerLocation, ensurePageviews } from './_lib.js';

const BUCKET_SECONDS = 600; // visitors are de-duped per clock-aligned 10-minute bucket

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  if (!db) return json({ error: 'no-db' });

  try {
    const url = new URL(request.url);
    if (request.method === 'POST') {
      const cf = request.cf || {};
      const ip = request.headers.get('CF-Connecting-IP') || '';
      const ipHash = await hashIp(ip, env.IP_SALT);
      const now = Math.floor(Date.now() / 1000);
      const bucket = Math.floor(now / BUCKET_SECONDS);
      const d = new Date();
      const day = d.toISOString().slice(0, 10);
      const month = day.slice(0, 7);
      const path = (url.searchParams.get('p') || '/').slice(0, 300);
      const eventId = (url.searchParams.get('e') || crypto.randomUUID()).slice(0, 100);
      const src = refSource(
        url.searchParams.get('r'),
        request.headers.get('Referer'),
        url.hostname
      );
      const num = (v) => (v === undefined || v === null || v === '' || isNaN(Number(v)) ? null : Number(v));
      await ensurePageviews(db);
      await db
        .prepare(
          'INSERT OR IGNORE INTO pageviews (event_id, ts, day, month, visitor_hash, country, city, region, postal, lat, lon, timezone, org, referer, path) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        )
        .bind(
          eventId, now, day, month, ipHash,
          cf.country || null, cf.city || null, cf.region || null, cf.postalCode || null,
          num(cf.latitude), num(cf.longitude), cf.timezone || null, cf.asOrganization || null,
          src, path
        )
        .run();
      // Atomic de-dup: a UNIQUE index on (ip_hash, bucket) makes a concurrent
      // second insert from the same visitor in the same hour a no-op.
      await db
        .prepare(
          'INSERT OR IGNORE INTO visits (ts, bucket, day, month, ip_hash, country, city, region, postal, lat, lon, timezone, org, referer, path) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        )
        .bind(
          now, bucket, day, month, ipHash,
          cf.country || null, cf.city || null, cf.region || null, cf.postalCode || null,
          num(cf.latitude), num(cf.longitude), cf.timezone || null, cf.asOrganization || null,
          src, path
        )
        .run();
    }

    const stats = await publicStats(db);
    return json({ ...stats, viewer: viewerLocation(request) });
  } catch (e) {
    return json({ error: String(e) });
  }
}
