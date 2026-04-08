---
name: sync-three-branches
description: Overview of the three-branch setup (ironieser / dev / template). Development on ironieser first; update template via dev and PR. Use merge-to-dev and merge-dev-to-master skills for the actual steps.
---

# Sync Three Branches (overview)

Three branches:

| Branch | Role |
|--------|------|
| **ironieser** | **Primary working branch.** Your personal site. All new features are developed here first. Deploy via Cloudflare Pages. |
| **dev** | Staging branch. Receives merges from ironieser; then you merge dev → master via PR. |
| **master** (template) | Template + demo. **Never edited directly.** Updated only via **PR from dev** (remove personal content, keep demo). |

## Flow

1. **Develop on ironieser** → push ironieser.
2. **Merge ironieser → dev** → use the **merge-to-dev** skill (merge locally, push dev).
3. **Merge dev → master** → use the **merge-dev-to-master** skill (open PR on GitHub, in the PR remove personal content and keep demo, then merge the PR).

## Skills to use

- **merge-to-dev** — Merge ironieser into dev (push ironieser, checkout dev, merge origin/ironieser, push dev).
- **merge-dev-to-master** — Update template via PR only: base = master, compare = dev; in the PR remove personal content and keep demo content, then merge.

## Occasionally: copy from template to ironieser

To bring something from master to your site (e.g. README, skills):

```bash
git checkout ironieser
git checkout origin/master -- README.md CHANGELOG.md docs/ .agents/skills/ .github/workflows/deploy-waline.yml
git add . && git commit -m "chore: sync from template" && git push origin ironieser
```
