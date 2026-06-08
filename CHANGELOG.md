# Changelog

## [v1.6.2] - 2026-06-08

### 🗺️ Map aspect-ratio fix

- **Distorted world map fixed** — the `geo` block pinned all four edges (`left/right/top/bottom`), which stretched the map to fill its box and warped country shapes. Switched both the footer widget (`visitor-map.js`) and the admin dashboard (`stats.html`) to `aspectScale:1` + `layoutCenter`/`layoutSize`, so the map fits its container while preserving true geographic proportions. Cache-buster bumped to `v=10`.

## [v1.6.1] - 2026-06-04

### 🐞 Visitor-analytics review fixes

- **Blog page regression fixed** — `build-blog-page.js` still emitted the old ClustrMaps `<script>` (with an empty domain); migrated it to the self-hosted widget so all three pages match.
- **Atomic visitor de-dup** — replaced the racy SELECT-then-INSERT with a `bucket` column + `UNIQUE(ip_hash, bucket)` index and `INSERT OR IGNORE`, so concurrent hits from one visitor in the same hour can no longer double-count (verified with a 5-way concurrent burst).
- **Record only on POST** — `GET /api/hit` no longer records, stopping prefetch/crawler/`<img>` inflation.
- **Map coverage** — fixed ISO-2 extraction in the world-map build (e.g. Taiwan now colours; HK/MO have no separate polygon at 110m and show as dots).
- **Security/privacy** — constant-time admin-key comparison; `IP_SALT` fallback now a per-isolate random value (lazily generated; never a public constant) instead of a hardcoded salt.
- **Hardening/perf** — escape country code in the dashboard; collapse five scalar stat queries into one scan; UTC-consistent "Tracking since" display; remove dead `lerpHex`.

## [v1.6.0] - 2026-06-04

### 📊 Self-hosted Visitor Analytics + 🗺️ Map + ⚡ Perf + 🧹 Cleanup

#### ✨ New: Self-hosted visitor analytics (replaces ClustrMaps)

- **Own your data** — Cloudflare Pages Functions (`functions/api/hit|stats|admin.js`) + D1 database replace the third-party ClustrMaps widget, which had a multi-day authoritative-DNS outage and frequently blocked/slowed load for visitors in China.
- **Counter + world map** in the footer: total / unique / this-month / today, plus an ECharts world map shaded by visit count with rippling city dots (ClustrMaps-style), `Tracking since <date>`.
- **Privacy-first** — IPs stored as salted-SHA-256, truncated (one-way); visitor de-dup window = 1h. Records country/region/city/postal/lat-lon/timezone/ISP per visit (city-level max precision).
- **Private dashboard** at `/stats` (key-gated): monthly trend, top countries/cities/sources/ISPs, recent-visits log, and the same map. See `docs/VISITOR_ANALYTICS.md`.
- **Lazy-loaded** — the whole widget (incl. map libs) only loads when the footer scrolls into view, so it never blocks initial page load.

#### 🗺️ Map: ECharts (slim, self-hosted)

