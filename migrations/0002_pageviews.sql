CREATE TABLE IF NOT EXISTS pageviews (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id     TEXT    NOT NULL UNIQUE,
  ts           INTEGER NOT NULL,
  day          TEXT    NOT NULL,
  month        TEXT    NOT NULL,
  visitor_hash TEXT    NOT NULL,
  country      TEXT,
  city         TEXT,
  region       TEXT,
  postal       TEXT,
  lat          REAL,
  lon          REAL,
  timezone     TEXT,
  org          TEXT,
  referer      TEXT,
  path         TEXT
);

CREATE INDEX IF NOT EXISTS idx_pageviews_ts      ON pageviews(ts);
CREATE INDEX IF NOT EXISTS idx_pageviews_day     ON pageviews(day);
CREATE INDEX IF NOT EXISTS idx_pageviews_month   ON pageviews(month);
CREATE INDEX IF NOT EXISTS idx_pageviews_path    ON pageviews(path);
CREATE INDEX IF NOT EXISTS idx_pageviews_visitor ON pageviews(visitor_hash);

-- Seed one minimum historical page view from each existing hourly visit.
INSERT OR IGNORE INTO pageviews (
  event_id, ts, day, month, visitor_hash, country, city, region, postal,
  lat, lon, timezone, org, referer, path
)
SELECT
  'legacy-' || id, ts, day, month, ip_hash, country, city, region, postal,
  lat, lon, timezone, org, referer, path
FROM visits;
