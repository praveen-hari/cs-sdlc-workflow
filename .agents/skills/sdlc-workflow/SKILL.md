---
name: sdlc-workflow
description: Guides AI agents through a structured SDLC workflow using the cs-sdlc CLI. Use when starting work on a project, feature, or bug. Use when you need to track work items, log decisions, manage tasks, or follow a disciplined development flow. Triggers on "start working", "track this", "log a decision", "what's the status", or any work that should be tracked.
---

# SDLC Workflow

## Overview

Follow a structured Software Development Lifecycle using the `cs-sdlc` CLI to track work, decisions, and quality. Every non-trivial piece of work gets a work item. Every significant decision gets an ADR. Every milestone gets a release. The `.sdlc/` directory is the persistent memory of the project — it survives between conversations and is readable by any tool.

**This skill teaches you how to use the `cs-sdlc` CLI as part of your development workflow.** The CLI manages the `.sdlc/` directory — you never need to edit JSON files or indexes manually.

## When to Use

- Starting any feature, bug fix, or refactor
- Making an architectural or technical decision
- Completing a piece of work
- Checking project status or active work
- Before writing code (to ensure work is tracked)
- When asked "what are we working on?" or "what decisions have been made?"

**When NOT to use:** Trivial one-line fixes, typo corrections, or exploratory conversations that don't produce code.

## Prerequisites

The project must have a `.sdlc/` directory. If it doesn't exist:

```bash
# New project
cs-sdlc init --name "Project Name"

# Existing project (auto-detects stack and modules)
cs-sdlc init --scan
```

## The Five-Phase Workflow

Every project flows through five phases. The `cs-sdlc` CLI tracks which phase you're in.

```
UNDERSTAND ──→ STRUCTURE ──→ BUILD ──→ VERIFY ──→ SHIP
     │              │           │          │         │
  Gather         Design      Implement   Test     Deploy
  requirements   architecture features   review   release
```

### Phase 1: Understand

**Goal:** Know what to build and why.

```bash
# Set the phase
cs-sdlc phase understand

# Check current status
cs-sdlc status
```

**What to do in this phase:**
- Read and update `.sdlc/context/requirements.md` with user stories and acceptance criteria
- Read `.sdlc/context/architecture.md` to understand the existing system
- Read `.sdlc/context/conventions.md` to understand code rules
- Ask clarifying questions — don't assume

**Exit criteria:** Requirements are clear enough to design a solution.

### Phase 2: Structure

**Goal:** Design the solution and make key decisions.

```bash
cs-sdlc phase structure

# Log architectural decisions
cs-sdlc decide "Use PostgreSQL for persistence" \
  --context "Need relational data with complex queries" \
  --decision "PostgreSQL 16 with Prisma ORM" \
  --rationale "Team experience, ACID compliance, JSON support"

# If replacing a previous decision
cs-sdlc decide "Switch to SQLite for dev" --supersedes 001
```

**What to do in this phase:**
- Update `.sdlc/context/architecture.md` with the design
- Log every significant decision as an ADR via `cs-sdlc decide`
- Identify which modules are affected

**Exit criteria:** Architecture is documented, key decisions are logged.

### Phase 3: Build

**Goal:** Implement the feature in tracked, incremental slices.

```bash
cs-sdlc phase build

# Start a work item
cs-sdlc start "Add user authentication" \
  --type feature \
  --priority high \
  --modules web-app,auth-service

# Write the task breakdown in plan.md (see format rules below)
# (edit .sdlc/work/active/add-user-authentication/plan.md)

# View task progress
cs-sdlc task list add-user-authentication

# After editing plan.md, sync front matter counters
cs-sdlc task sync add-user-authentication
```

**What to do in this phase:**
1. Create a work item with `cs-sdlc start`
2. Write the task breakdown in `plan.md` following the **strict format** below
3. Implement one task at a time
4. After completing a task, edit `plan.md` directly: change `- [ ]` to `- [x]`
5. Run `cs-sdlc task sync <id>` to update front matter counters
6. Commit after each task
7. Repeat until all tasks are done

**The critical rule:** Always have an active work item before writing code. If you're coding without a work item, stop and create one.