- Switched from jsVectorMap to a **custom slim ECharts build** (only map + effectScatter + geo/visualMap/tooltip, ~172KB gzip) + an ISO-2-indexed, coordinate-simplified world map (~51KB gzip). Build script: `scripts/build-echarts-slim.js`.
- Choropleth via `visualMap` gradient (fixes jsVectorMap's bug that rendered the max-value country pure black) + rippling visitor dots from lat/lon.

#### ⚡ Performance

- **Removed unused CDN scripts** — cytoscape / dagre / cytoscape-dagre (~1MB) were loaded on every page but never actually called; deleted.
- **Compressed teasers** — 19 teaser images 5.8MB → ~700KB (resize 640px / q82); homepage referenced image weight ~2.5MB+ → ~400KB.
- **Lazy-load** publication images (`loading="lazy"` + width/height) and the visitor widget.

#### 🔧 Content / fixes

- **Featured publications are now fully manual** — removed the citation-based auto-featuring in `sync-scholar.js` that kept re-adding papers the user had curated out; restored the hand-picked 9.
- **Survey papers merged into year listing** — dropped the separate "Survey Papers" section on the publications page; they now sit in their by-date year group.

#### 🧹 Repository cleanup

- Removed orphaned/leftover assets: unused teasers (`data_survey`, `Journal`), blog images (`mmtok/tab3-4`, `timesclip/fig5-6`), `profile.jpg`, `transsion.jpeg`, three unlinked paper PDFs (~10MB), and `pagelogo*` favicon source images (~2.5MB).
- Removed the superseded `scripts/scholar_sync_python.py` (the Node `sync-scholar.js` is what runs).
- _Note:_ `config/config.json` (legacy fallback) retained for now; slated for removal at v2.0.

---

## [v1.5.0] - 2026-03-06

### 🌿 Template / Personal Branch Separation

#### ✨ Changes

- **Clean template demo data** — `master` branch now ships with a fully fictitious demo user ("Alex Zhang") that showcases every template feature (oral badge, featured, TL;DR, coming\_soon links, under-review, preprint, survey section, multi-link types) without any real personal information.
- **Personal content isolated to `ironieser` branch** — All real author data, blog posts, paper images, project pages, CV PDFs, and `CNAME` have been moved off `master` and live exclusively in the `ironieser` personal branch.
- **Scholar sync targets personal branch** — `sync-scholar.yml` now explicitly checks out and pushes to the `ironieser` branch so automated Scholar updates never overwrite the template demo data on `master`.
- **Repo set as GitHub Template** — `master` is now a clean, one-click-usable GitHub Template Repository; new users can click **"Use this template"** to instantly get a clean starting point.

#### 🗂 Branch Structure (for template authors)

```
master    ← clean template + demo data  (GitHub Template, default branch)
ironieser ← personal site with real content + deploy via Cloudflare Pages
dev       ← (optional) feature development, merge into master when stable
```

---

## [v1.4.0] - 2026-03-06

### 🌙 Dark Mode & UI Polish

#### ✨ New Features

- **Dark Mode toggle** — Three-way cycle: ☀️ Day / 🌙 Night / 🌓 Auto (follows system preference). Choice persisted via `localStorage`, applied before paint to avoid flash.
- **Back-to-Top button** — Fixed `↑` chevron button aligned to content column right edge; smooth-scrolls to top; auto-shows after scrolling 320px; hover animates to accent color.
- **Mobile pub images — blurred background effect** — On mobile each publication teaser image is wrapped in a container whose `::before` shows the same image blurred (`backdrop blur 14px`) as a fill, so `object-fit: contain` images no longer have plain padding gaps. Placeholder images (`underreview.jpg`) are auto-hidden on mobile.
- **TL;DR glassmorphism** — Refined `backdrop-filter: blur(18px)` with semi-transparent background (`rgba(..., 0.82)`) for day and night modes. Border upgraded to `2px` violet.
- **Unified pub card borders** — Pub cards use a very subtle border in default state; hover reveals a distinct highlight. Dark mode: deep dark base with lighter gray on hover.

#### 🎨 UI Improvements

- Dark mode background changed from pure black (`#0a0a0a`) to deep blue-slate (`#020617` / `#0f172a`) — less harsh, more refined.
- Recent News filter tags in dark mode use a translucent indigo style (not solid purple) — more readable.
- News items in dark mode no longer have card frames — matches day mode and shows more items.
- Publication stats bar is now centered below the research intro.
- Experience section: removed hover border and shadow — now purely static layout.
- Reviewer section `Conference / Journal` labels highlighted with accent color.
- Intern company name color now follows theme variable instead of a hard-coded dark value.
- `filter-btn.active` in dark mode uses a lighter, more vibrant indigo instead of washed-out gray.

#### 📱 Mobile Improvements

- Publication cards switch to vertical layout (image on top, text below) on mobile.
- Publication images: unified `aspect-ratio: none` replaced by a fixed-height wrapper with blurred bg; 90% card width; `object-fit: contain` keeps full image visible.
- Back-to-Top also available on `publications.html` and `blog.html`.

---

## [v1.3.0] - 2026-03-05

### 🗒️ TL;DR Popovers

- Added **TL;DR popovers** for publications — hover on desktop or tap on mobile for instant paper summaries.
- Added `tldr` field support in `config/content.json`.
- Glassmorphism floating tooltip above the hovered pub card with smooth spring animation.
- Mobile: tap-to-expand accordion with max-height animation.

---

## [v1.2.0] - 2026-03-04

### 🎉 Major Update - Config Reorganization & Cleaner Root

Configuration has been split, renamed, and moved into a single **`config/`** directory. The repo root is simpler and config is easier to maintain.

### ✨ New Features

- **Config directory**: All config files now live under `config/`:
  - **`config/content.json`** — Your content (personal, news, publications, experience, education, service)
  - **`config/meta.json`** — Template info & Scholar sync status (edited by scripts)
  - **`config/site.yaml`** — One-time setup: SEO, visitor map, redirects
  - **`config/config.json`** — Legacy merge of meta + site (written by sync-scholar; no duplicate content)
- **No duplicate content**: `config.json` only stores meta + site. Build always prefers `content.json` + `meta.json`; Scholar sync writes all three without repeating publications/news in `config.json`.
- **Simpler config names**: Dropped the `config.` prefix — `content.json`, `meta.json`, `site.yaml` (inside `config/`).
- **Waline comments**: `serverURL` can point to an independent subdomain (e.g. `https://comments.example.com`) so comments are not affected by domain redirects.
- **npm build**: `package.json` has a `build` script; CI uses `npm ci` and `npm run build` so dependencies are defined in one place.

### 🔄 Breaking Changes

#### Config Location and Names

**Before (root):**
```
├── config.content.json
├── config.meta.json
├── config.site.yaml
└── config.json          # full copy (content + meta + site)
```

**After (`config/`):**
```
├── config/
│   ├── content.json    # content only
│   ├── meta.json       # template + sync status
│   ├── site.yaml       # SEO, visitor_map, redirects
│   ├── config.json     # meta + site only (legacy)
│   └── README.md
```

- All build scripts and GitHub Actions now read/write under `config/`.
- If you had custom paths or scripts pointing at `config.content.json` / `config.json` in the root, update them to `config/content.json` and `config/config.json`.

### 📝 Migration for Existing Users

If you already use the split config (content + meta + site) or a single `config.json`:

1. **Pull the latest changes:**
   ```bash
   git pull origin main  # or master
   ```

2. **Move config into `config/`** (if you still have files in root):
   ```bash
   mkdir -p config
   mv content.json config/ 2>/dev/null || true
   mv meta.json config/ 2>/dev/null || true
   mv site.yaml config/ 2>/dev/null || true
   mv config.json config/ 2>/dev/null || true
   ```

3. **Local build** (optional):
   ```bash
   npm ci
   npm run build
   # or: python scripts/build_local.py
   ```

4. **Verify** — GitHub Actions will build from `config/`; check that the site and Scholar sync still work.

### ⚠️ Notes

- **Scholar sync** updates `config/content.json`, `config/meta.json`, and `config/config.json` (meta+site only).
- **Fallback**: If `config/content.json` is missing, the build falls back to `config/config.json` (which no longer contains publications/news, so keep `content.json` in place).
- README and `config/README.md` describe the new layout.

---

## [v1.1.0] - 2026-01-13

### 🎉 Major Update - File Structure Reorganization

This is a **significant update** that reorganizes the project structure. If you've already forked this template, please read the migration guide below.

### ✨ New Features

- **Visitor Map Configuration**: Added `visitor_map` section (in `config/site.yaml` or legacy `config/config.json`) for easy visitor map management
- **Improved File Organization**: CSS and JS files moved to `assets/` directory for better structure

### 🔄 Breaking Changes

#### File Structure Changes

**Before:**
```
├── styles.css
├── script.js
├── blog.css
├── blog-comments.css
├── blog-comments.js
└── blog-data.js
```

**After:**
```
├── assets/
│   ├── css/
│   │   ├── styles.css
│   │   ├── blog.css
│   │   └── blog-comments.css
│   └── js/
│       ├── script.js
│       ├── blog-comments.js
│       └── blog-data.js (auto-generated)
```

#### Scripts Directory

**Before:**
```
├── build_local.py
├── local_server.py
└── ...
```

**After:**
```
├── scripts/
│   ├── build_local.py
│   ├── local_server.py
│   └── ...
```

### 📝 Required Actions for Existing Users (v1.1.0)

If you're upgrading from before v1.2.0 and still have the old root-level config layout, first apply the **v1.2.0 migration** (move config into `config/`). Then, if you're coming from pre–v1.1.0:

1. **Move your CSS/JS files** (if you have custom modifications):
   ```bash
   mkdir -p assets/css assets/js
   mv styles.css assets/css/ 2>/dev/null || true
   mv script.js assets/js/ 2>/dev/null || true
   mv blog.css assets/css/ 2>/dev/null || true
   mv blog-comments.css assets/css/ 2>/dev/null || true
   mv blog-comments.js assets/js/ 2>/dev/null || true
   ```

2. **Visitor map** — Configure in `config/site.yaml` (or legacy `config/config.json`):
   ```yaml
   visitor_map:
     domain_id: "YOUR_CLUSTRMAPS_ID"
   ```
   Or get your ID from [clustrmaps.com](https://clustrmaps.com).

3. **Re-run build**: `npm run build` or `python scripts/build_local.py`, then verify.

### 🔧 Configuration (v1.1.0)

- **SEO**: Update `website_url`, `github_pages_url`, `author` in `config/site.yaml` (or your config).
- **Visitor map**: Can be disabled or set with your ClustrMaps `domain_id`.

### 📚 Documentation

- Updated README with detailed setup instructions
- Added favicon generation guide
- Added migration instructions for existing users

---

## [v1.0.1] - Previous Version

Initial stable release with config-driven website generation.
