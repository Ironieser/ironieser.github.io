# Publication JSON Schema Reference

All publications live under the `"publications"` key in `config/content.json`, grouped by year. Survey papers use `"survey"` as the key.

## Full schema

```json
{
  "title": "Full paper title (required)",
  "authors": ["Author 1", "Author 2"],
  "venue": "CVPR'26",
  "venue_type": "conference",
  "image": "teaser/yourpaper.jpg",

  "featured": true,
  "is_oral": false,
  "tldr": "One sentence summary shown on hover (desktop) or tap (mobile).",

  "links": [
    { "name": "Paper",   "url": "https://arxiv.org/abs/XXXXX", "icon": "ai ai-arxiv" },
    { "name": "Code",    "url": "https://github.com/...",      "icon": "fab fa-github" },
    { "name": "Code",    "url": null, "icon": "fab fa-github", "coming_soon": true },
    { "name": "Dataset", "url": "https://...",                 "icon": "fas fa-database" },
    { "name": "Homepage","url": "https://...",                 "icon": "fas fa-home" },
    { "name": "Blog",    "url": "https://...",                 "icon": "fas fa-blog" },
    { "name": "YouTube", "url": "https://youtu.be/...",        "icon": "fab fa-youtube" },
    { "name": "知乎",    "url": "https://zhuanlan.zhihu.com/...", "icon": "fas fa-book-open" }
  ],

  "_scholar_citations": 0,
  "_scholar_last_updated": "2026-03-06"
}
```

## venue_type values and their badge styles

| venue_type | Badge style |
|---|---|
| `"conference"` | Blue (published) |
| `"under-review"` | Gray (under review) |
| `"preprint"` | Orange (preprint) |
| `"journal"` | Blue (journal) |

## Placeholder images

| Situation | Use |
|---|---|
| Paper has a teaser | `"teaser/yourpaper.jpg"` |
| No teaser yet | `"teaser/underreview.jpg"` |
| Preprint only | `"teaser/preprint.jpg"` |

## Author highlighting

The build script auto-bolds authors matching `personal.name` (first name match). Append `*` for co-first authorship convention, e.g. `"Sixun Dong*"`.
