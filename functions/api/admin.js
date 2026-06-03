// GET /api/admin?key=<ADMIN_KEY> — private analytics.
// Returns monthly totals, top countries/cities/referrers, and a recent-visit log.
// IPs are never returned in full (only an 8-char hash prefix).
import { json } from './_lib.js';

export async function onRequest({ request, env }) {
  const db = env.DB;
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || request.headers.get('x-admin-key');
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({ error: 'unauthorized' }, 401);
  if (!db) return json({ error: 'no-db' });

  try {
    const rows = async (sql, ...bind) => (await db.prepare(sql).bind(...bind).all()).results || [];

    const monthly = await rows(
      'SELECT month, COUNT(*) AS visits, COUNT(DISTINCT ip_hash) AS uniques FROM visits GROUP BY month ORDER BY month DESC LIMIT 24'
    );
    const countries = await rows(
      "SELECT country AS code, COUNT(*) AS c FROM visits WHERE country IS NOT NULL AND country<>'' GROUP BY country ORDER BY c DESC LIMIT 60"
    );
    const cities = await rows(
      "SELECT city, region, country, COUNT(*) AS c FROM visits WHERE city IS NOT NULL AND city<>'' GROUP BY city, country ORDER BY c DESC LIMIT 40"
    );
    const referers = await rows(
      'SELECT referer, COUNT(*) AS c FROM visits GROUP BY referer ORDER BY c DESC LIMIT 40'
    );
    const recent = await rows(
      "SELECT ts, country, city, region, referer, path, substr(ip_hash,1,8) AS ip FROM visits ORDER BY ts DESC LIMIT 150"
    );

    const total = (await db.prepare('SELECT COUNT(*) AS c FROM visits').first('c')) || 0;
    const unique = (await db.prepare('SELECT COUNT(DISTINCT ip_hash) AS c FROM visits').first('c')) || 0;

    return json({ total, unique, monthly, countries, cities, referers, recent });
  } catch (e) {
    return json({ error: String(e) });
  }
}
