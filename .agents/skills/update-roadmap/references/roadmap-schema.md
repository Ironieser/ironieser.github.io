# Roadmap Schema Reference

All fields live in `config/roadmap.yaml` (loaded by the build as `research_roadmap`).

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
| `color` | string | ✅ | CSS accent for this stage column (e.g. `"#7c3aed"`) |
| `trackId` | string | | **Legacy:** if `color` is omitted, build can fill color from this key (`foundations` / `world_model` / `systems`). Prefer setting `color` only. |
| `maxItems` | number | | Max papers shown (default: 4) |
| `columns` | number | | Paper grid columns (`1` = single, `2` = double) |
| `groups` | object[] | | Sub-group definitions (see below) |
| `ongoingGroup` | object | | Config for a standalone ongoing panel (ignored when a group sets `ongoing: true`) |

## `phases[].groups[]` — Sub-groups within a phase

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Matches `node.group` values |
| `label` | string | ✅ | Display title |
| `icon` | string | | Emoji before label |
| `row` | string | ✅ | `"top"` (side-by-side layout) or `"bottom"` (full-width below) |
| `gridColumns` | number \| string | | Number of equal columns (e.g. `3`) or CSS value (e.g. `"repeat(3, 1fr)"`). Cards use `size` to span across columns. |
| `ongoing` | boolean | | If `true`, this phase's `ongoing[]` items render inside this group's grid after the paper cards (replaces the separate `ongoingGroup` panel). |
| `ongoingSize` | number | | Card span (`1`–`3`) for ongoing items hosted by this group; default `1`. |

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

## `nodes[]` — Roadmap entries (papers + optional context cards)

Nodes are **not** given a `track` field. Phase placement comes from `stages[]` → `phases[].stageIds`. Stage **color** comes from the matching phase’s `color` (no separate `tracks` array).

### Paper nodes (`card_kind` omitted or `"paper"`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier |
| `paper_url` | string | ✅ | arXiv or paper URL (metadata merged from publications) |
| `short_label` | string | ✅ | Display name on roadmap card |
| `tags` | string[] | ✅ | Filter tag IDs for spotlight |
| `stages` | string[] | ✅ | Stage IDs for phase mapping |
| `importance` | number | | Sort priority; default `1`. Use `2` for featured styling. |

### Context nodes (`"card_kind": "context"`)

Non-paper strip below that phase’s paper grid (internship, etc.): static card, no `data-paper-id`, optional rich hover tooltip.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier |
| `card_kind` | string | ✅ | Must be `"context"` |
| `short_label` | string | ✅ | Card title |
| `tags` | string[] | ✅ | Same spotlight `filters[].id` values as papers |
| `stages` | string[] | ✅ | Which phase shows this block (same rules as papers) |
| `importance` | number | | Default `1` if omitted |
| `context` | object | ✅ | `kicker` (second line on card), `tooltip_role` (first tooltip line after title), `meta`, `detail` (tooltip only when both used like papers) |

Context nodes omit `paper_url`.

### Optional fields (papers)

| Field | Type | Description |
|-------|------|-------------|
| `group` | string | Sub-group ID within phase (e.g. `"inference"`, `"reasoning"`) |
| `size` | number | Card span in group grid (`1`–`3`) |
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
