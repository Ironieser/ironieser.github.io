// /api/flipact — crowd results for the "be the observer" detection experiment on the
// FlipAct project page.
//
//   POST {mode, diff, pay, hits, fas}   store one finished run, then return the crowd summary
//   GET  ?mode=&diff=&d=                return the crowd summary only (nothing is stored)
//
// What is stored per run: the three settings, the hit and false-alarm counts, the two numbers
// derived from them, the day, and a salted one-way hash of the IP that is used only to cap
// repeat submissions. No name, no cookie, no location, no user agent.
import { json, hashIp } from './_lib.js';

const TRIALS_PER_KIND = 10;      // each run is 10 signal and 10 noise trials
const MAX_RUNS_PER_DAY = 40;     // per visitor hash
const MODES = ['look', 'listen'];

let ensured = false;
async function ensure(db) {
  if (ensured) return;
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS flipact_runs (
       id      INTEGER PRIMARY KEY AUTOINCREMENT,
       ts      INTEGER NOT NULL,
       day     TEXT    NOT NULL,
       visitor TEXT    NOT NULL,
       mode    TEXT    NOT NULL,
       diff    INTEGER NOT NULL,
       pay     INTEGER NOT NULL,
       hits    INTEGER NOT NULL,
       fas     INTEGER NOT NULL,
       dprime  REAL    NOT NULL,
       crit    REAL    NOT NULL
     )`
  ).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_flipact_cell ON flipact_runs(mode, diff)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_flipact_visitor ON flipact_runs(visitor, day)').run();
  ensured = true;
}

// Inverse normal CDF (Acklam). Same routine as the page, so stored values match what the
// visitor saw; the server recomputes d' and c from the counts and ignores any client value.
function zinv(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  let q, r;
  if (p < 0.02425) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - 0.02425) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

function coords(hits, fas) {
  const H = (hits + 0.5) / (TRIALS_PER_KIND + 1);   // log-linear correction, as on the page
  const F = (fas + 0.5) / (TRIALS_PER_KIND + 1);
  const zH = zinv(H), zF = zinv(F);
  return { d: zH - zF, c: -(zH + zF) / 2 };
}

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

async function summary(db, mode, diff, d) {
  const total = await db.prepare('SELECT COUNT(*) AS n FROM flipact_runs').first();
  const cell = await db
    .prepare('SELECT COUNT(*) AS n, AVG(dprime) AS d_mean FROM flipact_runs WHERE mode = ? AND diff = ?')
    .bind(mode, diff).first();
  let below = null;
  if (d !== null && cell && cell.n > 0) {
    const row = await db
      .prepare('SELECT COUNT(*) AS n FROM flipact_runs WHERE mode = ? AND diff = ? AND dprime < ?')
      .bind(mode, diff, d).first();
    below = row.n;
  }
  // Mean criterion under each stakes rule, over runs that were above chance.
  const pays = await db
    .prepare('SELECT pay, COUNT(*) AS n, AVG(crit) AS c_mean FROM flipact_runs WHERE mode = ? AND dprime >= 0.3 GROUP BY pay ORDER BY pay')
    .bind(mode).all();
  return {
    total: (total && total.n) || 0,
    cell: { n: (cell && cell.n) || 0, d_mean: cell ? cell.d_mean : null, below },
    pays: (pays.results || []).map((r) => ({ pay: r.pay, n: r.n, c_mean: r.c_mean })),
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  if (!db) return json({ error: 'no-db' });
  try {
    await ensure(db);
    const url = new URL(request.url);

    if (request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ error: 'bad-json' }, 400); }
      const { mode, diff, pay, hits, fas } = body || {};
      if (!MODES.includes(mode) || !isInt(diff, 0, 2) || !isInt(pay, 0, 2) ||
          !isInt(hits, 0, TRIALS_PER_KIND) || !isInt(fas, 0, TRIALS_PER_KIND)) {
        return json({ error: 'bad-run' }, 400);
      }
      const now = Math.floor(Date.now() / 1000);
      const day = new Date().toISOString().slice(0, 10);
      const visitor = await hashIp(request.headers.get('CF-Connecting-IP') || '', env.IP_SALT);
      const seen = await db
        .prepare('SELECT COUNT(*) AS n FROM flipact_runs WHERE visitor = ? AND day = ?')
        .bind(visitor, day).first();
      const { d, c } = coords(hits, fas);
      const stored = !seen || seen.n < MAX_RUNS_PER_DAY;
      if (stored) {
        await db
          .prepare('INSERT INTO flipact_runs (ts, day, visitor, mode, diff, pay, hits, fas, dprime, crit) VALUES (?,?,?,?,?,?,?,?,?,?)')
          .bind(now, day, visitor, mode, diff, pay, hits, fas, d, c).run();
      }
      return json({ stored, ...(await summary(db, mode, diff, d)) });
    }

    const mode = url.searchParams.get('mode');
    const diff = Number(url.searchParams.get('diff'));
    const dq = url.searchParams.get('d');
    if (!MODES.includes(mode) || !isInt(diff, 0, 2)) return json({ error: 'bad-query' }, 400);
    const d = dq === null || dq === '' || isNaN(Number(dq)) ? null : Number(dq);
    return json({ stored: false, ...(await summary(db, mode, diff, d)) });
  } catch (e) {
    return json({ error: String(e) });
  }
}
