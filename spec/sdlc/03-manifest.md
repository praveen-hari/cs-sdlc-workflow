# Chapter 3: Layer 1 — Manifest

**Spec Version:** 1.0-draft
**Last Updated:** 2026-07-08

---

## 3.1 Overview

The manifest (`manifest.json`) is the **header** of the `.sdlc/` format. It serves the same role as:

- The **trailer + catalog** in a PDF file — the entry point that tells you what exists and where
- The **header page** in a SQLite database — fixed-size, contains counters and version info
- The **HEAD** in a Git repository — the single pointer to the current state

### 3.1.1 Design Principles

| Principle | Rule |
|-----------|------|
| **Fixed size** | MUST NOT exceed 2 KB. Contains only identity, pointers, and counters — never arrays of content. |
| **Always current** | MUST reflect the current state of the project. Updated by the SDK on every state change. |
| **Self-contained** | MUST contain enough information to render the extension sidebar header without reading any other file. |
| **Single read** | Extension UI MUST be able to render the project overview from this file alone. |

### 3.1.2 File Location

```
.sdlc/manifest.json     ← REQUIRED (the only required file in the spec)
```

## 3.2 Schema

```json
{
  "$schema": "https://cs-sdlc.dev/schema/v1/manifest.json",
  "specVersion": "1.0",
  "magic": "cs-sdlc",

  "project": { ... },
  "modules": { ... },
  "counters": { ... },
  "phase": "...",
  "health": { ... },
  "gates": { ... }
}
```

### 3.2.1 Root Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | OPTIONAL | URI to the JSON Schema for validation. |
| `specVersion` | string | REQUIRED | The spec version this file conforms to. MUST be a semver string (e.g., `"1.0"`). |
| `magic` | string | REQUIRED | Magic identifier. MUST be the literal string `"cs-sdlc"`. Used for format detection. |
| `project` | object | REQUIRED | Project identity. See §3.3. |
| `modules` | object | OPTIONAL | Module registry. See §3.4. Omit for single-module projects. |
| `counters` | object | REQUIRED | Aggregate counts. See §3.5. |
| `phase` | string | OPTIONAL | Current primary development phase. See §3.6. |
| `health` | object | OPTIONAL | Latest quality metrics. See §3.7. |
| `gates` | object | OPTIONAL | Quality gate thresholds. See §3.8. |

## 3.3 Project Object

The `project` object contains the immutable identity of the project.

```json
{
  "project": {
    "name": "Budget Tracker",
    "description": "Personal budget tracking app for families",
    "createdAt": "2026-07-08T10:00:00Z",
    "mode": "greenfield"
  }
}
```

### 3.3.1 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | REQUIRED | Human-readable project name. 1-100 characters. |
| `description` | string | OPTIONAL | One-line project description. Max 500 characters. |
| `createdAt` | string | REQUIRED | ISO 8601 timestamp of when `.sdlc/` was initialized. |
| `mode` | string | OPTIONAL | How the project was initialized. One of: `"greenfield"`, `"brownfield"`. Default: `"greenfield"`. |

### 3.3.2 Constraints

- `name` MUST NOT be empty.
- `name` SHOULD be the same as the project's display name (e.g., from `package.json` `name` field).
- `createdAt` MUST be a valid ISO 8601 date-time string with timezone offset or `Z` suffix.
- `mode` is informational only — it does not change the behavior of the format.

## 3.4 Modules Object

The `modules` object is a registry of independently buildable units within the project. For single-module projects (a simple app with one codebase), this object SHOULD be omitted.

```json
{
  "modules": {
    "web-app": {
      "path": "apps/web",
      "type": "frontend",
      "stack": {
        "language": "typescript",
        "framework": "react"
      }
    },
    "auth-service": {
      "path": "services/auth",
      "type": "backend",
      "stack": {
        "language": "csharp",
        "framework": "dotnet-8"
      }
    },
    "shared-types": {
      "path": "libs/shared",
      "type": "library",
      "stack": {
        "language": "typescript"
      }
    }
  }
}
```

### 3.4.1 Module Entry Fields

Each key in `modules` is the **module ID** (MUST follow identifier rules from §2.4.4).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | REQUIRED | Relative path from project root to the module directory. Uses forward slashes. |
| `type` | string | REQUIRED | Module classification. See §3.4.2. |
| `stack` | object | REQUIRED | Technology stack. See §3.4.3. |
| `repo` | string | OPTIONAL | Git repository URL for multi-repo projects. If present, `path` is relative to that repo's root. |
| `description` | string | OPTIONAL | One-line description of the module's purpose. |

### 3.4.2 Module Types

