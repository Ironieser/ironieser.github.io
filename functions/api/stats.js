// GET /api/stats — public aggregate numbers only (no IPs, no per-visit rows).
import { json, publicStats } from './_lib.js';

export async function onRequest({ env }) {
  const db = env.DB;
  if (!db) return json({ error: 'no-db' });
  try {
    return json(await publicStats(db));
  } catch (e) {
    return json({ error: String(e) });
  }
}
