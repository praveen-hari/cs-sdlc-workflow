# Chapter 7: Operations

**Spec Version:** 1.0-draft
**Last Updated:** 2026-07-08

---

## 7.1 Overview

This chapter defines the **state transitions** and **file operations** that implementations MUST support. Operations are the verbs of the `.sdlc/` format — they describe how files are created, updated, moved, and synchronized.

### 7.1.1 Operation Categories

| Category | Operations |
|----------|-----------|
| **Initialization** | `init`, `init --scan` (brownfield) |
| **Work Management** | `start`, `done`, `abandon` |
| **Document Updates** | Context document edits, decision creation, release creation |
| **Analysis** | Snapshot generation, health update |
| **Maintenance** | Index rebuild, counter recalculation |

## 7.2 Initialization

### 7.2.1 Greenfield Init

Creates a new `.sdlc/` directory for a project that doesn't have one.

**Preconditions:**
- No `.sdlc/` directory exists at the project root.

**Steps:**

1. Create `.sdlc/` directory.
2. Create `manifest.json` with:
   - `specVersion`: current spec version
   - `magic`: `"cs-sdlc"`
   - `project.name`: from user input or detected from `package.json`/`*.sln`/etc.
   - `project.createdAt`: current timestamp
   - `project.mode`: `"greenfield"`
   - `counters`: all zeros
3. Create `context/` directory.
4. Create `context/architecture.md` with template content and empty YAML front matter.
5. Create `context/conventions.md` with template content and empty YAML front matter.
6. Optionally create `work/active/` directory.

**Postconditions:**
- `.sdlc/manifest.json` exists and is valid.
- `.sdlc/context/architecture.md` exists.
- `.sdlc/context/conventions.md` exists.

**Files Created:**

| File | Content |
|------|---------|
| `manifest.json` | Populated with project identity and zero counters |
| `context/architecture.md` | Template with YAML front matter + placeholder sections |
| `context/conventions.md` | Template with YAML front matter + placeholder sections |

### 7.2.2 Brownfield Init (Scan)

Creates `.sdlc/` for an existing project by scanning the codebase.

**Preconditions:**
- No `.sdlc/` directory exists.
- Project source code exists.

**Steps:**

1. Scan project root for configuration files to detect stack:
   - `package.json` → Node.js/TypeScript, check `workspaces` for monorepo
   - `*.csproj` / `*.sln` → .NET
   - `pyproject.toml` / `requirements.txt` → Python
   - `go.mod` → Go
   - `Cargo.toml` → Rust
   - `pom.xml` / `build.gradle` → Java
   - `*.tf` → Terraform
   - `Dockerfile` / `docker-compose.yml` → Containerized
2. Detect modules (for monorepo):
   - Scan workspace directories for independent package configs
   - Classify each as frontend/backend/library/infrastructure
3. Detect existing artifacts:
   - `.designs/` → cs-design integration
   - `.github/workflows/` → CI/CD exists
   - `tests/` / `__tests__/` / `*.test.*` → Testing exists
   - `docs/` / `ADR/` / `adr/` → Documentation exists
4. Create `.sdlc/` with detected information:
   - `manifest.json` with detected stack and modules
   - `project.mode`: `"brownfield"`
5. Generate initial context documents from detected information.

**Postconditions:**
- `.sdlc/manifest.json` exists with detected stack/modules.
- Context documents contain detected information (marked as auto-generated).

### 7.2.3 Detection Rules

Implementations SHOULD detect the following, in order of priority:

| Detection | Source | Confidence |
|-----------|--------|-----------|
| Project name | `package.json` → `name`, `*.sln` filename, directory name | High, Medium, Low |
| Language | File extensions (`.ts`, `.cs`, `.py`, `.go`) | High |
| Framework | Dependencies in package config | High |
| Monorepo | `workspaces` in `package.json`, `lerna.json`, `pnpm-workspace.yaml` | High |
| Testing framework | Dev dependencies, test config files | Medium |
| CI/CD | `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile` | High |

## 7.3 Work Item Operations

### 7.3.1 Start Work

Creates a new active work item.

**Input:**
- `description` (string): What the work is about
- `type` (string, optional): Work type (default: auto-detected or `"feature"`)

**Steps:**

1. Generate work item ID from description (kebab-case, max 64 chars).
2. Create directory `work/active/{id}/`.
3. Create `work/active/{id}/brief.md` with:
   - YAML front matter: `type`, `title`, `createdAt`
   - Markdown body: description
4. Optionally create `work/active/{id}/plan.md` (empty template).
5. Add entry to `index/work.json` → `active` array.
6. Increment `manifest.json` → `counters.activeWork`.

