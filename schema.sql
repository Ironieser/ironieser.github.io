-- Self-hosted visitor analytics (Cloudflare D1)
-- Each row is one deduplicated visit (same ip_hash within 1h counts once).
CREATE TABLE IF NOT EXISTS visits (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      INTEGER NOT NULL,   -- unix epoch seconds (UTC)
  day     TEXT    NOT NULL,   -- 'YYYY-MM-DD' (UTC)
  month   TEXT    NOT NULL,   -- 'YYYY-MM'    (UTC)
  ip_hash TEXT    NOT NULL,   -- salted SHA-256 of the IP, truncated (not reversible)
  country  TEXT,              -- ISO-2 from Cloudflare edge, e.g. 'CN', 'US'
  city     TEXT,
  region   TEXT,              -- state / province
  postal   TEXT,              -- postal / ZIP code
  lat      REAL,              -- approximate latitude  (city-level)
  lon      REAL,              -- approximate longitude (city-level)
  timezone TEXT,              -- e.g. 'Asia/Shanghai'
  org      TEXT,              -- ISP / AS organization
  referer  TEXT,              -- referrer hostname, 'direct', or 'internal'
  path     TEXT               -- page path that was viewed
);

CREATE INDEX IF NOT EXISTS idx_visits_ts        ON visits(ts);
CREATE INDEX IF NOT EXISTS idx_visits_iphash_ts ON visits(ip_hash, ts);
CREATE INDEX IF NOT EXISTS idx_visits_day        ON visits(day);
CREATE INDEX IF NOT EXISTS idx_visits_month      ON visits(month);
CREATE INDEX IF NOT EXISTS idx_visits_country    ON visits(country);
