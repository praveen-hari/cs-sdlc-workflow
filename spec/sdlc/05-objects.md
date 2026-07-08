# Chapter 5: Layer 3 — Objects

**Spec Version:** 1.0-draft
**Last Updated:** 2026-07-08

---

## 5.1 Overview

Objects are the **content layer** of the `.sdlc/` format. They contain the actual project knowledge — architecture descriptions, coding conventions, work item details, and decision rationale. Objects are analogous to:

- **Body objects** in a PDF — the actual page content
- **Data pages** in a SQLite B-tree — the rows of data
- **Blob/tree objects** in Git — the actual file content

### 5.1.1 Design Principles

| Principle | Rule |
|-----------|------|
| **Dual format** | Markdown for humans + AI agents. JSON metadata in YAML front matter for machines. |
| **Self-contained** | Each object file is meaningful on its own without requiring other files. |
| **On-demand loading** | Objects are NOT loaded at sidebar startup. They are read when a user clicks or an agent needs context. |
| **Editable by all** | Users can edit Markdown files directly. AI agents can edit them. The SDK can update YAML front matter. |

### 5.1.2 Object Categories

| Category | Directory | Format | Mutability |
|----------|-----------|--------|-----------|
| Context documents | `context/` | Markdown + YAML front matter | Living (continuously updated) |
| Work items | `work/active/`, `work/archive/` | Markdown + YAML front matter | Active (updated during work), then frozen |
| Decision records | `decisions/` | Markdown + YAML front matter | Immutable (append-only) |
| Release notes | `releases/` | Markdown + YAML front matter | Immutable (append-only) |

## 5.2 YAML Front Matter Format

