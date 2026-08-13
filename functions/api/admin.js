// GET /api/admin?key=<ADMIN_KEY> — private analytics.
// Returns monthly totals, top countries/cities/referrers, and a recent-visit log.
// IPs are never returned in full (only an 8-char hash prefix).
import { json, timingSafeEqual, ensurePageviews } from './_lib.js';

export async function onRequest({ request, env }) {
  const db = env.DB;
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || request.headers.get('x-admin-key') || '';
  if (!env.ADMIN_KEY || !timingSafeEqual(key, env.ADMIN_KEY)) return json({ error: 'unauthorized' }, 401);
  if (!db) return json({ error: 'no-db' });

  try {
    await ensurePageviews(db);
    const rows = async (sql, ...bind) => (await db.prepare(sql).bind(...bind).all()).results || [];

    const monthly = await rows(
      'SELECT month, COUNT(*) AS visits, COUNT(DISTINCT visitor_hash) AS uniques FROM pageviews GROUP BY month ORDER BY month DESC LIMIT 24'
    );
    const countries = await rows(
      "SELECT country AS code, COUNT(*) AS c FROM pageviews WHERE country IS NOT NULL AND country<>'' GROUP BY country ORDER BY c DESC LIMIT 60"
    );
    const cities = await rows(
      "SELECT city, region, postal, country, COUNT(*) AS c FROM pageviews WHERE city IS NOT NULL AND city<>'' GROUP BY city, region, country ORDER BY c DESC LIMIT 50"
    );
    const referers = await rows(
      'SELECT referer, COUNT(*) AS c FROM pageviews GROUP BY referer ORDER BY c DESC LIMIT 40'
    );
    const orgs = await rows(
      "SELECT org, COUNT(*) AS c FROM pageviews WHERE org IS NOT NULL AND org<>'' GROUP BY org ORDER BY c DESC LIMIT 30"
    );
    const recent = await rows(
      "SELECT ts, country, city, region, postal, lat, lon, timezone, org, referer, path, substr(visitor_hash,1,8) AS ip FROM pageviews ORDER BY ts DESC LIMIT 150"
    );
    const pages = await rows(
      "SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS uniques FROM pageviews GROUP BY path ORDER BY views DESC LIMIT 50"
    );

    const total = (await db.prepare('SELECT COUNT(*) AS c FROM pageviews').first('c')) || 0;
    const unique = (await db.prepare('SELECT COUNT(DISTINCT visitor_hash) AS c FROM pageviews').first('c')) || 0;
    const sessions = (await db.prepare('SELECT COUNT(*) AS c FROM visits').first('c')) || 0;

    return json({ total, unique, sessions, monthly, countries, cities, referers, orgs, pages, recent });
  } catch (e) {
    return json({ error: String(e) });
  }
}
