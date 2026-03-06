# content.json Schema Reference

Personal content lives in `config/content.json`. Top-level keys: `personal`, `research`, `news`, `publications`, `experience`, `education`, `service`.

---

## personal

```json
{
  "name": "Your Full Name",
  "aka": "Optional short name or affiliation label",
  "title": "PhD Student in Computer Science",
  "affiliation": "University Name, Department",
  "email": "you@example.edu",
  "profile_image": "images/your-photo.jpg",
  "cv_link": "files/your-cv.pdf",
  "bio": [
    "First paragraph of short bio.",
    "Second paragraph if needed."
  ],
  "links": [
    { "name": "Email", "url": "mailto:you@example.edu", "icon": "fas fa-envelope", "color": "#dc3545" },
    { "name": "Scholar", "url": "https://scholar.google.com/...", "icon": "fas fa-graduation-cap", "color": "#4285f4" },
    { "name": "GitHub", "url": "https://github.com/you", "icon": "fab fa-github", "color": "#333" }
  ]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Shown on homepage; build script bolds this in publication author lists. |
| `aka` | No | Optional label (e.g. institution nickname). |
| `title` | Yes | Short role (e.g. "PhD Student"). |
| `affiliation` | Yes | Institution/department. |
| `email` | Yes | Primary contact. |
| `profile_image` | Yes | Path under repo, typically `images/...`. |
| `cv_link` | No | Path to CV PDF, e.g. `files/cv.pdf`. |
| `bio` | Yes | Array of strings (paragraphs). |
| `links` | Yes | Array of `{ name, url, icon, color }` for social/contact. |

---

## research

```json
{
  "description": "One or two sentences about your research.",
  "stats": ["Stat 1", "Stat 2", "Stat 3"],
  "max_featured_publications": 5
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `description` | Yes | Short research blurb. |
| `stats` | No | Bullet-style stats (e.g. paper count, awards). |
| `max_featured_publications` | No | How many papers to show in homepage "Selected Publications". |

---

## news

Array of items, newest first. Each item:

```json
{
  "date": "Jan 2026",
  "icon": "🎉",
  "content": "Paper accepted to <strong>CVPR 2026</strong>.",
  "category": "papers"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `date` | Yes | Short label (e.g. "Dec 2025"). |
| `icon` | No | Single emoji. |
| `content` | Yes | HTML allowed (e.g. `<strong>`). |
| `category` | No | e.g. "papers", "projects", "career". |

---

## experience

Array of jobs/internships. Each item:

```json
{
  "position": "Research Intern",
  "company": "Lab Name",
  "period": "Summer 2025",
  "description": "Short description.",
  "logo": "images/company-logo.png"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `position` | Yes | Job title. |
| `company` | Yes | Company/lab name. |
| `period` | Yes | Time range. |
| `description` | No | Short text. |
| `logo` | No | Image path. |

---

## education

Array of degrees. Each item:

```json
{
  "degree": "Ph.D. in Computer Science",
  "institution": "University Name",
  "period": "2020 - 2025",
  "details": "Optional extra line."
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `degree` | Yes | Degree name. |
| `institution` | Yes | School name. |
| `period` | Yes | Time range. |
| `details` | No | Optional note. |

---

## service

Optional reviewing/service. Structure:

```json
{
  "reviewer": {
    "conferences": "CVPR, NeurIPS, ...",
    "journals": "Journal name, ..."
  }
}
```

---

## publications

Publications are grouped by year under `"publications"`. Survey papers use the key `"survey"`.

- **Full schema for a single publication**: see the `add-publication` skill’s `references/publication-schema.md` (title, authors, venue, venue_type, image, featured, is_oral, tldr, links, etc.).
- When inserting by hand, keep the same JSON shape; put new entries at the **top** of the year array (newest first).
