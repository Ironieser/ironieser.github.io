---
name: migrate-template
description: Help users migrate from an older version of this academic website template to the latest version. Use when the user mentions errors after pulling updates, missing files, or asks how to upgrade the template.
---

# Migrate Template

Help users upgrade from an older version of this template.

## When to Use

- User pulled the latest template and something broke
- User says config files are missing or in the wrong place
- Build script fails after a `git pull`
- User is upgrading from a known old version (pre-v1.1.0, v1.1.0, or v1.2.0)

## Instructions

### 1. Detect current version

Ask the user what they currently have, or check the file structure:

```bash
# Does the user have the old root-level config files?
ls *.json *.yaml 2>/dev/null

# Or the new config/ directory?
ls config/

# Check the build script location
ls scripts/  # new (v1.1.0+)
ls build_local.py 2>/dev/null  # old (pre-v1.1.0)

# Check asset locations
ls assets/css/ 2>/dev/null  # new (v1.1.0+)
ls styles.css 2>/dev/null   # old (pre-v1.1.0)
```

### 2. Read the full migration guide

**IMPORTANT**: Before proceeding, read the CHANGELOG for exact migration steps:

```
CHANGELOG.md
```

This file contains the authoritative, version-specific migration instructions with exact shell commands. Always load and reference it — do not rely on memory.

### 3. Apply migration steps

Follow the CHANGELOG instructions for the detected version gap. Key migrations:

| From | To | Key changes |
|---|---|---|
| pre-v1.1.0 | v1.1.0+ | CSS/JS → `assets/css/` & `assets/js/`; scripts → `scripts/` |
| pre-v1.2.0 | v1.2.0+ | Config files → `config/` directory; rename files |
| any | v1.3.0 | Add `tldr` field support (optional, non-breaking) |

### 4. Verify after migration

```bash
# Install dependencies
npm ci

# Build the site
npm run build

# Preview locally
python -m http.server 8000
```

Check:
- [ ] `index.html` loads correctly at `http://localhost:8000`
- [ ] `publications.html` shows publications (not blank)
- [ ] CSS styles apply correctly
- [ ] Scholar sync still works (if used)

### 5. Commit the migrated files

```bash
git add .
git commit -m "chore: migrate to template v1.3.0"
git push
```
