# Academic Website Template

A simple, config-driven academic website template that generates HTML from content and site config (no HTML editing needed).

> **📢 Latest (v1.5.0)**: **Template/personal branch separation** — `master` is now a clean, one-click GitHub Template with fictitious demo data; personal content lives in a separate branch. Scholar sync workflow updated to target the personal branch. See [CHANGELOG.md](CHANGELOG.md) for details.

## 🎯 Features

![Config-driven](https://img.shields.io/badge/Config--driven-yes-2ea043?style=flat-square)
![Dark Mode](https://img.shields.io/badge/Dark_Mode-☀️_🌙_🌓-2ea043?style=flat-square)
![Blog](https://img.shields.io/badge/Blog-Markdown-2ea043?style=flat-square)
![Publications](https://img.shields.io/badge/Publications-auto-2ea043?style=flat-square)
![Mobile](https://img.shields.io/badge/Mobile-ready-2ea043?style=flat-square)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-build-2088FF?style=flat-square)
![AI agents](https://img.shields.io/badge/AI_agents-Cursor_Windsurf-6e5494?style=flat-square)

**Academic-focused features:**

- **TL;DR popovers** — hover (desktop) / tap-to-expand (mobile) for quick skimming
- **Publication-first layout** — auto-generated publication list from config
- **Mobile-friendly** — responsive reading, back-to-top
- **Config-driven content** — no HTML editing; update `content.json` / `site.yaml`
- **Optional AI agent skills** — Cursor / Windsurf skills for adding papers and deploying

> 📖 **Want more details?** [Detailed guide](blog/introducing-config-driven-academic-website-template.html) · examples and tips.

## 🚀 Quick Start

### (Optional) Step 0: Let an AI agent set things up

If you use an AI-enabled editor such as **Cursor**, **Antigravity**, or **Codex**, you can let an agent do most of the initial setup for you:

- Open this repo in your editor and enable its AI agent.
- Ask the agent to use the `init-template-setup` skill for this project.
- Answer its questions about your name, affiliation, SEO, deployment choice, and favicon/logo.
- The agent will read `README.md`, `config/README.md`, `docs/FAVICON_SETUP.md`, and the intro blog post, then edit `config/site.yaml` and `config/content.json` for you following the docs.

You can still follow the manual steps below, but the AI-assisted flow is often faster for first-time users.

### Step 1: Create Your Repository

**Recommended:** Click the green **"Use this template"** button at the top of [this repository](https://github.com/Ironieser/ironieser.github.io) → **"Create a new repository"**.

This gives you a clean copy of the template (only the `master` branch, no history) — the fastest way to start.

> Alternatively, you can **Fork** the repository if you want to receive upstream template updates via pull requests.

### Step 2: Rename Your Repository

1. In your forked repository, go to **Settings**
2. Scroll down to **"Repository name"**
3. Change it to `yourusername.github.io` (replace with your actual GitHub username)
4. Click **"Rename"**

### Step 3: Choose Your Deployment Method

This template supports two common deployment options. You can pick the one that fits your setup, or switch later if needed.

#### Option A: GitHub Pages only (no Cloudflare)

1. In your repository, go to **Settings → Pages**  
2. Under **Source**, select **"Deploy from a branch"**  
3. Choose your default branch (e.g. `master` or `main`) and the **"/ (root)"** folder  
4. Click **Save**  

GitHub Actions workflows (such as `build-website.yml` and `sync-scholar.yml`) will run automatically, generate static files, and your site will be served via GitHub Pages, for example:  
`https://yourusername.github.io`

#### Option B: Cloudflare Pages only (recommended)

1. In Cloudflare Pages, create a new project and connect it to your GitHub repository  
2. Select the branch you want to deploy (usually `main` or `master`)  
3. Set the **Build command**:

   ```bash
   npm ci && npm run build
   ```

4. Set the **Build output directory** to the folder where your static files are generated (for this template, if the output is at the repository root, you can leave it empty or `/`)  
5. (Optional) Bind your own custom domain in Cloudflare  
6. (Optional) If you don’t need GitHub Pages anymore, you can disable it in **Settings → Pages** to avoid having two public sites from the same repository

For both options:

- The GitHub Actions workflows in this repo (`build-website.yml`, `sync-scholar.yml`, `deploy-waline.yml`, etc.) will continue to work for generating pages, syncing Google Scholar, and deploying the comment system.  
- Template users only need to choose **either** GitHub Pages **or** Cloudflare Pages as their final public site.

### Step 4: Clone to Your Computer

You need to clone the repository to your local computer so you can edit `config/site.yaml` (one-time setup) and `config/content.json` (your content). You can also edit files directly on GitHub.

```bash
git clone https://github.com/yourusername/yourusername.github.io.git
cd yourusername.github.io
```

### Step 5: Update Required Configuration

All configuration files live in the **`config/`** directory. This keeps the repo root clean.

| File | Purpose | When to edit |
|------|---------|--------------|
| **config/meta.json** | Template internals, Scholar sync status | Do not edit (used by scripts) |
| **config/site.yaml** | One-time setup: SEO, visitor map, short URL redirects | Set once when forking |
| **config/content.json** | Your content: bio, news, publications, experience, education | Edit whenever you update the site |
| **config/config.json** | Legacy merge of meta + site (written by Scholar sync) | Do not edit by hand |

#### 5.1 One-time site setup: `config/site.yaml`

**SEO & identity** — Edit the `seo` section with your website URL, name, description, keywords, and `author` / `organization` (used in meta tags and JSON-LD).

**Visitor map** — Paste your ClustrMaps `domain_id` only (get it from [clustrmaps.com](https://clustrmaps.com) after creating a map). Other fields use defaults:

```yaml
visitor_map:
  domain_id: "YOUR_CLUSTRMAPS_ID"   # ← paste your ID here
```

**Redirects** (optional) — Add short URLs, e.g. `/mmtok` → `/projects/mmtok.html`:

```yaml
redirects:
  - alias: mmtok
    target: /projects/mmtok.html
```

#### 5.2 Personal information (REQUIRED) — `config/content.json`

Update the `personal` section:

```json
"personal": {
  "name": "Your Name",  // ← Change
  "email": "your.email@university.edu",  // ← Change
  "cv_link": "files/your-cv.pdf",  // ← Change to your CV file
  "profile_image": "images/your-photo.jpg",  // ← Change to your photo
  "links": [
    // ← Update all your social links
  ]
}
```

### Step 6: Generate Favicons

You need to replace the favicon files with your own logo. Here are the methods:

#### Method 1: Using the Built-in Script (Recommended)

If you have a logo image at `images/pagelogo_round.png`:

```bash
python scripts/generate_favicons.py
```

This will automatically generate all required favicon files:
- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png`

#### Method 2: Using Online Generators

1. **Favicon.io** (https://favicon.io/)
   - Upload your logo image
   - Download the generated favicon package
   - Extract and place files in the root directory

2. **RealFaviconGenerator** (https://realfavicongenerator.net/)
   - More comprehensive favicon generation
   - Handles all device types and sizes

#### Method 3: Manual Creation

If you have image editing software:

1. **favicon-32x32.png**: Resize your logo to 32x32 pixels, save as PNG
2. **favicon-16x16.png**: Resize your logo to 16x16 pixels, save as PNG
3. **apple-touch-icon.png**: Resize your logo to 180x180 pixels, save as PNG
4. **favicon.ico**: Convert your 32x32 PNG to ICO format using an online converter

**Required Files:**
- `favicon.ico` (32x32px, ICO format)
- `favicon-16x16.png` (16x16px, PNG)
- `favicon-32x32.png` (32x32px, PNG)
- `apple-touch-icon.png` (180x180px, PNG)

All files should be placed in the **root directory** of your website.

### Step 7: Add Your Content

#### Publications
Add your papers in the `publications` section:

```json
"publications": {
  "2024": [
    {
      "title": "Your Paper Title",
      "authors": ["Your Name", "Collaborator 1", "Collaborator 2"],
      "venue": "CVPR 2024",
      "venue_type": "conference",
      "image": "teaser/your-paper.jpg",
      "featured": true,
      "tldr": "One sentence summary that appears on hover/tap.",
      "links": [
        {"name": "Paper", "url": "https://arxiv.org/abs/...", "icon": "ai ai-arxiv"},
        {"name": "Code", "url": "https://github.com/...", "icon": "fab fa-github"}
      ]
    }
  ]
}
```

> **💡 TL;DR Popovers**: Adding a `tldr` field to any publication automatically enables an interactive summary tooltip — displayed as a glassmorphism popover on desktop (hover), and a tap-to-expand accordion on mobile.

#### News Updates
Add recent news:

```json
"news": [
  {
    "date": "Dec 2024",
    "content": "Paper accepted to <strong>CVPR 2024</strong>!",
    "category": "papers"
  }
]
```

#### Experience and Education
Update your background:

```json
"experience": [
  {
    "position": "Research Intern",
    "company": "Company Name",
    "period": "Summer 2024",
    "description": "Brief description...",
    "logo": "images/company-logo.jpg"
  }
],
"education": [
  {
    "degree": "PhD in Computer Science",
    "institution": "Your University",
    "period": "2024 - Present",
    "details": "Focus: Computer Vision and AI"
  }
]
```

### Step 8: Add Your Images

1. **Profile photo**: Add your photo as `images/your-photo.jpg`
2. **Paper teasers**: Add teaser images to `teaser/` directory
3. **Company logos**: Add logos to `images/` directory
4. **CV**: Add your CV to `files/` directory

### Step 9: Deploy

```bash
git add config/content.json config/site.yaml
git add images/  # if you added new images
git add favicon* apple-touch-icon.png  # if you added favicons
git commit -m "Update personal information and configuration"
git push
```

**That's it!** GitHub Actions will automatically build and deploy your site in 1-2 minutes.

## 📝 Adding Blog Posts

Create `.md` files in `blog/` directory:

```markdown
---
title: "Your Blog Post Title"
date: "2024-01-01"
description: "Brief description"
tags: ["Research", "AI"]
image: "teaser/preprint.jpg"
---

# Your Blog Post

Write your content here in Markdown...
```

Push the file to GitHub - the blog will update automatically.

## 🔧 Local Development (Optional)

To preview changes locally before pushing:

```bash
# Install dependencies and build (Node)
npm ci
npm run build

# Or build with Python
python scripts/build_local.py

# Start local server
python scripts/local_server.py

# Visit http://localhost:8000
```

## 📋 Configuration Reference

### News Categories
- `"papers"`: For publication news
- `"career"`: For job/position updates
- `"projects"`: For project announcements

### Publication Types
- `"conference"`: Blue badge (published papers)
- `"under-review"`: Gray badge (under review)
- `"preprint"`: Orange badge (preprints)

### Link Icons

**For Publications:**

| Usage | Icon Code | Color Code |
|-------|----------|------------|
| Paper (arXiv) | `"ai ai-arxiv"` | `#b91c1c` |
| Code | `"fab fa-github"` | `#333` |
| Dataset | `"fas fa-database"` | `#28a745` |
| Video (YouTube) | `"fab fa-youtube"` | `#ff0000` |
| Video (Bilibili) | `"fas fa-tv"` | `#fb7299` |
| Homepage | `"fas fa-home"` | `#2563eb` |
| Blog | `"fas fa-blog"` | `#2563eb` |
| Zhihu (Documentation) | `"fas fa-book-open"` | `#007bff` |

**For Social Links:**

| Usage | Icon Code | Color Code |
|-------|----------|------------|
| Email | `"fas fa-envelope"` | `#dc3545` |
| Google Scholar | `"fas fa-graduation-cap"` | `#4285f4` |
| GitHub | `"fab fa-github"` | `#333` |
| Twitter | `"fab fa-twitter"` | `#1da1f2` |
| LinkedIn | `"fab fa-linkedin"` | `#1666C5` |
| Zhihu | `"fas fa-book"` | `#0084ff` |

**Example:**

```json
"links": [
  {
    "name": "Paper",
    "url": "https://arxiv.org/abs/2204.01018",
    "icon": "ai ai-arxiv"
  },
  {
    "name": "Scholar",
    "url": "https://scholar.google.com/citations?user=YOUR_ID",
    "icon": "fas fa-graduation-cap",
    "color": "#4285f4"
  },
]
```


## ❓ Troubleshooting

### Website showing README instead of homepage
- Make sure you pushed changes to `config/content.json` (and `config/site.yaml` if you use it)
- Check GitHub Actions tab for build errors
- Wait 1-2 minutes for deployment

### Images not showing
- Ensure image files are committed and pushed
- Check file paths in `config/content.json`
- Use relative paths from website root

### Build errors
- Validate JSON syntax in `config/content.json` and YAML in `config/site.yaml`
- Check GitHub Actions logs for specific errors
- Ensure all required fields are present

### Visitor map not showing
- Check that `visitor_map.enabled` is set to `true`
- Verify your ClustrMaps `domain_id` is correct
- Make sure you've signed up at clustrmaps.com and created a map

## 🎨 Customization

- **Colors / Dark Mode**: Edit CSS variables in `assets/css/styles.css` — light theme under `:root`, dark theme under `[data-theme="dark"]`
- **Fonts**: Change Google Fonts link in build scripts
- **Layout**: Modify scripts in `.github/scripts/`

## 📞 Getting Help

- 📖 **Read the detailed guide**: [How to Use This Template](blog/introducing-config-driven-academic-website-template.html) - comprehensive documentation with examples and troubleshooting tips (continuously updated)
- 💬 **Have questions?** Open an [Issue](https://github.com/Ironieser/ironieser.github.io/issues) - we're happy to help!
- 🔍 Review example `config/content.json` and `config/site.yaml` for reference
- 📋 Check GitHub Actions logs for build errors

## 📄 License

MIT License - free to use and modify!

---

**Created by [Sixun Dong](https://sixundong.com)** - Independent Researcher

*This template is designed to be simple and practical. Start with the basics and customize as needed.*
