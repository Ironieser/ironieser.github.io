-- Crowd results for the detection experiment on /projects/flipact.
-- The function creates this table on first use; this file documents the schema and lets it be
-- applied by hand:  npx wrangler d1 execute homepage-visits --remote --file=./migrations/0003_flipact_runs.sql
CREATE TABLE IF NOT EXISTS flipact_runs (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      INTEGER NOT NULL,   -- unix epoch seconds (UTC)
  day     TEXT    NOT NULL,   -- 'YYYY-MM-DD' (UTC)
  visitor TEXT    NOT NULL,   -- salted one-way hash of the IP, used only to cap repeat submissions
  mode    TEXT    NOT NULL,   -- 'look' | 'listen'
  diff    INTEGER NOT NULL,   -- 0 easier, 1 standard, 2 harder
  pay     INTEGER NOT NULL,   -- 0 nothing at stake, 1 misses costly, 2 false alarms costly
  hits    INTEGER NOT NULL,   -- out of 10 signal trials
  fas     INTEGER NOT NULL,   -- out of 10 noise trials
  dprime  REAL    NOT NULL,   -- recomputed on the server from hits and fas
  crit    REAL    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_flipact_cell    ON flipact_runs(mode, diff);
CREATE INDEX IF NOT EXISTS idx_flipact_visitor ON flipact_runs(visitor, day);
