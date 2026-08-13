# Self-hosted Visitor Analytics (Cloudflare Pages Functions + D1)

Replaces ClustrMaps with a counter + world map that you fully own. No third-party
service, fast everywhere (Cloudflare edge), and it stores its own visit log so you
can query IP-hash / source / monthly totals later.

- **Endpoints** (same-origin, work on every domain the Pages project serves — `sixundong.com`, `cv.ironieser.cc`, …):
  - `POST /api/hit?p=<path>` — records a visit (1h per-visitor de-dup), returns public stats.
  - `GET  /api/stats` — public aggregate (total / today / month / unique / per-country). No IPs.
  - `GET  /api/admin?key=<ADMIN_KEY>` — private: monthly series, top countries/cities/referrers, recent visits (only an 8-char IP-hash prefix, never the raw IP).
- **Privacy**: the IP is salted-SHA-256 + truncated before storage; the raw IP is never written.
- **Current visitor location**: the footer may show the requester's Cloudflare-provided city,
  region, and country. The row is hidden when that coarse metadata is unavailable.
- **Referrer source**: the browser sends only the original page referrer's hostname.
  Empty referrers are stored as `direct`, same-site navigation as `internal`, and
  external sources as their hostname.

## One-time setup (~5 minutes)

You need the Cloudflare account that owns the Pages project. Either the dashboard
or the CLI works — pick one.

### Option A — Dashboard (no CLI)

1. **Create the database**: Cloudflare dashboard → *Storage & Databases → D1 → Create* →
   name it `homepage-visits`.
2. **Create the table**: open the new DB → *Console* → paste the contents of
   [`schema.sql`](../schema.sql) → Run.
3. **Bind it to Pages**: your Pages project → *Settings → Functions → D1 database bindings →
   Add binding*:
   - Variable name: `DB`
   - D1 database: `homepage-visits`
4. **Add secrets**: Pages project → *Settings → Environment variables* (Production), add:
   - `IP_SALT` = any long random string (used to hash IPs)
   - `ADMIN_KEY` = a password you choose (to open `/api/admin`)
5. **Redeploy**: *Deployments → Retry deployment* (or just push any commit).

### Option B — CLI (wrangler)

```bash
npx wrangler login                                   # opens browser once
npx wrangler d1 create homepage-visits               # note the database_id it prints
npx wrangler d1 execute homepage-visits --remote --file=./schema.sql

# Bind DB + set secrets on the Pages project (replace <PROJECT> with your Pages project name):
npx wrangler pages secret put IP_SALT  --project-name <PROJECT>
npx wrangler pages secret put ADMIN_KEY --project-name <PROJECT>
```

Then add the D1 binding (variable name `DB`) either in the dashboard (Option A step 3)
or by adding this to a root `wrangler.toml`:

```toml
name = "<PROJECT>"            # your Pages project name
pages_build_output_dir = "."

[[d1_databases]]
binding = "DB"
database_name = "homepage-visits"
database_id = "<id from d1 create>"
```

## Verify

- Visit the site, then open `https://sixundong.com/api/stats` → should return JSON with counts.
- Your private dashboard data: `https://sixundong.com/api/admin?key=<ADMIN_KEY>`.

## Notes

- Until the D1 binding exists, the endpoints return `{"error":"no-db"}` and the footer
  widget simply stays quiet — it never blocks the page.
- Visitor de-dup window is 1 hour (same visitor within 1h counts once). Change
  `DEDUP_SECONDS` in `functions/api/hit.js` to adjust.
- To migrate the old ClustrMaps running total, seed it once:
  `INSERT INTO visits (ts,day,month,ip_hash,country,referer,path) ...` is not needed —
  instead just keep the new count, or add a constant offset in the widget if you want.