#### plan.md Format (STRICT — agents and UI must follow this)

The `plan.md` file MUST use this exact format so the SDK, CLI, and extension UI can all parse it:

```markdown
---
totalTasks: 5
completedTasks: 2
currentTask: 3
---

# Implementation Plan

## Task 1: Setup project structure
- [x] Create directory layout
- [x] Install dependencies
- [x] Configure TypeScript

## Task 2: Build core features
- [ ] Implement data model
- [ ] Add API endpoints

## Task 3: Test and verify
- [ ] Write unit tests
- [ ] Write integration tests
```

**Format rules:**
- Tasks are `- [ ]` (pending) or `- [x]` (done) — standard markdown checkboxes
- One checkbox per sub-task, on a single line
- Group tasks under `## Task N: Title` headings
- Headings are for human readability — the parser counts ALL `- [ ]` / `- [x]` lines
- Front matter (`totalTasks`, `completedTasks`, `currentTask`) is auto-synced by `cs-sdlc task sync`
- Agents edit the markdown directly (change `[ ]` to `[x]`), then run sync
- The extension UI reads the checkboxes to render a task list and can toggle them via the SDK

### Phase 4: Verify

**Goal:** Confirm the work meets acceptance criteria.

```bash
cs-sdlc phase verify

# Generate a quality snapshot after running tests
cs-sdlc snapshot \
  --grade B+ \
  --coverage 85 \
  --tests-total 200 \
  --tests-passing 198 \
  --tests-failing 2 \
  --vulnerabilities 0

# Validate .sdlc/ consistency
cs-sdlc validate
```

**What to do in this phase:**
- Run tests, linters, security scans
- Record results with `cs-sdlc snapshot`
- Review code against `.sdlc/context/conventions.md`
- Verify acceptance criteria from the work item brief

**Exit criteria:** All tests pass, quality gates met, no open issues.

### Phase 5: Ship

**Goal:** Release and document.

```bash
cs-sdlc phase ship

# Complete the work item
cs-sdlc done add-user-authentication

# Create a release
cs-sdlc release 1.2.0 --title "User Authentication"

# Update living documents
# (edit .sdlc/context/architecture.md if the architecture changed)
# (edit .sdlc/context/conventions.md if new patterns were established)
```

**What to do in this phase:**
- Complete all active work items with `cs-sdlc done`
- Create a release record with `cs-sdlc release`
- Update context documents to reflect the new state of the system

## Command Quick Reference

### Starting Work

```bash
# Feature
cs-sdlc start "Add dark mode" --type feature --priority medium

# Bug fix
cs-sdlc start "Fix login timeout" --type bug --priority high

# Refactor
cs-sdlc start "Extract auth middleware" --type refactor

# With module scope (monorepo)
cs-sdlc start "Add payment API" --modules billing-service,web-app
```

### Managing Tasks

```bash
# List tasks in a work item's plan
cs-sdlc task list <work-id>

# To complete a task: edit plan.md directly (change [ ] to [x])
# Then sync front matter counters:
cs-sdlc task sync <work-id>
```

**How agents update tasks:** Edit `plan.md` directly — change `- [ ]` to `- [x]` for completed tasks. Then run `cs-sdlc task sync <id>` to update the front matter counters. The UI and CLI read the checkbox state from the markdown.

### Completing Work

```bash
# Successfully completed
cs-sdlc done <work-id>

# Decided not to do it
cs-sdlc abandon <work-id>
```

### Inspecting State

```bash
# Project overview
cs-sdlc status

# List active work
cs-sdlc list work

# List decisions
cs-sdlc list decisions

# List releases
cs-sdlc list releases

# Show details of a work item
cs-sdlc show <work-id>

# Show details of a decision (by 3-digit ID)
cs-sdlc show 001

# JSON output for any command (for scripting)
cs-sdlc status --json
cs-sdlc list work --json
```

### Maintenance

```bash
# Rebuild indexes if files were manually edited
cs-sdlc sync

# Check consistency
cs-sdlc validate
```

## Agent Behavior Rules

### Before Writing Code

