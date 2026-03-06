---
description: How to debug site rendering issues (blank pages, broken styles, missing scripts)
---

# Debug Site Issues

Use this workflow when something looks wrong on the live site at `https://sixundong.com`.

## Key architecture reminder

- **Cloudflare Pages** runs `npm run build` (`.github/scripts/build-website.js`) on every push
- This **overwrites** `index.html`, `publications.html` with freshly generated HTML
- The locally built HTML (from `python scripts/build_local.py`) is replaced

---

## Common issues and fixes

### Publications page is blank / cards have zero height

**Cause:** `.publication-item` has `class="reveal"` which defaults to `opacity: 0`. It only becomes visible when `script.js` runs and adds `.active`. If `script.js` is not included in `<head>`, cards stay invisible.

**Check:** View source of the live page → search for `script.js` in `<head>`.

**Fix:** Add `<script src="assets/js/script.js" defer></script>` to the `<head>` template in `.github/scripts/build-website.js` for the affected page.

---

### TL;DR text shows inline (not as a popover)

**Cause:** Either:
1. The `.tldr-wrapper` has `style="flex-basis: 100%"` inline — this was the old layout style, now replaced by `position: absolute`
2. The `assets/css/styles.css` is not loaded (check network tab)

**Fix:** Remove any `style="flex-basis: 100%"` from `.tldr-wrapper` in both build scripts.

---

### Style changes not appearing on live site

**Cause:** Cloudflare may be serving a cached version.

**Fix:** 
1. Hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`)
2. Check Cloudflare Pages dashboard → confirm the latest deploy succeeded
3. If CSS has changed, increment the cache buster in the `<link>` tag: `styles.css?v=3`

---

### Live site looks different from local preview

**Cause:** Local build (`build_local.py`) and the production build (`build-website.js`) have gotten out of sync — a fix was applied to one but not the other.

**Fix:** Compare the affected section in both files and sync the change.

---

## Debugging steps

// turbo
1. Check what Cloudflare deployed:
   ```bash
   curl -s https://sixundong.com/publications.html | grep "script.js"
   ```

2. Check local build works:
   ```bash
   npm run build 2>&1
   ```

3. Compare live vs local:
   - Open `http://localhost:8000` → `http://sixundong.com` side by side
   - Use DevTools → Network tab to confirm CSS/JS loaded (status 200)
   - Use DevTools → Console for JS errors

4. If CSS is not applying, check selector specificity — mobile media queries must override desktop rules with `!important` or more specific selectors.

5. Commit and push the fix:
   ```bash
   git add .
   git commit -m "fix: [description of fix]"
   git push
   ```
