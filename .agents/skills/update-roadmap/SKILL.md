---
name: update-roadmap
description: Update the research roadmap on the homepage — add papers, adjust layout, create groups, or change filters. All changes are config-driven via config/content.json. Use when the user asks to add a paper to the roadmap, change roadmap layout, add a new research direction, or modify roadmap filters.
---

# Update Research Roadmap

Update the homepage research roadmap by editing `config/content.json` only. No CSS or JS changes needed for normal updates.

## When to Use

- User says "add paper to roadmap", "update roadmap", "new research direction"
- User wants to change card layout, filters, groups, or ongoing items
- User adds a new paper that should also appear on the roadmap

## Instructions

### 1. Read the current roadmap config

Open `config/content.json` and find the `"research_roadmap"` section. Understand the existing phases, nodes, filters, and tracks.

See `references/roadmap-schema.md` for the full field reference.

### 2. Make the requested change

**Add a paper** — append to `research_roadmap.nodes`:

```json
{
  "id": "my_paper",
  "track": "systems",
  "paper_url": "https://arxiv.org/abs/XXXX.XXXXX",
  "short_label": "My Paper",
  "tags": ["efficient_ai"],
  "group": "reasoning",
  "stages": ["agentic_reasoning"],
  "importance": 1
}
```

- `track` must match a `tracks[].id` (`foundations` / `world_model` / `systems`)
- `tags` must match `filters[].id` values for spotlight filtering to work
- `stages` determines which phase the paper appears in (mapped via `phases[].stageIds`)
- `group` assigns the paper to a sub-group within its phase (must match `phases[].groups[].id`)
- Set `"size": "wide"` for 2-column span or `"full"` for full-row span

**Add a phase** — append to `research_roadmap.phases`:

```json
{
  "id": "new_phase",
  "title": "New Direction",
  "kicker": "Stage 04",
  "icon": "🔬",
  "summary": "Short description.",
  "stageIds": ["new_stage_id"],
  "trackId": "existing_or_new_track_id",
  "maxItems": 4,
  "columns": 1
}
```

Add a matching track to `tracks` if `trackId` is new.

**Add sub-groups** — add `"groups"` array to a phase:

```json
"groups": [
  { "id": "group_a", "label": "Group A", "icon": "⚡", "row": "top", "gridColumns": "2fr 1fr" },
  { "id": "group_b", "label": "Group B", "icon": "🛠️", "row": "bottom", "gridColumns": "repeat(3, 1fr)" }
]
```

`row: "top"` groups are laid out side-by-side; `row: "bottom"` groups stack below.

**Add an ongoing direction** — append to `research_roadmap.ongoing`:

```json
{ "phase": "agentic_systems", "label": "Long-term Memory", "status": "Ongoing", "note": "Short description." }
```

To display it as a panel alongside sub-groups, add `"ongoingGroup"` to the phase config.

**Add or change a filter** — append to `research_roadmap.filters` and update relevant nodes' `tags`.

### 3. Build and verify

```bash
npm run build
```

Check:
- Roadmap renders correctly on `index.html`
- Filter buttons trigger spotlight effect
- Hover tooltips show paper details
- Mobile layout collapses to single column

### 4. Commit

```bash
git add config/content.json index.html
git commit -m "feat: update research roadmap — [brief description]"
git push
```

## References (on-demand)

| File | Purpose |
|------|---------|
| `references/roadmap-schema.md` | Full field reference for phases, nodes, groups, filters, ongoing, vision_loop |

Load when editing config so field names and types stay correct.
