---
name: merge-dev-to-master
description: Merge dev into master (template) via Merge Request (PR) only. In the PR, remove personal content and keep demo content. Never modify master directly.
---

# Merge dev → master (template) — only via PR

Update the **template** (master) from **dev**. Master is **never** modified directly; the only way is **push + Merge Request (PR)**. The main work in the PR is **remove personal content and keep demo content**.

## When to use

- dev already has the new features (e.g. after merging ironieser into dev with the **merge-to-dev** skill).
- You want to publish the template update when you have time.

## Instructions

1. **Push dev** (if not already):

   ```bash
   git push origin dev
   ```

2. **Open a Merge Request (Pull Request) on GitHub:**  
   **base = `master`**, **compare = `dev`**.

3. **In the PR — main job: remove personal content, keep demo content.**
   - **Keep / take from dev (new features):** `.github/scripts/`, `.agents/`, `README`, `CHANGELOG`, `docs/`, `assets/css`, `assets/js`, `scripts/build_local.py`, etc.
   - **Do not merge personal content into master:** on master, keep **demo** for:
     - `config/content.json`, `config/site.yaml`, `config/config.json`
     - `CNAME`, `_redirects`
     - `index.html`, `publications.html`, `blog.html`, `assets/js/blog-data.js`
     - `blog/*.md` (template demo posts only), `teaser/`, `images/`, `files/`, `projects/`
   - If the PR would overwrite demo with personal data, either:
     - in the PR choose “keep master’s version” for those files, or  
     - merge the PR and then do a follow-up on master to restore demo (e.g. re-run build with demo config and commit).

4. **Merge the PR** on GitHub. master is updated only by this merge, not by direct push.

## Summary

- Never commit or push directly to master.
- PR = remove personal content, keep demo content; then merge.
