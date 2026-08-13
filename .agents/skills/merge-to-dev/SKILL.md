---
name: merge-to-dev
description: Merge ironieser into dev. Use when you want to bring your personal branch (ironieser) updates into the staging branch (dev) before updating the template (master).
---

# Merge ironieser → dev

Bring changes from **ironieser** (your homepage branch) into **dev** so that dev has the latest features and can later be merged into master via a PR.

## When to use

- You finished a feature on ironieser and want to prepare it for the template.
- You want dev to be in sync with ironieser before opening a PR to master.

## Instructions

1. **Push ironieser** (if not already):

   ```bash
   git push origin ironieser
   ```

2. **Merge ironieser into dev** (locally):

   ```bash
   git fetch origin
   git checkout dev
   git merge origin/ironieser -m "chore: merge ironieser into dev"
   ```

3. **Resolve conflicts** if any:
   - For **shared code** (`.github/scripts/`, `.agents/`, `README`, `CHANGELOG`, `assets/css`, `assets/js`): prefer **ironieser’s version** (new features).
   - For **content/config** (`config/content.json`, `config/site.yaml`, generated HTML, `blog/`, `teaser/`, etc.): either keep ironieser’s (dev will still have personal content for now) or keep dev’s if dev already had demo. You will strip personal content when merging dev → master (see the **merge-dev-to-master** skill).

4. **Push dev**:

   ```bash
   git push origin dev
   ```

After this, use the **merge-dev-to-master** skill to update the template (master) via PR, where you remove personal content and keep demo content.
