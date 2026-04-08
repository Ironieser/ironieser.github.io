# Roadmap Schema Reference

All fields live under `config/content.json` → `"research_roadmap"`.

## Top-level fields

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Show/hide the roadmap section |
| `title` | string | Section heading (e.g. "Research Roadmap") |
| `subtitle` | string | Internal title line (e.g. "From Perception to Agentic Intelligence") |
| `description` | string | Subtitle below internal title |

## `phases[]` — Stage definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique phase identifier |
| `title` | string | ✅ | Display title (e.g. "Perception") |
| `kicker` | string | ✅ | Small label above title (e.g. "Stage 01") |
| `icon` | string | | Emoji shown before title |
| `summary` | string | | One-line description below title |
| `stageIds` | string[] | ✅ | Fine-grained stage IDs that map to this phase |
| `trackId` | string | ✅ | Must match a `tracks[].id` for color |
| `maxItems` | number | | Max papers shown (default: 4) |
| `columns` | number | | Paper grid columns (`1` = single, `2` = double) |
| `groups` | object[] | | Sub-group definitions (see below) |
| `ongoingGroup` | object | | Config for ongoing panel display |

## `phases[].groups[]` — Sub-groups within a phase

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Matches `node.group` values |
| `label` | string | ✅ | Display title |
| `icon` | string | | Emoji before label |
| `row` | string | ✅ | `"top"` (side-by-side layout) or `"bottom"` (full-width below) |
| `gridColumns` | string | | CSS `grid-template-columns` value (e.g. `"2fr 1fr"`, `"repeat(3, 1fr)"`) |

## `phases[].ongoingGroup` — Ongoing panel config

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Panel title (e.g. "Memory") |
| `icon` | string | Emoji before label |
| `row` | string | Must be `"top"` to appear alongside top-row groups |

## `filters[]` — Topic filter buttons

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Filter identifier (referenced in `node.tags`) |
| `name` | string | Button label |

## `tracks[]` — Color definitions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Track identifier (referenced in `node.track` and `phase.trackId`) |
| `color` | string | CSS color value (e.g. `"#7c3aed"`) |

## `nodes[]` — Paper entries

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique paper identifier |
| `track` | string | Must match a `tracks[].id` |
| `paper_url` | string | arXiv or paper URL (auto-pulls metadata from publications) |
| `short_label` | string | Display name on roadmap card |
| `tags` | string[] | Filter tag IDs for spotlight filtering |
| `stages` | string[] | Fine-grained stage IDs for phase mapping |
| `importance` | number | Sort priority (higher = first; `2` = featured styling) |

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `group` | string | Sub-group ID within phase (e.g. `"inference"`, `"reasoning"`) |
| `size` | string | Card width: `""` = default, `"wide"` = 2-col span, `"full"` = full row |
| `venue` | string | Override venue label (e.g. `"ICLR'26"`) |
| `venue_type` | string | `"conference"` / `"preprint"` / `"under-review"` / `"journal"` |
| `is_oral` | boolean | Show 🏆 Oral badge |

## `ongoing[]` — Future/ongoing directions

| Field | Type | Description |
|-------|------|-------------|
| `phase` | string | Phase ID this item belongs to |
| `label` | string | Display title (e.g. "Long-term Memory") |
| `status` | string | Badge text (e.g. "Ongoing") |
| `note` | string | Short description |

## `vision_loop` — Feedback loop annotation

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Label text (e.g. "Future Loop") |
| `text` | string | Description text |

## Stage-to-Phase mapping

Papers are assigned to phases via `node.stages` → `phase.stageIds`:

| stageId | Phase |
|---------|-------|
| `perception` | Perception |
| `alignment` | Perception |
| `world_modeling` | World Modeling |
| `efficient_systems` | Agentic Systems |
| `agentic_reasoning` | Agentic Systems |

A paper's **primary phase** is the last (rightmost) phase in order.
