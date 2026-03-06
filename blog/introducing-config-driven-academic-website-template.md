---
title: "Config-Driven Academic Website Template"
date: "2025-06-27"
description: "A lightweight template for academic homepages powered by JSON/YAML config, GitHub Actions, and optional Cloudflare Pages."
tags: ["Academic Website", "GitHub Actions", "Template", "Web Development"]
image: "favicon-32x32.png"
---

# Config-Driven Academic Website Template

> Prefer AI help? If you use an AI-enabled editor like **Cursor**, **Antigravity**, or **Codex**, you can let an agent do most of the initial setup by using the `init-template-setup` skill in this repo. It will read the docs (including this post), ask you for your personal details and SEO info, and then edit `config/site.yaml` and `config/content.json` for you.

This repository is a small opinionated template for academic homepages:

- **No HTML editing** – almost everything lives in config files  
- **Config-driven** – content in `config/content.json`, site meta in `config/site.yaml`  
- **Auto build & deploy** – via GitHub Actions, works with GitHub Pages or Cloudflare Pages  
- **Blog + publications** – Markdown blog posts and a structured publications list

If you just want to see what it looks like, visit the live demo at `https://ironieser.github.io` – the demo content uses a fictional cat-themed researcher so you can safely overwrite everything.

---

## 1. What this template gives you

- **Homepage** with bio, research blurb, news, publications, experience, education, service  
- **Publications page** with year grouping, venue type badges, featured papers, TL;DR, and multiple links (paper / code / dataset / etc.)  
- **Blog system**: Markdown posts with frontmatter and an auto-generated blog index  
- **Config-only workflow**: most users only ever touch:
  - `config/content.json` – your personal content
  - `config/site.yaml` – SEO, visitor map, short redirects
- **Automation**:
  - GitHub Actions build the site on each push to the template branch
  - Optional Google Scholar sync (for your personal branch) to update citations and papers automatically

---

## 2. High-level structure

The important pieces in this repo:

- `config/content.json` – **your content** (personal, news, publications, experience, education, service)  
- `config/site.yaml` – **site-wide settings** (SEO, visitor map, redirects, copyright year)  
- `config/meta.json` / `config/config.json` – internal meta + legacy combined config written by scripts  
- `blog/*.md` – Markdown blog posts with frontmatter  
- `.github/workflows/*.yml` – build / link check / optional Scholar sync workflows  
- `.github/scripts/*.js` – Node.js build scripts

The build pipeline is:

1. Actions checks out the repo  
2. `npm run build`  
3. Node scripts read `config/` and `blog/` and generate:
   - `index.html`
   - `publications.html`
   - `blog.html` + `assets/js/blog-data.js`

---

## 3. How to use the template

### 3.1 Create your own repo

**Recommended: Use as a GitHub Template**

1. Go to the GitHub page of this repository  
2. Click **“Use this template” → “Create a new repository”**  
3. Choose a name (e.g. `yourusername.github.io`)  
4. Create the repo

This gives you a clean copy of the code and config (no history) with the cat-themed demo content you can safely overwrite.

### 3.2 Choose deployment

You have two main options:

- **GitHub Pages** – simplest; this template already ships a GitHub Actions workflow that deploys from the default branch  
- **Cloudflare Pages** – recommended if you want a custom domain and more control; point Cloudflare Pages at your repo and set the build command:

```bash
npm ci && npm run build
```

And build output directory as the repo root (`/`).

### 3.3 Edit config

All content lives in `config/content.json`:

```json
{
  "personal": { /* your name, email, links */ },
  "research": { /* short description + stats */ },
  "news": [ /* recent updates */ ],
  "publications": { /* papers grouped by year */ },
  "experience": [ /* jobs / internships */ ],
  "education": [ /* degrees */ ],
  "service": { /* reviewing and service */ }
}
```

Typical first edits:

- Change `"personal"` to your real info and photo path  
- Replace the demo cat publications with your papers  
- Update `"news"` with a few real milestones  
- Edit `"experience"` / `"education"` to match your CV

SEO and visitor map live in `config/site.yaml`. At minimum, update:

- `seo.website_url` / `seo.github_pages_url`  
- `seo.website_name` / `seo.website_description`  
- `seo.author.*` (your name, emails, Scholar ID, GitHub, Twitter)  
- `visitor_map.domain_id` (or disable the map by removing it or setting it off in your fork)

---

## 4. Publications & blog

### 4.1 Publications

Publications are grouped by year:

```json
"publications": {
  "2025": [
    {
      "title": "Your Paper Title",
      "authors": ["Your Name", "Coauthor 1"],
      "venue": "CVPR'25",
      "venue_type": "conference",
      "image": "teaser/your-paper.jpg",
      "featured": true,
      "is_oral": false,
      "tldr": "One-line summary shown on hover.",
      "links": [
        {"name": "Paper", "url": "https://arxiv.org/...", "icon": "ai ai-arxiv"},
        {"name": "Code", "url": "https://github.com/...", "icon": "fab fa-github"}
      ]
    }
  ]
}
```

Supported `venue_type` values:

- `conference` – blue badge  
- `preprint` – orange badge  
- `under-review` – gray badge

If you add a `tldr`, the homepage will show an interactive TL;DR popover for that paper.

### 4.2 Blog posts

Blog posts live in `blog/` and look like this:

```markdown
---
title: "My Research Update"
date: "2025-01-01"
description: "Short description for the blog index"
tags: ["Research", "PhD"]
image: "teaser/conference.jpg"
---

# My Research Update

Write your post here in Markdown.
```

Running `npm run build` (or the CI workflow) will regenerate:

- `assets/js/blog-data.js` – data for the blog index  
- `blog.html` – blog list page

---

## 5. Template vs personal branches (for maintainers)

If you are only **using** the template, you do not need to care about branches – just edit your fork.

For this original repo, I maintain:

- `master` – **clean template + demo cat content**, used for GitHub Template and live demo  
- `ironieser` – **my personal site**, with my real publications, blog, and config  

The Scholar sync workflow is configured to target the `ironieser` branch only, so automated citation and paper updates never overwrite the demo data on `master`.

If you want a similar split (template vs personal), you can copy this pattern in your own repos.

---

## 6. Local development

To preview changes locally:

```bash
npm ci
npm run build
python scripts/local_server.py
```

Then open `http://localhost:8000` in your browser.

If you prefer Python-only:

```bash
python scripts/build_local.py
python scripts/local_server.py
```

---

## 7. When to use this template

This template is a good fit if:

- You want a simple academic homepage with publications + blog  
- You are comfortable editing JSON/YAML but don’t want to touch HTML/CSS too much  
- You like GitHub-based workflows (edit → commit → auto-deploy)

It is probably **not** what you want if:

- You need a full CMS with user logins, comments, dashboards, etc.  
- You want to drag-and-drop design in a visual builder  
- You need a heavy React/SPA frontend with client-side routing

---

## 8. Final notes

This project started as a personal solution to “I don’t want to hand-edit HTML for every new paper” and gradually evolved into a reusable template.

If you:

- find a bug  
- want to suggest an improvement  
- or build something cool on top of it  

feel free to open an issue or pull request on GitHub.  

Happy hacking – and may your config files always stay valid JSON. 🐱