// GET /api/stats — public aggregate numbers only (no IPs, no per-visit rows).
import { json, publicStats, viewerLocation } from './_lib.js';

export async function onRequest({ env, request }) {
  const db = env.DB;
  if (!db) return json({ error: 'no-db' });
  try {
    const stats = await publicStats(db);
    return json({ ...stats, viewer: viewerLocation(request) });
  } catch (e) {
    return json({ error: String(e) });
  }
}