**Postconditions:**
- `work/active/{id}/brief.md` exists.
- `index/work.json` contains the new entry in `active`.
- `manifest.json` → `counters.activeWork` is incremented.

**Conflict Handling:**
- If `work/active/{id}/` already exists, append a numeric suffix (e.g., `add-payments-2`).

### 7.3.2 Complete Work

Marks an active work item as done and archives it.

**Input:**
- `id` (string): Work item identifier

**Preconditions:**
- `work/active/{id}/` exists.

**Steps:**

1. Set `completedAt` in `work/active/{id}/brief.md` YAML front matter.
2. Set `status` to `"completed"` in YAML front matter.
3. Determine archive month from current date (`YYYY-MM`).
4. Create `work/archive/{YYYY-MM}/` if it doesn't exist.
5. Move `work/active/{id}/` → `work/archive/{YYYY-MM}/{id}/`.
6. Update `index/work.json`:
   - Remove entry from `active` array.
   - Add entry to `recent` array (prepend, cap at 10).
7. Update `manifest.json`:
   - Decrement `counters.activeWork`.
   - Increment `counters.totalCompleted`.
8. Update living documents if applicable (see §7.4).

**Postconditions:**
- `work/active/{id}/` no longer exists.
- `work/archive/{YYYY-MM}/{id}/` exists.
- Index and manifest are updated.

### 7.3.3 Abandon Work

Removes an active work item without completing it.

**Input:**
- `id` (string): Work item identifier

**Steps:**

1. Set `status` to `"abandoned"` in YAML front matter.
2. Move to archive (same as complete, but with `"abandoned"` status).
3. Update index and manifest (same as complete).

## 7.4 Living Document Updates

### 7.4.1 When to Update

Living documents (`context/*.md`) SHOULD be updated when:

| Event | Documents to Update |
|-------|-------------------|
| Feature completed | `requirements.md` (add new capability) |
| Architecture change completed | `architecture.md` (update system design) |
| New convention established | `conventions.md` (add new rule) |
| Technology added/changed | `stack.md` (update stack info) |
| Decision made | Create new file in `decisions/` |

### 7.4.2 Update Rules

- Living documents are updated by **appending or modifying** Markdown content.
- The YAML front matter `version` field SHOULD be incremented on significant changes.
- The YAML front matter `updatedAt` field SHOULD be set to the current date.
- Implementations MUST NOT delete content from living documents without user confirmation.

### 7.4.3 AI Agent Updates

When an AI agent updates a living document:
- The agent SHOULD add content in the appropriate section (not at the end of the file).
- The agent MUST preserve existing content unless explicitly asked to modify it.
- The agent SHOULD update the YAML front matter `version` and `updatedAt`.

## 7.5 Decision Creation

### 7.5.1 Steps

1. Determine the next decision ID (scan `decisions/` for highest `{NNN}`, increment by 1).
2. Generate slug from title (kebab-case).
3. Create `decisions/{NNN}-{slug}.md` with YAML front matter and template sections.
4. Add entry to `index/decisions.json`.
5. Increment `manifest.json` → `counters.decisions`.

### 7.5.2 Superseding a Decision

1. Create new decision record with `supersedes` field pointing to the old decision's ID.
2. Update old decision's YAML front matter: set `status` to `"superseded"`, add `supersededBy` field.
3. Update `index/decisions.json`: change old entry's status, add new entry.

## 7.6 Release Creation

### 7.6.1 Steps

1. Create `releases/v{version}.md` with YAML front matter and changelog content.
2. Add entry to `index/releases.json`.
3. Increment `manifest.json` → `counters.releases`.
4. Optionally update `manifest.json` → `phase` to `"ship"`.

## 7.7 Sync Rules

### 7.7.1 Manifest ↔ Index Consistency

After ANY write operation, the following MUST be true:

```
manifest.counters.activeWork  == len(index/work.json → active)
manifest.counters.decisions   == len(index/decisions.json → entries)
manifest.counters.releases    == len(index/releases.json → entries)
```

### 7.7.2 Index ↔ Filesystem Consistency

```
Every entry in index/work.json → active
  HAS a corresponding directory in work/active/

Every entry in index/decisions.json → entries
  HAS a corresponding file in decisions/

Every entry in index/releases.json → entries
  HAS a corresponding file in releases/
```

### 7.7.3 Recovery

If consistency is violated (e.g., user manually deleted a file), implementations MUST:

1. Detect the inconsistency on next read.
2. Log a warning.
3. Offer to rebuild indexes from the filesystem.
4. Recalculate manifest counters from indexes.

---

**Previous:** [Chapter 6: Layer 4 — Snapshots](./06-snapshots.md)
**Next:** [Chapter 8: Multi-Module Support](./08-multi-module.md)
