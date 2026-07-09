---
description: 'SDLC Workflow conventions. Use when working in a project that has a .sdlc/ directory. Ensures the agent uses SDLC tools correctly and follows tracking practices.'
applyTo: '**'
---

# SDLC Workflow Conventions

## CRITICAL: Always Use Tools — Never Create .sdlc/ Files Manually

The `.sdlc/` directory has a specific format with JSON indexes, counters, and cross-references that must stay in sync. **NEVER create or modify .sdlc/ files manually.** Always use the provided tools:

| Action | Tool to Use | NEVER Do This |
|--------|------------|---------------|
| Initialize project | `#sdlcInit` | ❌ Don't manually create `.sdlc/` directory or `manifest.json` |
| Create work item | `#sdlcCreate` | ❌ Don't manually create `work/active/` directories or `brief.md` |
| Complete work item | `#sdlcComplete` | ❌ Don't manually move files to `archive/` |
| Log decision | `#sdlcDecision` | ❌ Don't manually create `decisions/` files |
| Get project status | `#sdlcStatus` | Can also read `manifest.json` directly |

## What You CAN Edit Directly

After a tool creates the structure, you can edit these files:
- `.sdlc/context/architecture.md` — system design (edit body content)
- `.sdlc/context/conventions.md` — coding standards (edit body content)
- `.sdlc/work/active/<id>/brief.md` — work item requirements (edit body content)
- `.sdlc/work/active/<id>/plan.md` — task checklist (toggle `- [ ]` to `- [x]`)

## What You Should NEVER Edit Directly

- `.sdlc/manifest.json` — managed by tools
- `.sdlc/index/*.json` — managed by tools
- `.sdlc/decisions/*.md` — created by `#sdlcDecision` tool
- Any file in `.sdlc/work/active/` directory structure — created by `#sdlcCreate` tool

## Before Starting Work

1. Use `#sdlcStatus` to check project status and active work items
2. If there's an active work item, read its `brief.md` and `plan.md`
3. Read `.sdlc/context/conventions.md` for coding standards

## During Implementation

1. Follow the task order in `plan.md` — don't skip ahead
2. After completing a sub-task, update `plan.md` — change `- [ ]` to `- [x]`
3. If you make a significant architectural decision, use `#sdlcDecision`