1. **Check for `.sdlc/`** — Run `cs-sdlc status`. If it fails, initialize with `cs-sdlc init --scan`.
2. **Check for active work** — Run `cs-sdlc list work`. If the current task isn't tracked, create a work item with `cs-sdlc start`.
3. **Read context** — Read `.sdlc/context/architecture.md` and `.sdlc/context/conventions.md` before generating code. Follow the conventions.

### While Writing Code

4. **Track progress** — After completing each task in the plan, run `cs-sdlc task check <id> <num>`.
5. **Log decisions** — If you make a significant technical choice (library, pattern, architecture), log it with `cs-sdlc decide`.
6. **Follow conventions** — The rules in `conventions.md` are mandatory. Don't deviate without logging a decision.

### After Writing Code

7. **Complete work** — When all tasks are done, run `cs-sdlc done <id>`.
8. **Update context** — If the architecture or conventions changed, update the context documents.
9. **Validate** — Run `cs-sdlc validate` to ensure everything is consistent.

## Integration with Other Skills

| Skill | How It Integrates |
|-------|------------------|
| `spec-driven-development` | Write the spec, then create a work item with `cs-sdlc start` to track implementation |
| `planning-and-task-breakdown` | Write the task breakdown in `plan.md`, track with `cs-sdlc task check` |
| `incremental-implementation` | Each increment = one task in the plan. Check it off when done. |
| `documentation-and-adrs` | Use `cs-sdlc decide` instead of manually creating ADR files |
| `test-driven-development` | After tests pass, record results with `cs-sdlc snapshot` |
| `git-workflow-and-versioning` | Use `cs-sdlc release` to create release records alongside git tags |
| `code-review-and-quality` | Review against `.sdlc/context/conventions.md` |

## Common Patterns

### Starting a New Feature

```bash
cs-sdlc start "Add payment integration" --type feature --priority high --modules billing,web
# Edit .sdlc/work/active/add-payment-integration/brief.md (what & why)
# Edit .sdlc/work/active/add-payment-integration/plan.md (task breakdown)
cs-sdlc task list add-payment-integration
# Implement task by task, checking off as you go
cs-sdlc task check add-payment-integration 1
# ... implement ...
cs-sdlc task check add-payment-integration 2
# When all done:
cs-sdlc done add-payment-integration
```

### Fixing a Bug

```bash
cs-sdlc start "Fix race condition in checkout" --type bug --priority critical
# Diagnose, fix, test
cs-sdlc done fix-race-condition-in-checkout
```

### Making a Decision Mid-Work

```bash
# While working on a feature, you decide to use a specific library
cs-sdlc decide "Use Stripe SDK for payments" \
  --context "Need payment processing for checkout feature" \
  --decision "Stripe Node SDK v14" \
  --rationale "Best docs, team experience, PCI compliance built-in"
```

### Checking Project Health

```bash
cs-sdlc status
cs-sdlc list work
cs-sdlc validate
```

## Red Flags

- Writing code without an active work item → Stop, run `cs-sdlc start`
- Making a decision without logging it → Stop, run `cs-sdlc decide`
- Ignoring conventions.md → Read it first, follow it, or log a decision to change it
- Completing work without checking tasks → Run `cs-sdlc task list` to verify
- Skipping validation → Run `cs-sdlc validate` before considering work done

## File Locations

The CLI manages these files — you read/edit the Markdown, the CLI handles the JSON:

| File | Who Writes | Who Reads |
|------|-----------|-----------|
| `manifest.json` | CLI (auto) | CLI, extensions, agents |
| `index/*.json` | CLI (auto) | CLI, extensions |
| `context/architecture.md` | You / AI agent | AI agents, developers |
| `context/conventions.md` | You / AI agent | AI agents, developers |
| `work/active/*/brief.md` | You / AI agent | AI agents, developers |
| `work/active/*/plan.md` | You / AI agent + CLI (checkboxes) | AI agents, developers |
| `decisions/*.md` | CLI + You | AI agents, developers |
| `releases/*.md` | CLI + You | Developers |
| `snapshots/*.json` | CLI (auto) | Extensions, CI |
