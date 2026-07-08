# Chapter 4: Layer 2 — Indexes

**Spec Version:** 1.0-draft
**Last Updated:** 2026-07-08

---

## 4.1 Overview

Index files serve as the **cross-reference table** of the `.sdlc/` format (analogous to the XRef table in PDF). They map identifiers to locations and provide summary metadata — enough to render a list view without loading the full content objects.

### 4.1.1 Design Principles

| Principle | Rule |
|-----------|------|
| **Location, not content** | Indexes store WHERE objects are and WHAT they are (summary), not the full content. |
| **Bounded growth** | Active items are naturally bounded. Historical items are capped or excluded. |
| **Derived data** | Indexes are maintained by the SDK. They CAN be regenerated from Layer 3 objects. |
| **Fast list rendering** | Extension UI renders work item lists, decision lists, and release lists from indexes alone. |

### 4.1.2 File Locations

```
.sdlc/
└── index/
    ├── work.json              ← Work item catalog
    ├── decisions.json         ← Decision record catalog
    └── releases.json          ← Release record catalog
```

All index files are OPTIONAL. If an index file is missing, the implementation SHOULD either:
1. Scan the corresponding Layer 3 directory to build the index, or
2. Show an empty list in the UI.

## 4.2 Work Index

**File:** `index/work.json`

The work index catalogs all active work items and a bounded list of recently completed items.

### 4.2.1 Schema

```json
{
  "active": [
    {
      "id": "add-dark-mode",
      "title": "Add Dark Mode",
      "type": "feature",
      "phase": "build",
      "priority": "medium",
      "progress": 40,
      "modules": ["web-app", "shared-types"],
      "createdAt": "2026-07-10T09:00:00Z",
      "path": "work/active/add-dark-mode"
    }
  ],
  "recent": [
    {
      "id": "user-auth",
      "title": "User Authentication",
      "type": "feature",
      "completedAt": "2026-07-09T18:00:00Z",
      "path": "work/archive/2026-07/user-auth"
    }
  ]
}
```

### 4.2.2 Root Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `active` | array | REQUIRED | Active work items. See §4.2.3. |
| `recent` | array | REQUIRED | Recently completed items. See §4.2.4. |

### 4.2.3 Active Work Entry

Each entry in `active` represents a work item currently in progress.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | REQUIRED | Work item identifier (matches directory name). |
| `title` | string | REQUIRED | Human-readable title. Max 200 characters. |
| `type` | string | REQUIRED | Work type. See §4.2.5. |
| `phase` | string | OPTIONAL | Current phase within the work item's pipeline. |
| `priority` | string | OPTIONAL | Priority level. One of: `"critical"`, `"high"`, `"medium"`, `"low"`. |
| `progress` | integer | OPTIONAL | Completion percentage (0-100). |
| `modules` | array | OPTIONAL | Array of module IDs this work item affects. |
| `createdAt` | string | REQUIRED | ISO 8601 timestamp. |
| `path` | string | REQUIRED | Relative path from `.sdlc/` to the work item directory. |

### 4.2.4 Recent Work Entry

Each entry in `recent` represents a recently completed work item. The `recent` array MUST contain at most **10 entries**, ordered by `completedAt` descending (most recent first).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | REQUIRED | Work item identifier. |
| `title` | string | REQUIRED | Human-readable title. |
| `type` | string | REQUIRED | Work type. See §4.2.5. |
| `completedAt` | string | REQUIRED | ISO 8601 timestamp of completion. |
| `path` | string | REQUIRED | Relative path to the archived work item directory. |

When a new item is completed and `recent` already has 10 entries, the oldest entry MUST be removed.

### 4.2.5 Work Types

| Type | Description | Typical Pipeline |
|------|-------------|-----------------|
| `"feature"` | New functionality | understand → structure → build → verify |
| `"bug"` | Defect fix | diagnose → fix → verify |
| `"refactor"` | Code improvement without behavior change | identify → plan → refactor → verify |
| `"performance"` | Speed/efficiency improvement | profile → optimize → benchmark → verify |
| `"security"` | Vulnerability fix or hardening | scan → assess → patch → verify |
| `"migration"` | Technology or framework upgrade | assess → plan → migrate → verify |
| `"architecture"` | Structural change to the system | assess → plan → implement → verify |
| `"docs"` | Documentation improvement | audit → write |
| `"release"` | Version release preparation | prepare → validate → deploy |
| `"infrastructure"` | CI/CD, tooling, DevOps changes | plan → implement → verify |
| `"tech-debt"` | Accumulated shortcut cleanup | identify → fix → verify |
| `"other"` | Anything not covered above | (custom) |

Implementations MUST accept all listed types. Implementations MAY define additional types. Unknown types MUST be preserved (not rejected).

### 4.2.6 Ordering

- `active` entries SHOULD be ordered by priority (critical first), then by `createdAt` (oldest first).
- `recent` entries MUST be ordered by `completedAt` descending.

## 4.3 Decisions Index

**File:** `index/decisions.json`

The decisions index catalogs all Architecture Decision Records (ADRs).

