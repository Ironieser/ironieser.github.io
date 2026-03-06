# site.yaml Schema Reference

One-time site config: `config/site.yaml`. Used for SEO, visitor map, footer copyright, and short URL redirects.

## Top-level structure

```yaml
copyright_start_year: 2025

visitor_map:
  enabled: true
  domain_id: "YOUR_CLUSTRMAPS_ID"

seo:
  enable_json_ld: true
  website_url: "https://yourusername.github.io"
  github_pages_url: "https://yourusername.github.io"
  legacy_urls: []
  website_name: "Your Name - Academic Homepage"
  website_description: "One-line description for search results."
  keywords: ["keyword1", "keyword2"]
  author: { ... }
  organization: { ... }

redirects:
  - alias: mypaper
    target: /projects/mypaper.html
```

## Field reference

| Field | Required | Description |
|-------|----------|-------------|
| `copyright_start_year` | No | Start year for footer: "© {start_year} - {current_year} {name}". Default e.g. 2025. |
| `visitor_map.enabled` | No | `true` to show ClustrMaps widget; `false` or omit to disable. |
| `visitor_map.domain_id` | If enabled | Get from [clustrmaps.com](https://clustrmaps.com) after creating a map. |
| `seo.website_url` | Yes | Canonical site URL (e.g. GitHub Pages or custom domain). |
| `seo.github_pages_url` | Yes | Same as `website_url` if using GitHub Pages. |
| `seo.website_name` | Yes | Site title in meta and JSON-LD. |
| `seo.website_description` | Yes | Short description for meta and search. |
| `seo.keywords` | No | List of strings for SEO. |
| `seo.author` | Yes | See below. |
| `seo.organization` | No | JSON-LD organization (name, type, url, address). |
| `redirects` | No | List of `{ alias, target }` for short URLs. |

## seo.author

```yaml
author:
  name: "Your Full Name"
  alternate_name: "Optional nickname"
  email: "contact@example.edu"
  academic_email: "academic@example.edu"
  affiliation: "University Name, Department"
  job_title: "PhD Student"
  research_areas: ["area1", "area2"]
  google_scholar_id: "YOUR_SCHOLAR_ID"
  orcid: null
  github: "yourusername"
  twitter: "yourusername"
```

## seo.organization (optional)

```yaml
organization:
  name: "University Name"
  type: "CollegeOrUniversity"
  url: "https://university.edu"
  address:
    addressCountry: "Country"
    addressLocality: "City"
    addressRegion: "Region"
```

## Disabling visitor map

Set `visitor_map.enabled: false` or remove/clear the `visitor_map` block. Do not leave `enabled: true` without a valid `domain_id` if you want no map.