| Type | Description |
|------|-------------|
| `"frontend"` | User-facing application (web, mobile, desktop) |
| `"backend"` | Server-side application or API |
| `"library"` | Shared code package consumed by other modules |
| `"infrastructure"` | DevOps, CI/CD, deployment configuration |
| `"fullstack"` | Combined frontend + backend (e.g., Next.js) |
| `"other"` | Anything not covered above |

Implementations MAY define additional module types. Unknown types MUST be preserved (not rejected).

### 3.4.3 Stack Object

The `stack` object describes the technology used in a module.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `language` | string | REQUIRED | Primary programming language (e.g., `"typescript"`, `"csharp"`, `"python"`, `"go"`, `"rust"`, `"java"`). |
| `framework` | string | OPTIONAL | Primary framework (e.g., `"react"`, `"dotnet-8"`, `"fastapi"`, `"express"`). |
| `runtime` | string | OPTIONAL | Runtime environment (e.g., `"node"`, `"deno"`, `"bun"`). |
| `database` | string | OPTIONAL | Database technology (e.g., `"postgresql"`, `"sqlite"`, `"mongodb"`). |
| `testing` | string | OPTIONAL | Testing framework (e.g., `"vitest"`, `"jest"`, `"xunit"`, `"pytest"`). |
| `styling` | string | OPTIONAL | Styling approach (e.g., `"tailwind"`, `"css-modules"`, `"styled-components"`). |

All values are lowercase strings. Implementations SHOULD NOT validate these against a fixed list — new technologies emerge constantly.

### 3.4.4 Single-Module Shorthand

For projects with a single module, the `modules` object MAY be omitted. Instead, the `stack` object MAY be placed directly in the `project` object:

```json
{
  "project": {
    "name": "My App",
    "createdAt": "2026-07-08T10:00:00Z",
    "stack": {
      "language": "typescript",
      "framework": "react",
      "database": "sqlite"
    }
  }
}
```

When `modules` is omitted and `project.stack` is present, the project is treated as a single-module project with the module ID `"app"` and path `"."`.

## 3.5 Counters Object

The `counters` object provides aggregate counts for instant dashboard rendering. These are **derived values** maintained by the SDK — they MUST NOT be manually edited.

```json
{
  "counters": {
    "activeWork": 2,
    "totalCompleted": 15,
    "decisions": 8,
    "releases": 3
  }
}
```

### 3.5.1 Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `activeWork` | integer | REQUIRED | `0` | Number of items in `work/active/`. |
| `totalCompleted` | integer | REQUIRED | `0` | Total number of completed work items (all time). |
| `decisions` | integer | REQUIRED | `0` | Number of decision records in `decisions/`. |
| `releases` | integer | OPTIONAL | `0` | Number of release records in `releases/`. |

### 3.5.2 Invariants

- `activeWork` MUST equal the number of directories in `work/active/`.
- `decisions` MUST equal the number of `.md` files in `decisions/`.
- `releases` MUST equal the number of `.md` files in `releases/`.
- If counters become inconsistent (e.g., after manual file manipulation), implementations SHOULD recalculate them from the filesystem.

## 3.6 Phase Field

The `phase` field indicates the current primary development phase of the project.

```json
{
  "phase": "build"
}
```

### 3.6.1 Valid Values

| Value | Description |
|-------|-------------|
| `"understand"` | Gathering requirements, defining what to build |
| `"structure"` | Designing architecture, making technical decisions |
| `"build"` | Implementing features, writing code |
| `"verify"` | Testing, reviewing, quality assurance |
| `"ship"` | Deploying, releasing, monitoring |

### 3.6.2 Rules

- The `phase` field is OPTIONAL. If omitted, no phase indicator is shown.
- The phase is informational — it does not restrict which operations can be performed.
- Implementations MAY auto-advance the phase based on project state (e.g., move to `"build"` when the first work item is created).

## 3.7 Health Object

The `health` object contains the latest quality metrics snapshot. It provides a quick overview without reading `snapshots/latest.json`.

```json
{
  "health": {
    "coverage": 82,
    "grade": "B+",
    "securityIssues": 0,
    "accessibilityIssues": 3,
    "updatedAt": "2026-07-10T15:00:00Z"
  }
}
```

### 3.7.1 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `coverage` | number | OPTIONAL | Test coverage percentage (0-100). |
| `grade` | string | OPTIONAL | Overall quality grade. One of: `"A+"`, `"A"`, `"A-"`, `"B+"`, `"B"`, `"B-"`, `"C+"`, `"C"`, `"C-"`, `"D"`, `"F"`. |
| `securityIssues` | integer | OPTIONAL | Number of known security vulnerabilities. |
| `accessibilityIssues` | integer | OPTIONAL | Number of accessibility violations. |
| `updatedAt` | string | OPTIONAL | ISO 8601 timestamp of when health was last calculated. |