### 4.3.1 Schema

```json
{
  "entries": [
    {
      "id": "001",
      "slug": "tech-stack",
      "title": "Use TypeScript + React + Node.js",
      "status": "accepted",
      "date": "2026-07-08",
      "supersedes": null,
      "path": "decisions/001-tech-stack.md"
    },
    {
      "id": "002",
      "slug": "auth-strategy",
      "title": "JWT-based Authentication with Refresh Tokens",
      "status": "accepted",
      "date": "2026-07-08",
      "supersedes": null,
      "path": "decisions/002-auth-strategy.md"
    },
    {
      "id": "005",
      "slug": "move-to-microservices",
      "title": "Migrate from Monolith to Microservices",
      "status": "accepted",
      "date": "2026-09-15",
      "supersedes": "001",
      "path": "decisions/005-move-to-microservices.md"
    }
  ]
}
```

### 4.3.2 Decision Entry Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | REQUIRED | Numeric identifier, zero-padded to 3 digits (e.g., `"001"`, `"042"`). |
| `slug` | string | REQUIRED | Kebab-case short name (matches filename). |
| `title` | string | REQUIRED | Human-readable decision title. Max 200 characters. |
| `status` | string | REQUIRED | Decision status. See §4.3.3. |
| `date` | string | REQUIRED | Date the decision was made. `YYYY-MM-DD` format. |
| `supersedes` | string \| null | OPTIONAL | ID of the decision this one supersedes, or `null`. |
| `path` | string | REQUIRED | Relative path from `.sdlc/` to the decision file. |

### 4.3.3 Decision Statuses

| Status | Description |
|--------|-------------|
| `"proposed"` | Under consideration, not yet decided. |
| `"accepted"` | Decided and in effect. |
| `"deprecated"` | No longer recommended but not yet replaced. |
| `"superseded"` | Replaced by a newer decision (see `supersedes` field on the replacement). |

### 4.3.4 Ordering

Entries MUST be ordered by `id` ascending (chronological order of creation).

### 4.3.5 Immutability

Decision records are **append-only**. Once a decision is added to the index:
- Its `id`, `slug`, `date`, and `path` MUST NOT change.
- Its `status` MAY change (e.g., from `"accepted"` to `"superseded"`).
- Its `title` SHOULD NOT change (minor typo fixes are acceptable).

## 4.4 Releases Index

**File:** `index/releases.json`

The releases index catalogs all version releases.

### 4.4.1 Schema

```json
{
  "entries": [
    {
      "version": "0.1.0",
      "title": "Initial Alpha",
      "date": "2026-07-15",
      "path": "releases/v0.1.0.md"
    },
    {
      "version": "1.0.0",
      "title": "First Stable Release",
      "date": "2026-08-01",
      "path": "releases/v1.0.0.md"
    }
  ]
}
```

### 4.4.2 Release Entry Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | REQUIRED | Semantic version string (e.g., `"1.0.0"`, `"0.2.1-beta"`). MUST conform to [SemVer 2.0](https://semver.org/). |
| `title` | string | OPTIONAL | Human-readable release title. |
| `date` | string | REQUIRED | Release date. `YYYY-MM-DD` format. |
| `path` | string | REQUIRED | Relative path from `.sdlc/` to the release notes file. |

### 4.4.3 Ordering

Entries MUST be ordered by `version` ascending using SemVer precedence rules.

## 4.5 Index Maintenance

### 4.5.1 Sync Rules

Indexes are **derived data** — they summarize information from Layer 3 objects. The SDK MUST keep indexes in sync with the filesystem:

| Event | Index Update |
|-------|-------------|
| Work item created in `work/active/` | Add entry to `index/work.json` → `active` |
| Work item completed (moved to `work/archive/`) | Remove from `active`, add to `recent` (cap at 10) |
| Decision file added to `decisions/` | Add entry to `index/decisions.json` |
| Release file added to `releases/` | Add entry to `index/releases.json` |

### 4.5.2 Rebuild

If an index file is missing or corrupted, implementations MUST be able to rebuild it by scanning the corresponding Layer 3 directory:

- `index/work.json` → scan `work/active/` and `work/archive/` (recent 10 only)
- `index/decisions.json` → scan `decisions/*.md` and extract YAML front matter
- `index/releases.json` → scan `releases/*.md` and extract YAML front matter

### 4.5.3 Consistency

After any write operation, the following invariants MUST hold:

- Every entry in `index/work.json` → `active` has a corresponding directory in `work/active/`
- Every entry in `index/decisions.json` has a corresponding file in `decisions/`
- Every entry in `index/releases.json` has a corresponding file in `releases/`
- `manifest.json` → `counters.activeWork` equals the length of `index/work.json` → `active`
- `manifest.json` → `counters.decisions` equals the length of `index/decisions.json` → `entries`
- `manifest.json` → `counters.releases` equals the length of `index/releases.json` → `entries`

---

**Previous:** [Chapter 3: Layer 1 — Manifest](./03-manifest.md)
**Next:** [Chapter 5: Layer 3 — Objects](./05-objects.md)