All Markdown objects in `.sdlc/` use YAML front matter for machine-readable metadata. The format follows the convention established by [DESIGN.md (Stitch/Google)](https://github.com/nicholasgasior/design.md).

### 5.2.1 Syntax

```markdown
---
key1: value1
key2: value2
nested:
  subkey: subvalue
---

# Document Title

Markdown body content here.
```

### 5.2.2 Rules

- The YAML block MUST be the first content in the file.
- The opening `---` MUST be on line 1 (no leading blank lines or BOM).
- The closing `---` MUST be on its own line.
- A blank line SHOULD follow the closing `---` before the Markdown body.
- The YAML content MUST conform to YAML 1.2.
- Unknown YAML keys MUST be preserved by implementations (not stripped).

### 5.2.3 Parsing

Implementations MUST parse YAML front matter using the following algorithm:

1. Check if the file starts with `---\n` (or `---\r\n`).
2. Find the next occurrence of `\n---\n` (or `\r\n---\r\n`).
3. Extract the content between the two delimiters as YAML.
4. Parse the YAML into a key-value structure.
5. The remainder of the file after the closing delimiter is the Markdown body.

If the file does not start with `---`, it has no front matter — the entire file is Markdown body.

## 5.3 Context Objects

Context objects are **living documents** that describe the project's current state. They are the primary context source for AI agents.

### 5.3.1 Predefined Context Documents

| File | Purpose | Recommended For |
|------|---------|----------------|
| `context/requirements.md` | What the project does, user stories, acceptance criteria | All projects |
| `context/architecture.md` | System design, component relationships, data flow | All projects |
| `context/conventions.md` | Code style rules, patterns, naming conventions | All projects |
| `context/stack.md` | Technology choices with rationale | Multi-module projects |

Implementations MAY support additional context documents. Unknown `.md` files in `context/` MUST be preserved.

### 5.3.2 `context/architecture.md`

Describes the system architecture. This is the most important context document for AI agents.

**YAML Front Matter:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | integer | OPTIONAL | Document revision number. Increment on significant changes. |
| `updatedAt` | string | OPTIONAL | ISO 8601 date of last update. |
| `type` | string | OPTIONAL | Architecture type: `"monolith"`, `"modular"`, `"microservices"`, `"serverless"`, `"hybrid"`. |

**Recommended Markdown Sections:**

| Section | Description |
|---------|-------------|
| `# {Project Name} — Architecture` | Title |
| `## System Overview` | High-level diagram (ASCII art or description) |
| `## Module Relationships` | How modules communicate (for multi-module projects) |
| `## Data Flow` | How data moves through the system |
| `## Key Design Decisions` | Links to relevant ADRs in `decisions/` |

**Example:**

```markdown
---
version: 3
updatedAt: "2026-07-10"
type: modular
---

# Budget Tracker — Architecture

## System Overview

Three-layer architecture with clear separation of concerns:

- **UI Layer** (React): Components, pages, hooks
- **API Layer** (Express): REST endpoints, middleware, validation
- **Data Layer** (SQLite): Schema, queries, migrations

## Data Flow

1. User interacts with React component
2. Component calls API via React Query hook
3. Express route validates input with Zod
4. Query executes against SQLite database
5. Response flows back through the same layers

## Key Design Decisions

- [001: Tech Stack](../decisions/001-tech-stack.md)
- [002: Auth Strategy](../decisions/002-auth-strategy.md)
```

### 5.3.3 `context/conventions.md`

Defines coding rules that AI agents MUST follow when generating code for this project.

**YAML Front Matter:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | integer | OPTIONAL | Document revision number. |
| `updatedAt` | string | OPTIONAL | ISO 8601 date of last update. |

**Recommended Markdown Sections:**

| Section | Description |
|---------|-------------|
| `## Naming` | File, variable, function, component naming rules |
| `## Patterns` | Architectural patterns to follow (e.g., "use hooks, not classes") |
| `## Testing` | Testing conventions (framework, file location, naming) |
| `## Error Handling` | How errors should be handled |
| `## Module-Specific Rules` | Per-module conventions (for multi-module projects) |

**Example:**

```markdown
---
version: 2
updatedAt: "2026-07-10"
---

# Code Conventions

## Naming
- Components: PascalCase (`ExpenseList.tsx`)
- Functions: camelCase (`calculateTotal`)
- Types: PascalCase with descriptive suffix (`ExpenseInput`, `BudgetResponse`)

## Patterns
- React: Functional components with hooks (no class components)
- API: Async handlers with try/catch, Zod validation on all inputs
- Database: Prepared statements only (never string concatenation)

## Testing
- Every API route has integration tests
- Every component has at least a render test
- Business logic has unit tests with edge cases
- Test files: `*.test.ts` or `*.test.tsx` alongside source files

## Error Handling
- All async functions use try/catch
- API errors return `{ error: string, code: number }`
- UI shows user-friendly error messages (never raw error objects)
```

### 5.3.4 `context/requirements.md`

Describes what the project does and what it should achieve.

**YAML Front Matter:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | integer | OPTIONAL | Document revision number. |
| `status` | string | OPTIONAL | `"draft"`, `"approved"`, `"evolving"`. |
| `updatedAt` | string | OPTIONAL | ISO 8601 date of last update. |

### 5.3.5 `context/stack.md`

Describes the technology stack with rationale for each choice. Particularly useful for multi-module projects where different modules use different technologies.

**YAML Front Matter:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | integer | OPTIONAL | Document revision number. |
| `updatedAt` | string | OPTIONAL | ISO 8601 date of last update. |

## 5.4 Work Item Objects

Work items are **self-contained folders** representing a unit of tracked work.

### 5.4.1 Directory Structure

```
work/
├── active/                          ← Currently in progress
│   └── {work-item-id}/
│       ├── brief.md                 ← REQUIRED: What + Why
│       └── plan.md                  ← OPTIONAL: How (task breakdown)
│
└── archive/                         ← Completed work
    └── {YYYY-MM}/                   ← Grouped by completion month
        └── {work-item-id}/
            ├── brief.md
            └── plan.md
```

### 5.4.2 `brief.md` — Work Item Brief

The brief describes **what** the work item is and **why** it exists.

**YAML Front Matter:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | REQUIRED | Work type (see §4.2.5). |
| `title` | string | REQUIRED | Human-readable title. |
| `priority` | string | OPTIONAL | `"critical"`, `"high"`, `"medium"`, `"low"`. |
| `modules` | array | OPTIONAL | Module IDs this work item affects. |
| `createdAt` | string | REQUIRED | ISO 8601 timestamp. |
| `completedAt` | string | OPTIONAL | ISO 8601 timestamp (set on completion). |
| `status` | string | OPTIONAL | Current status: `"active"`, `"completed"`, `"abandoned"`. |

**Recommended Markdown Sections:**

| Section | Description |
|---------|-------------|
| `# {Title}` | Work item title |
| `## What` | Description of the work |
| `## Why` | Motivation and context |
| `## Acceptance Criteria` | How to know when it's done |
| `## Modules Affected` | Which parts of the codebase change (multi-module) |

**Example:**

```markdown
---
type: feature
title: Add Dark Mode
priority: medium
modules:
  - web-app
  - shared-types
createdAt: "2026-07-10T09:00:00Z"
---

# Add Dark Mode

## What
Add a dark color scheme that users can toggle via a switch
in the navigation bar.

## Why
Users have requested dark mode for comfortable nighttime use.
Our analytics show 40% of users access the app after 8 PM.

## Acceptance Criteria
- [ ] Toggle switch in navigation bar
- [ ] All pages render correctly in dark mode
- [ ] User preference persists across sessions
- [ ] Respects system-level dark mode preference
- [ ] No WCAG contrast violations in dark mode

## Modules Affected
- **web-app**: Theme provider, CSS variables, toggle component
- **shared-types**: Add `ThemePreference` type
```

### 5.4.3 `plan.md` — Work Item Plan

The plan describes **how** the work will be implemented, broken into tasks.

**YAML Front Matter:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `totalTasks` | integer | OPTIONAL | Total number of tasks. |
| `completedTasks` | integer | OPTIONAL | Number of completed tasks. |
| `currentTask` | integer | OPTIONAL | Index of the current task (1-based). |

**Example:**

```markdown
---
totalTasks: 5
completedTasks: 2
currentTask: 3
---

# Implementation Plan

## Task 1: Add Theme Types ✅
Module: shared-types
- [x] Define `ThemePreference` type (`"light" | "dark" | "system"`)
- [x] Export from shared package

## Task 2: Create Theme Provider ✅
Module: web-app
- [x] Create `ThemeContext` with React Context API
- [x] Implement `useTheme()` hook
- [x] Add CSS custom properties for dark mode colors
- [x] Write tests for theme switching

## Task 3: Update Components 🔨
Module: web-app
- [x] Update navigation bar with theme toggle
- [ ] Update all page backgrounds
- [ ] Update card and surface colors
- [ ] Verify contrast ratios

## Task 4: Persist Preference
Module: web-app
- [ ] Save preference to localStorage
- [ ] Read system preference via `prefers-color-scheme`
- [ ] Sync with user profile API

## Task 5: Test & Verify
- [ ] Visual regression tests
- [ ] Accessibility audit (dark mode)
- [ ] Cross-browser testing
```

### 5.4.4 Work Item Lifecycle

```
Created                    Active                     Archived
   │                         │                           │
   ▼                         ▼                           ▼
work/active/{id}/    work/active/{id}/         work/archive/YYYY-MM/{id}/
  brief.md created     brief.md updated           brief.md frozen
  plan.md created      plan.md updated            plan.md frozen
                       (tasks checked off)         completedAt set
```

## 5.5 Decision Record Objects

Decision records are **immutable documents** that capture architectural and technical decisions.

### 5.5.1 File Naming

```
decisions/{NNN}-{slug}.md
```

- `{NNN}` — Zero-padded 3-digit sequence number (e.g., `001`, `042`).
- `{slug}` — Kebab-case short description (e.g., `tech-stack`, `auth-strategy`).

### 5.5.2 YAML Front Matter

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | REQUIRED | Same as `{NNN}` in filename. |
| `title` | string | REQUIRED | Decision title. |
| `status` | string | REQUIRED | `"proposed"`, `"accepted"`, `"deprecated"`, `"superseded"`. |
| `date` | string | REQUIRED | Date decided. `YYYY-MM-DD`. |
| `supersedes` | string | OPTIONAL | ID of the decision this replaces. |
| `supersededBy` | string | OPTIONAL | ID of the decision that replaced this one. |
| `modules` | array | OPTIONAL | Module IDs affected by this decision. |

### 5.5.3 Recommended Markdown Sections

| Section | Description |
|---------|-------------|
| `# ADR-{NNN}: {Title}` | Title with ID |
| `## Context` | What situation prompted this decision |
| `## Decision` | What was decided |
| `## Rationale` | Why this option was chosen over alternatives |
| `## Alternatives Considered` | Other options that were evaluated |
| `## Consequences` | What changes as a result of this decision |

**Example:**

```markdown
---
id: "001"
title: Use TypeScript + React + Node.js
status: accepted
date: "2026-07-08"
---

# ADR-001: Use TypeScript + React + Node.js

## Context
We need to choose a technology stack for the Budget Tracker app.
The team has experience with JavaScript/TypeScript.

## Decision
Use TypeScript as the primary language with React for the frontend
and Node.js (Express) for the backend.

## Rationale
- TypeScript provides type safety across the full stack
- Shared types between frontend and backend reduce bugs
- Large ecosystem and community support
- Team familiarity reduces ramp-up time

## Alternatives Considered
- **Python + Django**: Good for rapid prototyping but no type sharing with frontend
- **Go + React**: Better performance but smaller ecosystem for web apps
- **Next.js (fullstack)**: Considered but we want a separate API for future mobile app

## Consequences
- All developers need TypeScript knowledge
- Build tooling is more complex than plain JavaScript
- Can share validation schemas (Zod) between frontend and backend
```

### 5.5.4 Immutability Rules

- Once a decision record is created, its `id`, `date`, and `path` MUST NOT change.
- The `status` field MAY be updated (e.g., `"accepted"` → `"superseded"`).
- The Markdown body SHOULD NOT be modified after acceptance (add a new ADR instead).
- To reverse or change a decision, create a new ADR that `supersedes` the old one.

## 5.6 Release Note Objects

Release notes document what was included in each version release.

### 5.6.1 File Naming

```
releases/v{semver}.md
```

Example: `releases/v1.0.0.md`, `releases/v0.2.1-beta.md`

### 5.6.2 YAML Front Matter

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | REQUIRED | Semantic version string. |
| `date` | string | REQUIRED | Release date. `YYYY-MM-DD`. |
| `title` | string | OPTIONAL | Release title/codename. |

### 5.6.3 Recommended Markdown Sections

| Section | Description |
|---------|-------------|
| `# v{version} — {Title}` | Version and title |
| `## Highlights` | Key changes in this release |
| `## Features` | New features added |
| `## Bug Fixes` | Bugs fixed |
| `## Breaking Changes` | Changes that require user action |
| `## Work Items Included` | Links to work items completed in this release |

---

**Previous:** [Chapter 4: Layer 2 — Indexes](./04-indexes.md)
**Next:** [Chapter 6: Layer 4 — Snapshots](./06-snapshots.md)