### 3.7.2 Rules

- The `health` object is OPTIONAL. If omitted, no health indicators are shown.
- Values are populated by analysis commands (e.g., `cs-sdlc analyze`).
- Implementations MUST NOT require health data to be present for normal operation.
- The `grade` is a human-friendly summary. Implementations MAY calculate it from other metrics.

## 3.8 Gates Object

The `gates` object defines quality thresholds that the project aims to meet.

```json
{
  "gates": {
    "minCoverage": 80,
    "securityScan": true,
    "accessibility": "wcag-aa",
    "performanceBudget": {
      "lcp": "2.5s",
      "fid": "100ms",
      "cls": "0.1"
    }
  }
}
```

### 3.8.1 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `minCoverage` | number | OPTIONAL | Minimum test coverage percentage (0-100). |
| `securityScan` | boolean | OPTIONAL | Whether security scanning is required. |
| `accessibility` | string | OPTIONAL | Accessibility standard to meet (e.g., `"wcag-a"`, `"wcag-aa"`, `"wcag-aaa"`). |
| `performanceBudget` | object | OPTIONAL | Performance thresholds. Keys are metric names, values are threshold strings. |

### 3.8.2 Rules

- The `gates` object is OPTIONAL. If omitted, no quality gates are enforced.
- Gates are **aspirational** — they define targets, not hard blocks.
- Implementations MAY use gates to show pass/fail indicators in the UI by comparing `health` values against `gates` thresholds.

## 3.9 Complete Example

### 3.9.1 Single-Module Project

```json
{
  "$schema": "https://cs-sdlc.dev/schema/v1/manifest.json",
  "specVersion": "1.0",
  "magic": "cs-sdlc",

  "project": {
    "name": "Budget Tracker",
    "description": "Personal budget tracking app for families",
    "createdAt": "2026-07-08T10:00:00Z",
    "mode": "greenfield",
    "stack": {
      "language": "typescript",
      "framework": "react",
      "database": "sqlite",
      "testing": "vitest",
      "styling": "tailwind"
    }
  },

  "counters": {
    "activeWork": 1,
    "totalCompleted": 5,
    "decisions": 3,
    "releases": 1
  },

  "phase": "build",

  "health": {
    "coverage": 82,
    "grade": "B+",
    "securityIssues": 0,
    "updatedAt": "2026-07-10T15:00:00Z"
  },

  "gates": {
    "minCoverage": 80,
    "securityScan": true,
    "accessibility": "wcag-aa"
  }
}
```

### 3.9.2 Multi-Module Project

```json
{
  "$schema": "https://cs-sdlc.dev/schema/v1/manifest.json",
  "specVersion": "1.0",
  "magic": "cs-sdlc",

  "project": {
    "name": "E-Commerce Platform",
    "description": "Multi-service e-commerce platform",
    "createdAt": "2026-07-08T10:00:00Z",
    "mode": "brownfield"
  },

  "modules": {
    "web-app": {
      "path": "apps/web",
      "type": "frontend",
      "stack": { "language": "typescript", "framework": "react", "styling": "tailwind" }
    },
    "auth-service": {
      "path": "services/auth",
      "type": "backend",
      "stack": { "language": "csharp", "framework": "dotnet-8" }
    },
    "billing-service": {
      "path": "services/billing",
      "type": "backend",
      "stack": { "language": "typescript", "framework": "express" }
    },
    "shared-types": {
      "path": "libs/shared",
      "type": "library",
      "stack": { "language": "typescript" }
    }
  },

  "counters": {
    "activeWork": 2,
    "totalCompleted": 15,
    "decisions": 8,
    "releases": 3
  },

  "phase": "build",

  "health": {
    "coverage": 78,
    "grade": "B",
    "securityIssues": 1,
    "updatedAt": "2026-07-10T15:00:00Z"
  },

  "gates": {
    "minCoverage": 80,
    "securityScan": true,
    "accessibility": "wcag-aa",
    "performanceBudget": {
      "lcp": "2.5s"
    }
  }
}
```

### 3.9.3 Minimal Valid Manifest

The smallest valid `manifest.json`:

```json
{
  "specVersion": "1.0",
  "magic": "cs-sdlc",
  "project": {
    "name": "My App",
    "createdAt": "2026-07-08T10:00:00Z"
  },
  "counters": {
    "activeWork": 0,
    "totalCompleted": 0,
    "decisions": 0
  }
}
```

---

**Previous:** [Chapter 2: File Structure](./02-file-structure.md)
**Next:** [Chapter 4: Layer 2 — Indexes](./04-indexes.md)
