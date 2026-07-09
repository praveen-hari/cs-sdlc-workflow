---
description: 'SDLC Workflow conventions and .sdlc/ file format reference. Use when working in a project that has a .sdlc/ directory. Ensures the agent follows SDLC tracking practices — checking for active work items, reading project context, and updating progress.'
applyTo: '**'
---

# SDLC Workflow Conventions

When this workspace has a `.sdlc/` directory, follow these practices.

## .sdlc/ File Structure Reference

```
.sdlc/
├── manifest.json                    ← Project identity, stack, counters, health
│                                       DO NOT edit directly — managed by tools
├── context/
│   ├── architecture.md              ← System design, modules, data flow
│   │                                   YAML front matter + markdown body
│   │                                   READ and EDIT directly
│   ├── conventions.md               ← Coding standards, naming, testing patterns
│   │                                   READ and EDIT directly
│   ├── requirements.md              ← Project requirements (optional)
│   └── stack.md                     ← Technology choices (optional)
│
├── work/
│   ├── active/
│   │   └── <work-item-id>/
│   │       ├── brief.md             ← What/Why/Acceptance Criteria
│   │       │                           YAML front matter: type, title, priority, createdAt
│   │       │                           Body: ## What, ## Why, ## Acceptance Criteria
│   │       │                           READ and EDIT directly
│   │       └── plan.md              ← Implementation task checklist
│   │                                   YAML front matter: totalTasks, completedTasks
│   │                                   Body: ## Task N: Title + checkboxes (- [ ] / - [x])
│   │                                   READ and EDIT directly
│   └── archive/
│       └── YYYY-MM/
│           └── <work-item-id>/      ← Completed/abandoned work items
│
├── decisions/
│   └── NNN-<slug>.md                ← Architectural Decision Records (ADRs)
│                                       YAML front matter: id, title, status, date
│                                       Created by #sdlcDecision tool — DO NOT create manually
│
├── releases/
│   └── vX.Y.Z.md                   ← Release records
│
├── index/
│   ├── work.json                    ← Active + recent work items index
│   ├── decisions.json               ← All decisions index
│   └── releases.json                ← All releases index
│                                       DO NOT edit indexes directly — managed by tools
│
└── snapshots/
    ├── latest.json                  ← Current quality metrics
    └── history/
        └── YYYY-MM.json            ← Monthly quality history
```

## Key File Formats

### brief.md (Work Item)
```yaml
---
type: feature          # feature, bug, refactor, etc.
title: "Add dark mode"
priority: high         # critical, high, medium, low
createdAt: "2026-07-09T10:00:00Z"
modules: [web-app]     # optional
---
# Add Dark Mode

## What
Description of the feature.

## Why
Motivation and context.

## Acceptance Criteria
- [ ] Toggle button in header
- [ ] Persists in localStorage
- [ ] Respects OS preference
```

### plan.md (Implementation Plan)
```yaml
---
totalTasks: 5
completedTasks: 2
---
# Implementation Plan

## Task 1: Setup
- [x] Create ThemeProvider
- [x] Add toggle component

## Task 2: Core Logic
- [ ] Add localStorage persistence
- [ ] Add OS preference detection

## Task 3: Testing
- [ ] Write unit tests
```

### Context Documents (architecture.md, conventions.md)
```yaml
---
version: 1
updatedAt: "2026-07-09"
---
# Project Architecture

## System Overview
...
```

## Before Starting Work

1. Check `.sdlc/index/work.json` for active work items
2. If there's an active work item, read its `brief.md` and `plan.md` before making changes
3. Read `.sdlc/context/conventions.md` for coding standards

## During Implementation

1. Follow the task order in `plan.md` — don't skip ahead
2. After completing a sub-task, update `plan.md` — change `- [ ]` to `- [x]`
3. Update the front matter counters: increment `completedTasks`
4. If you make a significant architectural decision, log it with `#sdlcDecision`

## Tools vs Direct File Access

**Use tools for multi-file operations** (these update indexes + counters atomically):
- `#sdlcInit` — Initialize `.sdlc/` directory
- `#sdlcStatus` — Get project status summary
- `#sdlcCreate` — Create a new work item
- `#sdlcComplete` — Complete and archive a work item
- `#sdlcDecision` — Log an architectural decision

**Read/edit files directly** (no tool needed):
- Context docs: `.sdlc/context/architecture.md`, `conventions.md`
- Work item briefs: `.sdlc/work/active/<id>/brief.md`
- Work item plans: `.sdlc/work/active/<id>/plan.md`
- Any `.sdlc/` file for reading

**NEVER edit directly** (managed by tools):
- `.sdlc/manifest.json`
- `.sdlc/index/*.json`
