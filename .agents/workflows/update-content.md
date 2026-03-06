---
description: How to update and deploy website content (publications, TL;DR, news, etc.)
---

## Overview

This site uses a **config-driven** architecture. Content lives in `config/content.json`.
The site is built by `npm run build` (via `.github/scripts/build-website.js`) and deployed by **Cloudflare Pages** on every push to `master`.

> No HTML editing needed. Edit config → build locally → preview → commit → push.

---

## Step 1: Edit content

Edit `config/content.json` for any of the following:

| What to change | Where in JSON |
|---|---|
| Publications, TL;DRs | `publications` → per year/section |
| News items | `news` array (top = most recent) |
| Bio, links | `personal` |
| Research stats | `research.stats` |
| Experience / Education | `experience`, `education` |

### Adding a TL;DR to a publication

```json
{
  "title": "Your Paper Title",
  "tldr": "One-sentence summary shown on hover (desktop) or tap (mobile).",
  ...
}
```

### Adding a news item

```json
{
  "date": "Mar 2026",
  "icon": "🛠️",
  "content": "Your news content here.",
  "category": "papers"  // or "career" or "projects"
}
```

---

## Step 2: Build locally and preview

```bash
# Build HTML from config
python scripts/build_local.py
# OR
npm run build

# Preview at http://localhost:8000
python scripts/local_server.py
# OR
python -m http.server 8000
```

---

## Step 3: Commit and push

```bash
git add config/content.json
# Add any other changed files (assets/css, assets/js, etc.)
git commit -m "your commit message"
git push
```

**Cloudflare Pages** picks up the push automatically and runs `npm ci && npm run build`.
The live site at `https://sixundong.com` updates in ~1-2 minutes.

---

## Important: Two build scripts

| Script | Used by | Notes |
|---|---|---|
| `scripts/build_local.py` | Local dev only | Preview before pushing |
| `.github/scripts/build-website.js` | Cloudflare Pages (production) | This is what actually deploys |

**Always make sure both scripts are in sync** — if you fix a bug locally in the Python script, apply the same fix to the JS script before pushing.

---

## CSS & JS changes

- Styles: `assets/css/styles.css`
- Interactions/Animations: `assets/js/script.js`
- After editing CSS/JS, rebuild and commit the generated `index.html` / `publications.html` too, since Cloudflare will regenerate them from the JS build script.
