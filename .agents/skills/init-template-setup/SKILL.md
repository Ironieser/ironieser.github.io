---
name: init-template-setup
description: Initialize this academic website template with a new user's personal information, SEO settings, and favicon, by reading the existing docs and editing config files. Use this skill when the user has just forked/created the repo and wants an AI agent to do the initial setup for them.
compatibility: "Node.js (npm) or Python 3 for build; Python 3 for local_server.py and generate_favicons.py"
---

# Init Template Setup

Help the user go from a fresh fork/template to a personalized academic homepage by driving the initial config edits for them.

## When to Use

- User has just created a repo from this template (or forked it) and says things like:
  - "初始化这个模板", "帮我把个人主页配好", "setup my site", "configure SEO / favicon / content"
  - "I just forked this repo, what should I edit?"
- User is comfortable answering questions but does not want to manually read all docs and config files.
- User is using an AI-enabled editor (e.g. Cursor, Antigravity, Codex) and wants the agent to do most of the mechanical work.

## Instructions

### 1. Load the key docs (very important)

Before changing anything, load and skim these files so you understand the template:

- `README.md` — especially **Quick Start** and the config sections
- `blog/introducing-config-driven-academic-website-template.md` — conceptual overview of how the template works
- `config/README.md` — notes on config files (if present)
- `docs/FAVICON_SETUP.md` — favicon requirements and file layout

When editing config, use this skill’s **references** as the field-level source of truth:
- **site.yaml** → `references/site-yaml-schema.md`
- **content.json** (personal, research, news, experience, education, service) → `references/content-json-schema.md`
- **publications** (single entry schema) → `add-publication` skill’s `references/publication-schema.md`

**Cross-skill:** This repo has an **add-publication** skill. When the user wants to add real papers (during init or later), **prefer using the add-publication skill**: invoke it or follow its flow (gather title/authors/venue/links/tldr, then insert into `config/content.json` per its schema). Do not hand-write publication JSON from memory; use add-publication’s instructions and `references/publication-schema.md`.

### 2. Gather required information from the user

Ask the user (or infer from existing content) for:

- **Basic identity**
  - Full name (as it should appear on the homepage)
  - Short title/role (e.g. "PhD Student in Computer Science")
  - Affiliation(s)
  - Email(s) and preferred contact
  - Profile photo path, if already in the repo (or ask where they plan to put it)
- **Web presence & IDs**
  - Personal website URL (or the GitHub Pages URL they plan to use)
  - GitHub / Twitter / LinkedIn usernames (if they want them shown)
  - Google Scholar ID (for optional Scholar sync)
- **SEO & site meta**
  - Desired website name and short description
  - Any important keywords they want in SEO
  - Whether they want a visitor map (ClustrMaps) and, if so, their `domain_id`
- **Content preferences**
  - Whether they already have real publications to add now, or want to keep demo papers for the moment
  - Whether they want a blog section from day one
- **Deployment & comments (optional)**
  - Target deployment: GitHub Pages, Cloudflare Pages, or both
  - Whether they plan to use Waline comments (requires Vercel + `waline-config/`)
- **Favicon / logo**
  - Whether they already have a square logo image (512x512 or larger)
  - Where they want favicon files to live (usually repo root, following `docs/FAVICON_SETUP.md`)

Clarify anything ambiguous with follow-up questions.

### 3. Configure `config/site.yaml` (one-time site setup)

See `references/site-yaml-schema.md` for the full field reference. Follow the guidance in `README.md` and in-file comments.

1. Open `config/site.yaml`.
2. Fill out the `seo` section:
   - `website_url` / `github_pages_url`
   - `website_name` / `website_description`
   - `author` block (name, emails, Scholar ID, social links)
3. Configure `visitor_map`:
   - If user provides a ClustrMaps `domain_id`, set it.
   - If they do **not** want a visitor map, set `visitor_map.enabled: false` (or remove/clear the `visitor_map` block).
4. Optionally set `copyright_start_year` for the footer (e.g. year the site started).
5. Configure `redirects` if the user wants short URLs (optional).

Always preserve YAML indentation and quoting rules.

### 4. Configure `config/content.json` (personal content)

See `references/content-json-schema.md` for the schema of `personal`, `research`, `news`, `experience`, `education`, and `service`. For a single publication entry’s fields, use the `add-publication` skill’s `references/publication-schema.md`.

1. Open `config/content.json`.
2. Update the `personal` section:
   - Name, `aka` (optional), title, affiliation, email(s), `cv_link`, homepage, and social `links`.
   - `profile_image` path, matching an existing image in `images/` if possible.
3. Update `research` (short blurb and any stats the user wants).
4. Update or replace demo `news`, `experience`, `education`, and `service` entries with the user's real data.
5. For `publications`:
   - If the user wants to start with **real papers**: use the **add-publication** skill for each paper (this repo’s dedicated skill for adding publications — follow its steps and schema). Do not hand-craft publication entries unless you have explicitly loaded add-publication’s reference.
   - If the user prefers, keep demo papers temporarily but clearly mark that they are placeholders.

Keep the JSON valid at all times (matching brackets, commas, and quoting).

### 5. Favicon and logo setup

Use `docs/FAVICON_SETUP.md` as the authoritative guide:

1. Confirm with the user whether they already have a source logo.
2. If they have (or will add) a square logo at `images/pagelogo_round.png`, suggest running the built-in script first:
   ```bash
   python scripts/generate_favicons.py
   ```
   This generates all required favicon files in the repo root (see README Step 6, Method 1).
3. Otherwise, explain which favicon files are expected in the **repo root**:
   - `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`
4. Point them to online generators if they need to create these from a logo:
   - `https://favicon.io/`
   - `https://realfavicongenerator.net/`
5. Once the user has provided the files (or paths), ensure they are placed in the **repo root**, consistent with `FAVICON_SETUP.md`.

Do **not** attempt to generate binary image data yourself; only guide placement and naming.

### 6. Optional: Scholar sync and Waline comments

If the user wants advanced automation:

- **Scholar sync**:
  - Confirm which branch will be their personal branch.
  - Ensure `config/meta.json` and `config/config.json` are left untouched (managed by scripts).
  - Help the user set the appropriate GitHub Actions secrets and confirm that the Scholar workflow targets the correct branch.

- **Waline comments**:
  - Only set this up if the user explicitly wants it and is comfortable with Vercel.
  - Make sure a `waline-config/` directory exists and that they understand they must set `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` in repo secrets.

### 7. Build and preview

Guide the user through a local build:

```bash
npm ci
npm run build
python scripts/local_server.py
```

or, if they prefer Python-only:

```bash
python scripts/build_local.py
python scripts/local_server.py
```

Ask them to open `http://localhost:8000` and check:

- Homepage shows their name, bio, and at least one real section updated.
- Publications page is not broken (even if still using demo content).
- Favicon appears (after cache clear) if they added the files.

### 8. Commit and push

Once everything looks correct:

```bash
git status
git add config/site.yaml config/content.json
# Include favicon files and any other changed config/docs as needed
git commit -m "chore: initial personal site setup"
git push
```

Remind the user that GitHub Pages or Cloudflare Pages will redeploy automatically depending on their chosen setup.

## References (on-demand)

| File | Purpose |
|------|---------|
| `references/site-yaml-schema.md` | site.yaml structure and all fields |
| `references/content-json-schema.md` | content.json sections (personal, research, news, experience, education, service, publications pointer) |

Load these when editing the corresponding config so field names and types stay correct.
