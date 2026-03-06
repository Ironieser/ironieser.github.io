---
name: add-publication
description: Add a new academic publication to the website, including all metadata, links, TL;DR, and optional teaser image. Use this skill when the user asks to add a paper, preprint, or update publication information.
---

# Add Publication

Add a new paper entry to `config/content.json` and rebuild the site.

## When to Use

- User says "add a paper", "new publication", "new preprint"
- User provides paper metadata (title, authors, venue, arXiv link, etc.)
- User wants to update TL;DR or links for an existing paper

## Instructions

### 1. Gather required information

Ask the user for (or extract from context):
- **Title** — full paper title
- **Authors** — ordered author list (the user's name should match `personal.name` in `content.json`)
- **Venue** — short label, e.g. `CVPR'26`, `arXiv'2506`, `NeurIPS'25`
- **Venue type** — one of: `conference`, `preprint`, `under-review`, `journal`
- **arXiv / paper URL**
- **Code URL** (optional, use `"coming_soon": true` if not yet released)
- **TL;DR** — one sentence summary (strongly recommended)
- **Teaser image** — path in `teaser/` directory (use `teaser/underreview.jpg` as placeholder if not available)
- **Featured** — `true` to also show on homepage

See `references/publication-schema.md` for the full JSON schema and all optional fields.

### 2. Insert into config/content.json

- Open `config/content.json`
- Find the correct year key under `"publications"` (e.g. `"2026"`)
- Insert the new entry at the **top** of the year array (newest first)
- For survey papers, use the `"survey"` key

### 3. Build and preview locally

```bash
python scripts/build_local.py
```

Then open `http://localhost:8000` and verify:
- Paper appears on `publications.html` under the correct year
- If `featured: true`, it also appears in "Selected Publications" on `index.html`
- TL;DR popover works on hover (desktop) and tap (mobile via DevTools)

### 4. Commit and push

```bash
git add config/content.json index.html publications.html
git commit -m "feat: add [Paper Short Name] to publications"
git push
```

Cloudflare Pages redeploys automatically in ~1-2 min.
