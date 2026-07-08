# Implementation Plan: `@syncfusion/cs-sdlc` SDK

## Overview

Build the reference TypeScript SDK for the `.sdlc/` file format specification (v1.0-draft) at Level 3 (Full) conformance. The SDK is a library-only package providing Zod schemas, file I/O primitives, CRUD operations, brownfield scanning, and consistency enforcement.

## Architecture Decisions

- **Zod as single source of truth** — Every JSON structure in the spec gets a Zod schema. TypeScript types are inferred via `z.infer<>`. JSON Schemas are generated via `zod-to-json-schema`. One definition, three outputs.
- **Passthrough for extensibility** — Module types, work types, and decision statuses use `z.union([z.enum([...known]), z.string()])` so unknown values are preserved per §9.6.1.
- **Two identifier schemas** — `identifierSchema` for kebab-case IDs (modules, work items) and `decisionIdSchema` for zero-padded numeric IDs (`"001"`).
- **Real filesystem in tests** — All operation tests use `mkdtemp` + `rm` for isolated temp directories. No mocking `fs`.
- **Cumulative counters** — `totalCompleted` is a cumulative counter that cannot be recalculated from filesystem alone. The SDK increments it on `completeWork`/`abandonWork` but does not attempt to derive it during `recalculateCounters`.

## Dependency Graph

```
Phase 1: Schemas + Types (foundation — no I/O)
    │
Phase 2: Core I/O (reader, writer, frontmatter, discovery, errors)
    │
Phase 3: Operations (init, work CRUD, decisions, releases, snapshots, sync)
    │
Phase 4: Scanner (brownfield detection)
    │
Phase 5: JSON Schema generation + conformance tests + barrel export
```

Each phase builds on the previous. Within a phase, tasks are ordered by internal dependencies.

---

## Phase 1: Schemas & Types

The foundation layer. Pure data definitions — no filesystem, no I/O. Everything else depends on this.

### Task 1: Shared schemas and utilities
**Description:** Create the shared building blocks used by all other schemas: identifier validation, ISO 8601 date schema, grade enum, phase enum, work type enum, module type enum, decision status enum, priority enum.

**Acceptance criteria:**
- [ ] `identifierSchema` validates kebab-case, starts with letter, max 64 chars, no consecutive hyphens
- [ ] `decisionIdSchema` validates zero-padded 3-digit strings (`"001"` through `"999"`)
- [ ] `iso8601Schema` validates ISO 8601 date-time strings
- [ ] `dateSchema` validates `YYYY-MM-DD` strings
- [ ] `monthSchema` validates `YYYY-MM` strings
- [ ] All enums use `z.union([z.enum([...known]), z.string()])` pattern for extensibility
- [ ] All types are exported via `z.infer<>`

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/schemas/shared.test.ts`

**Dependencies:** None

**Files:**
- `src/schemas/shared.ts`
- `src/utils/slugify.ts`
- `src/utils/dates.ts`
- `tests/schemas/shared.test.ts`

**Scope:** M (4 files)

---

### Task 2: Manifest schema
**Description:** Define the complete manifest.json schema per Chapter 3: project, modules, counters, phase, health, gates — including all sub-objects (stackSchema, moduleEntrySchema, healthSchema, gatesSchema, performanceBudgetSchema).

**Acceptance criteria:**
- [ ] `manifestSchema` validates the single-module example from §3.9.1
- [ ] `manifestSchema` validates the multi-module example from §3.9.2
- [ ] `manifestSchema` rejects missing required fields (`specVersion`, `magic`, `project.name`, `project.createdAt`, `counters`)
- [ ] `manifestSchema` preserves unknown fields (`.passthrough()`)
- [ ] `magic` field only accepts literal `"cs-sdlc"`
- [ ] `project.name` enforces min 1, max 100 chars
- [ ] `project.description` enforces max 500 chars
- [ ] Single-module shorthand (`project.stack` without `modules`) is valid

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/schemas/manifest.test.ts`

**Dependencies:** Task 1

**Files:**
- `src/schemas/manifest.ts`
- `tests/schemas/manifest.test.ts`

**Scope:** M (2 files, but complex schema)

---

### Task 3: Index schemas
**Description:** Define schemas for all three index files per Chapter 4: work index (active + recent arrays), decisions index, releases index — including all entry sub-schemas.

**Acceptance criteria:**
- [ ] `workIndexSchema` validates the example from §4.2.1
- [ ] Active entries have all required fields (`id`, `title`, `type`, `createdAt`, `path`)
- [ ] Recent entries capped at 10 (validation or documented constraint)
- [ ] `decisionsIndexSchema` validates the example from §4.3.1
- [ ] Decision entries enforce `id` as `decisionIdSchema`, `status` as decision status enum
- [ ] `releasesIndexSchema` validates the example from §4.4.1
- [ ] Release entries enforce `version` as SemVer string
- [ ] All schemas use `.passthrough()` for forward compatibility

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/schemas/indexes.test.ts`

**Dependencies:** Task 1

**Files:**
- `src/schemas/indexes.ts`
- `src/utils/semver.ts`
- `tests/schemas/indexes.test.ts`

**Scope:** M (3 files)

---

### Task 4: Object front matter schemas
**Description:** Define Zod schemas for YAML front matter of all Markdown object types per Chapter 5: architecture, conventions, requirements, stack (context docs), brief, plan (work items), decision records, release notes.

**Acceptance criteria:**
- [ ] `architectureFrontMatterSchema` has `version`, `updatedAt`, `type` (architecture type enum)
- [ ] `conventionsFrontMatterSchema` has `version`, `updatedAt`
- [ ] `requirementsFrontMatterSchema` has `version`, `status` (draft/approved/evolving), `updatedAt`
- [ ] `stackFrontMatterSchema` has `version`, `updatedAt`
- [ ] `briefFrontMatterSchema` has `type` (required), `title` (required), `priority`, `modules`, `createdAt` (required), `completedAt`, `status`
- [ ] `planFrontMatterSchema` has `totalTasks`, `completedTasks`, `currentTask`
- [ ] `decisionFrontMatterSchema` has `id` (required), `title` (required), `status` (required), `date` (required), `supersedes`, `supersededBy`, `modules`
- [ ] `releaseFrontMatterSchema` has `version` (required), `date` (required), `title`
- [ ] All schemas use `.passthrough()` for unknown YAML keys

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/schemas/objects.test.ts`

**Dependencies:** Task 1

**Files:**
- `src/schemas/objects.ts`
- `tests/schemas/objects.test.ts`

**Scope:** M (2 files, many schemas)

---

### Task 5: Snapshot schemas
**Description:** Define schemas for latest snapshot and historical snapshots per Chapter 6: overall, coverage, tests, security, accessibility (with details array), complexity, per-module metrics, and monthly history.

**Acceptance criteria:**
- [ ] `latestSnapshotSchema` validates the full example from §6.2.1
- [ ] All sub-objects (`overall`, `coverage`, `tests`, `security`, `accessibility`, `complexity`) have correct required/optional fields
- [ ] `accessibilityDetailSchema` validates `rule`, `count`, `severity` entries
- [ ] `historySnapshotSchema` validates the example from §6.3.1
- [ ] Per-module metrics accept any subset of the top-level metrics
- [ ] All schemas use `.passthrough()`

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/schemas/snapshots.test.ts`

**Dependencies:** Task 1

**Files:**
- `src/schemas/snapshots.ts`
- `tests/schemas/snapshots.test.ts`

**Scope:** M (2 files)

---

### Task 6: Types barrel export
**Description:** Create the types barrel that re-exports `z.infer<>` types from all schema files. This is the public type surface of the SDK.

**Acceptance criteria:**
- [ ] Every schema defined in Tasks 1–5 has a corresponding exported type
- [ ] Types compile cleanly (`tsc --noEmit`)
- [ ] No circular imports

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc typecheck`

**Dependencies:** Tasks 1–5

**Files:**
- `src/types/index.ts`

**Scope:** S (1 file)

---

### ✅ Checkpoint: Phase 1 Complete
- [ ] All schema tests pass
- [ ] `pnpm --filter @syncfusion/cs-sdlc typecheck` clean
- [ ] Every field table in spec chapters 3–6 has a corresponding Zod schema
- [ ] All spec examples from §3.9, §4.2.1, §4.3.1, §4.4.1, §6.2.1, §6.3.1 validate successfully

---

## Phase 2: Core I/O

Low-level primitives for reading, writing, parsing, and discovering `.sdlc/` files. Operations (Phase 3) build on these.

### Task 7: Error types
**Description:** Define the SDK error hierarchy: `SdlcError` base class, `NotFoundError`, `ValidationError`, `ConsistencyError`, `IdentifierError`.

**Acceptance criteria:**
- [ ] All errors extend `SdlcError`
- [ ] Each error has a `code` string for programmatic matching
- [ ] `ValidationError` wraps Zod issues array
- [ ] Errors are instanceof-checkable

**Verification:**
- [ ] Unit tests for error construction and instanceof checks

**Dependencies:** None

**Files:**
- `src/core/errors.ts`
- `tests/core/errors.test.ts`

**Scope:** S (2 files)

---

### Task 8: Identifier validation
**Description:** Implement identifier validation per §2.4.4: kebab-case identifiers for modules/work items, numeric IDs for decisions, slug generation from titles.

**Acceptance criteria:**
- [ ] `validateIdentifier()` accepts `add-dark-mode`, rejects `Add_Dark_Mode`, `--fix`, `a`, strings > 64 chars, consecutive hyphens
- [ ] `validateDecisionId()` accepts `"001"`, `"042"`, rejects `"1"`, `"0001"`, `"abc"`
- [ ] `slugify()` converts `"Add Dark Mode"` → `"add-dark-mode"`, handles special chars, truncates to 64 chars
- [ ] `generateWorkItemId()` creates slug from description, handles conflicts by appending `-2`, `-3`

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/core/identifiers.test.ts`

**Dependencies:** Task 1 (shared schemas), Task 7 (errors)

**Files:**
- `src/core/identifiers.ts`
- `src/utils/slugify.ts` (update from Task 1 if needed)
- `tests/core/identifiers.test.ts`

**Scope:** S (3 files)

---

### Task 9: YAML front matter parser
**Description:** Implement the front matter parse/serialize algorithm per §5.2.3: detect `---` delimiters, extract YAML, return structured `{ frontMatter, body }`. Serialize back with correct formatting (blank line after closing `---`).

**Acceptance criteria:**
- [ ] Parses files with valid front matter into `{ frontMatter: object, body: string }`
- [ ] Returns `{ frontMatter: null, body: string }` for files without front matter
- [ ] Handles edge cases: empty YAML block, no closing `---`, CRLF line endings
- [ ] Serializer produces `---\n{yaml}\n---\n\n{body}` format (blank line per §2.5.4)
- [ ] Preserves unknown YAML keys on round-trip (parse → serialize)
- [ ] Uses `yaml` npm package for YAML parsing (YAML 1.2)

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/core/frontmatter.test.ts`

**Dependencies:** None (uses `yaml` package directly)

**Files:**
- `src/core/frontmatter.ts`
- `tests/core/frontmatter.test.ts`

**Scope:** S (2 files)

---

### Task 10: Atomic JSON writer
**Description:** Implement the write-to-temp-then-rename pattern per §2.6.1 for all JSON file writes. Include 2-space indentation per §2.5.3. Add size warning for manifest > 2 KB.

**Acceptance criteria:**
- [ ] `writeJsonAtomic(path, data)` writes to `{path}.tmp` then renames to `{path}`
- [ ] Output uses 2-space indentation, trailing newline
- [ ] Output is UTF-8 without BOM
- [ ] Warns (does not error) if manifest exceeds 2 KB
- [ ] Creates parent directories if they don't exist
- [ ] Handles write failure gracefully (cleans up temp file)

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/core/writer.test.ts`

**Dependencies:** Task 7 (errors)

**Files:**
- `src/core/writer.ts`
- `tests/core/writer.test.ts`

**Scope:** S (2 files)

---

### Task 11: File reader
**Description:** Implement readers for JSON files (with Zod validation) and Markdown files (with front matter extraction). Include BOM detection/stripping per §2.5.1.

**Acceptance criteria:**
- [ ] `readJson(path, schema)` reads, parses, validates against Zod schema, returns typed result
- [ ] `readJson` strips BOM if present
- [ ] `readJson` throws `ValidationError` on schema mismatch with file path in error
- [ ] `readJson` throws `NotFoundError` if file doesn't exist
- [ ] `readMarkdown(path, frontMatterSchema?)` returns `{ frontMatter, body }` with optional validation
- [ ] Both readers handle UTF-8 encoding

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/core/reader.test.ts`

**Dependencies:** Task 7 (errors), Task 9 (frontmatter)

**Files:**
- `src/core/reader.ts`
- `tests/core/reader.test.ts`

**Scope:** S (2 files)

---

### Task 12: Directory discovery
**Description:** Implement the walk-up discovery algorithm per §2.1.2: search upward from a starting path to filesystem root, stopping at the first `.sdlc/` directory found.

**Acceptance criteria:**
- [ ] `discoverSdlc("/a/b/c")` finds `.sdlc/` at `/a/b/.sdlc/` or `/a/.sdlc/` etc.
- [ ] Returns the full path to the `.sdlc/` directory
- [ ] Throws `NotFoundError` if no `.sdlc/` found up to filesystem root
- [ ] Stops at filesystem root (doesn't infinite loop)
- [ ] Works with symlinks

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/core/discovery.test.ts`

**Dependencies:** Task 7 (errors)

**Files:**
- `src/core/discovery.ts`
- `tests/core/discovery.test.ts`

**Scope:** S (2 files)

---

### Task 13: Constants
**Description:** Define all SDK constants: directory names, file names, size limits, debounce values, magic string.

**Acceptance criteria:**
- [ ] `SDLC_DIR = '.sdlc'`
- [ ] `MANIFEST_FILE = 'manifest.json'`
- [ ] All directory/file names from §2.3.1
- [ ] Size limits from §2.2.2 (`MAX_MANIFEST_SIZE = 2048`, etc.)
- [ ] `DEBOUNCE_MS = 300` (exported for consumers per §2.6.2)
- [ ] `MAGIC = 'cs-sdlc'`
- [ ] `SPEC_VERSION = '1.0'`
- [ ] `MAX_RECENT_ITEMS = 10`
- [ ] `MAX_ACTIVE_WORK_ITEMS = 20`

**Verification:**
- [ ] Typecheck passes

**Dependencies:** None

**Files:**
- `src/core/constants.ts`

**Scope:** XS (1 file)

---

### ✅ Checkpoint: Phase 2 Complete
- [ ] All core tests pass
- [ ] Can read/write JSON files atomically
- [ ] Can parse/serialize YAML front matter
- [ ] Can discover `.sdlc/` directories
- [ ] Can validate identifiers
- [ ] `pnpm --filter @syncfusion/cs-sdlc typecheck` clean

---

## Phase 3: Operations

High-level CRUD operations per Chapter 7. Each operation uses core I/O from Phase 2 and schemas from Phase 1. This is the meat of the SDK.

### Task 14: Greenfield init
**Description:** Implement `initSdlc()` per §7.2.1: create `.sdlc/` directory, manifest.json, context/architecture.md template, context/conventions.md template. Optionally create work/active/ directory.

**Acceptance criteria:**
- [ ] Creates valid `.sdlc/manifest.json` with all required fields
- [ ] Creates `context/architecture.md` with YAML front matter + template sections
- [ ] Creates `context/conventions.md` with YAML front matter + template sections
- [ ] Creates `work/active/` directory
- [ ] Rejects if `.sdlc/` already exists
- [ ] Detects project name from `package.json` if not provided
- [ ] Manifest validates against `manifestSchema`
- [ ] All postconditions from §7.2.1 are met

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/operations/init.test.ts`

**Dependencies:** Tasks 1–2 (schemas), Tasks 7, 10–13 (core)

**Files:**
- `src/operations/init.ts`
- `tests/operations/init.test.ts`

**Scope:** M (2 files)

---

### Task 15: Start work
**Description:** Implement `startWork()` per §7.3.1: create work item directory, brief.md, optional plan.md, update work index, increment manifest counter.

**Acceptance criteria:**
- [ ] Creates `work/active/{id}/brief.md` with valid YAML front matter
- [ ] Generates slug ID from description (kebab-case, max 64 chars)
- [ ] Handles ID conflicts by appending `-2`, `-3`
- [ ] Adds entry to `index/work.json` → `active` array
- [ ] Increments `manifest.json` → `counters.activeWork`
- [ ] Manifest ↔ index consistency holds after operation (§7.7.1)
- [ ] Optionally creates `plan.md` template

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/operations/work-start.test.ts`

**Dependencies:** Task 14 (init creates the directory structure)

**Files:**
- `src/operations/work-start.ts`
- `tests/operations/work-start.test.ts`

**Scope:** M (2 files)

---

### Task 16: Complete work
**Description:** Implement `completeWork()` per §7.3.2: set completedAt, move to archive with monthly partitioning, update index (remove from active, add to recent with cap at 10), update manifest counters.

**Acceptance criteria:**
- [ ] Sets `completedAt` and `status: "completed"` in brief.md front matter
- [ ] Moves directory from `work/active/{id}/` to `work/archive/{YYYY-MM}/{id}/`
- [ ] Creates archive month directory if needed
- [ ] Removes entry from `index/work.json` → `active`
- [ ] Adds entry to `index/work.json` → `recent` (prepend, cap at 10)
- [ ] Oldest recent entry dropped when exceeding 10
- [ ] Decrements `counters.activeWork`, increments `counters.totalCompleted`
- [ ] Throws if work item doesn't exist in `work/active/`

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/operations/work-complete.test.ts`

**Dependencies:** Task 15

**Files:**
- `src/operations/work-complete.ts`
- `tests/operations/work-complete.test.ts`

**Scope:** M (2 files)

---

### Task 17: Abandon work
**Description:** Implement `abandonWork()` per §7.3.3: same as complete but with `status: "abandoned"`.

**Acceptance criteria:**
- [ ] Sets `status: "abandoned"` in brief.md front matter
- [ ] Archives to same `work/archive/{YYYY-MM}/{id}/` path
- [ ] Updates index and counters same as complete
- [ ] Distinct from complete in status field only

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/operations/work-abandon.test.ts`

**Dependencies:** Task 16 (shares archive logic)

**Files:**
- `src/operations/work-abandon.ts`
- `tests/operations/work-abandon.test.ts`

**Scope:** S (2 files, reuses complete logic)

---

### Task 18: Create decision
**Description:** Implement `createDecision()` per §7.5.1: determine next ID, generate slug, create decision markdown file, update decisions index, increment manifest counter.

**Acceptance criteria:**
- [ ] Scans `decisions/` for highest `{NNN}`, increments by 1
- [ ] Creates `decisions/{NNN}-{slug}.md` with valid YAML front matter
- [ ] Adds entry to `index/decisions.json` → `entries` (ordered by ID ascending)
- [ ] Increments `manifest.json` → `counters.decisions`
- [ ] Decision ID is zero-padded to 3 digits
- [ ] Default status is `"accepted"`

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/operations/decision-create.test.ts`

**Dependencies:** Task 14 (init)

**Files:**
- `src/operations/decision-create.ts`
- `tests/operations/decision-create.test.ts`

**Scope:** M (2 files)

---

### Task 19: Supersede decision
**Description:** Implement `supersedeDecision()` per §7.5.2: create new decision with `supersedes` field, update old decision's status to `"superseded"` and add `supersededBy` field, update index.

**Acceptance criteria:**
- [ ] Creates new decision record with `supersedes` pointing to old ID
- [ ] Updates old decision's front matter: `status → "superseded"`, adds `supersededBy`
- [ ] Updates old entry's status in `index/decisions.json`
- [ ] Old decision's `id`, `slug`, `date`, `path` are NOT changed (immutability per §4.3.5)
- [ ] Manifest counter incremented (new decision added)

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/operations/decision-supersede.test.ts`

**Dependencies:** Task 18

**Files:**
- `src/operations/decision-supersede.ts`
- `tests/operations/decision-supersede.test.ts`

**Scope:** M (2 files)

---

### Task 20: Create release
**Description:** Implement `createRelease()` per §7.6: create release markdown file, update releases index (ordered by SemVer), increment manifest counter.

**Acceptance criteria:**
- [ ] Creates `releases/v{version}.md` with valid YAML front matter
- [ ] Adds entry to `index/releases.json` → `entries` (ordered by SemVer ascending)
- [ ] Increments `manifest.json` → `counters.releases`
- [ ] Version must be valid SemVer
- [ ] Rejects duplicate versions

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/operations/release-create.test.ts`

**Dependencies:** Task 14 (init)

**Files:**
- `src/operations/release-create.ts`
- `tests/operations/release-create.test.ts`

**Scope:** S (2 files)

---

### Task 21: Generate snapshot
**Description:** Implement `generateSnapshot()` per §6.4: accept pre-computed metrics, write `snapshots/latest.json`, append to monthly history, sync health to manifest.

**Acceptance criteria:**
- [ ] Writes `snapshots/latest.json` (overwrites existing)
- [ ] Appends summary to `snapshots/history/{YYYY-MM}.json`
- [ ] Creates history file if it doesn't exist
- [ ] Caps history entries at 4 per month (§6.3.3)
- [ ] Syncs `manifest.json` → `health` fields per §6.4.3 mapping
- [ ] Sets `generatedAt` timestamp automatically

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/operations/snapshot-generate.test.ts`

**Dependencies:** Task 14 (init)

**Files:**
- `src/operations/snapshot-generate.ts`
- `tests/operations/snapshot-generate.test.ts`

**Scope:** M (2 files)

---

### Task 22: Sync and consistency
**Description:** Implement `rebuildIndexes()`, `recalculateCounters()`, and `validateConsistency()` per §7.7: rebuild indexes from filesystem, recalculate manifest counters from indexes, check all invariants and return a structured report.

**Acceptance criteria:**
- [ ] `rebuildIndexes()` scans `work/active/`, `work/archive/` (recent 10), `decisions/`, `releases/` and rebuilds all index files
- [ ] `recalculateCounters()` derives `activeWork`, `decisions`, `releases` from indexes; preserves `totalCompleted` (cumulative)
- [ ] `validateConsistency()` checks all §7.7 invariants and returns `ConsistencyReport` with pass/fail per invariant
- [ ] `ConsistencyReport` includes: manifest↔index counter match, index↔filesystem entry match, size warnings
- [ ] Recovery: offers to fix inconsistencies when detected

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/operations/sync.test.ts`

**Dependencies:** Tasks 14–21 (needs all operations to create test scenarios)

**Files:**
- `src/operations/sync.ts`
- `tests/operations/sync.test.ts`

**Scope:** L (2 files, but complex logic)

---

### Task 23: Read helpers
**Description:** Implement all public read functions: `readManifest`, `readWorkIndex`, `readDecisionsIndex`, `readReleasesIndex`, `readContextDoc`, `readWorkItem`, `readDecision`, `readRelease`, `readLatestSnapshot`, `readHistoricalSnapshot`. Thin wrappers over core reader + schemas.

**Acceptance criteria:**
- [ ] Each function reads the correct file path relative to `.sdlc/`
- [ ] Each function validates against the correct Zod schema
- [ ] `readContextDoc(root, 'architecture')` reads `context/architecture.md` and parses front matter
- [ ] `readWorkItem(root, id)` reads `work/active/{id}/brief.md` (checks active first, then archive)
- [ ] `readHistoricalSnapshot(root, '2026-07')` reads `snapshots/history/2026-07.json`
- [ ] All throw `NotFoundError` for missing files
- [ ] All throw `ValidationError` for invalid data

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/core/reader.test.ts` (extend existing)

**Dependencies:** Tasks 1–5 (schemas), Task 11 (reader)

**Files:**
- `src/core/reader.ts` (extend)
- `tests/core/reader.test.ts` (extend)

**Scope:** M (2 files, many functions)

---

### Task 24: Update phase + module lifecycle
**Description:** Implement `updatePhase()` for manifest phase changes, and `addModule()`, `removeModule()`, `renameModule()` per §8.6.

**Acceptance criteria:**
- [ ] `updatePhase(root, 'build')` updates `manifest.json` → `phase`
- [ ] `addModule(root, id, entry)` adds to `manifest.json` → `modules`
- [ ] `removeModule(root, id)` removes from `manifest.json` → `modules`, does NOT modify archived work items
- [ ] `renameModule(root, oldId, newId)` updates manifest + active work index entries' `modules` arrays
- [ ] All validate inputs and maintain manifest consistency

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/operations/module-lifecycle.test.ts`

**Dependencies:** Task 14 (init)

**Files:**
- `src/operations/phase.ts`
- `src/operations/module-lifecycle.ts`
- `tests/operations/module-lifecycle.test.ts`

**Scope:** M (3 files)

---

### ✅ Checkpoint: Phase 3 Complete
- [ ] All operation tests pass
- [ ] Full work item lifecycle works: start → complete/abandon
- [ ] Decision lifecycle works: create → supersede
- [ ] Release creation works
- [ ] Snapshot generation + history works
- [ ] Index rebuild + counter recalculation works
- [ ] All §7.7 invariants enforced
- [ ] `pnpm --filter @syncfusion/cs-sdlc test` — all green
- [ ] `pnpm --filter @syncfusion/cs-sdlc typecheck` — clean

---

## Phase 4: Brownfield Scanner

Project detection for `initSdlcFromScan()`. Depends on init operation from Phase 3.

### Task 25: Stack detection
**Description:** Implement `detectStack()` per §7.2.2 and §7.2.3: scan project root for config files to detect language, framework, runtime, testing, database.

**Acceptance criteria:**
- [ ] Detects Node.js/TypeScript from `package.json`
- [ ] Detects .NET from `*.csproj` / `*.sln`
- [ ] Detects Python from `pyproject.toml` / `requirements.txt`
- [ ] Detects Go from `go.mod`
- [ ] Detects Rust from `Cargo.toml`
- [ ] Detects Java from `pom.xml` / `build.gradle`
- [ ] Detects frameworks from dependencies (React, Express, FastAPI, etc.)
- [ ] Returns confidence level per §8.3.2

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/scanner/detect-stack.test.ts`

**Dependencies:** None (pure filesystem scanning)

**Files:**
- `src/scanner/detect-stack.ts`
- `src/scanner/heuristics.ts`
- `tests/scanner/detect-stack.test.ts`
- `tests/fixtures/projects/` (fixture directories)

**Scope:** L (4+ files, many heuristics)

---

### Task 26: Module detection
**Description:** Implement `detectModules()` per §8.3.1: detect monorepo structure from workspace configs, classify each workspace as frontend/backend/library/infrastructure.

**Acceptance criteria:**
- [ ] Detects npm/yarn/pnpm workspaces from `package.json` → `workspaces`
- [ ] Detects pnpm workspaces from `pnpm-workspace.yaml`
- [ ] Detects Nx from `nx.json`, Turborepo from `turbo.json`, Lerna from `lerna.json`
- [ ] Classifies each workspace module by type (frontend/backend/library/infrastructure)
- [ ] Returns module entries ready for `manifest.json` → `modules`

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/scanner/detect-modules.test.ts`

**Dependencies:** Task 25 (uses stack detection per module)

**Files:**
- `src/scanner/detect-modules.ts`
- `tests/scanner/detect-modules.test.ts`
- `tests/fixtures/projects/monorepo-turborepo/` (fixture)

**Scope:** M (3 files)

---

### Task 27: Brownfield init
**Description:** Implement `initSdlcFromScan()` per §7.2.2: combine stack detection + module detection + greenfield init to create a pre-populated `.sdlc/` directory.

**Acceptance criteria:**
- [ ] Scans project and populates `manifest.json` with detected stack/modules
- [ ] Sets `project.mode: "brownfield"`
- [ ] Generates initial `context/architecture.md` from detected information
- [ ] Generates initial `context/conventions.md` with detected patterns
- [ ] Detects existing artifacts (`.github/workflows/`, `tests/`, `docs/`)
- [ ] All postconditions from §7.2.2 are met

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/operations/init-scan.test.ts`

**Dependencies:** Tasks 14, 25, 26

**Files:**
- `src/operations/init-scan.ts`
- `tests/operations/init-scan.test.ts`

**Scope:** M (2 files)

---

### ✅ Checkpoint: Phase 4 Complete
- [ ] Scanner detects all 6 language ecosystems
- [ ] Monorepo detection works for npm/pnpm/Turborepo/Nx/Lerna
- [ ] `initSdlcFromScan()` produces valid `.sdlc/` from fixture projects
- [ ] All scanner tests pass

---

## Phase 5: Polish & Ship

JSON Schema generation, conformance tests, barrel export, documentation.

### Task 28: JSON Schema generation
**Description:** Create the `scripts/generate-schemas.ts` script that converts all Zod schemas to JSON Schema files using `zod-to-json-schema`.

**Acceptance criteria:**
- [ ] Generates all schema files listed in `schemas/` directory
- [ ] Includes front matter schemas (architecture, conventions, brief, plan, decision, release)
- [ ] Generated schemas are valid JSON Schema draft-07
- [ ] `$schema` and `$id` fields are set correctly
- [ ] Script is idempotent (running twice produces same output)

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc schemas` runs without error
- [ ] Generated files are valid JSON

**Dependencies:** Tasks 1–5 (all schemas)

**Files:**
- `scripts/generate-schemas.ts`
- `schemas/*.schema.json` (generated output)

**Scope:** M (1 script + ~13 output files)

---

### Task 29: Conformance tests
**Description:** Write end-to-end conformance tests per Chapter 9: create Level 1, 2, and 3 directories using the SDK, validate all invariants, test forward compatibility and graceful degradation.

**Acceptance criteria:**
- [ ] Level 1 test: create minimal `.sdlc/` (manifest only), read back, verify
- [ ] Level 2 test: create standard `.sdlc/` (+ context docs + work items), full lifecycle
- [ ] Level 3 test: create full `.sdlc/` (+ indexes + snapshots + releases), verify all sync rules
- [ ] Forward compat test: manifest with unknown fields preserved on read/write round-trip
- [ ] Version handling test: minor version higher reads successfully, major version warns
- [ ] Graceful degradation test: Level 3 reader handles Level 1 directory without error
- [ ] Unknown module/work types preserved (not rejected)

**Verification:**
- [ ] `pnpm --filter @syncfusion/cs-sdlc test -- tests/conformance/`

**Dependencies:** All previous tasks

**Files:**
- `tests/conformance/level1.test.ts`
- `tests/conformance/level2.test.ts`
- `tests/conformance/level3.test.ts`
- `tests/conformance/forward-compat.test.ts`

**Scope:** L (4 files, comprehensive)

---

### Task 30: Barrel export + public API
**Description:** Wire up `src/index.ts` as the public API barrel export. Export all public functions, types, schemas, constants, and errors. Verify the API surface matches the SPEC.md plan.

**Acceptance criteria:**
- [ ] All public functions from SPEC.md "Public API Surface" are exported
- [ ] All types are exported
- [ ] All Zod schemas are exported (for consumers who want custom validation)
- [ ] Constants (`DEBOUNCE_MS`, `MAX_MANIFEST_SIZE`, etc.) are exported
- [ ] Error classes are exported
- [ ] No internal modules leak through the barrel
- [ ] `pnpm --filter @syncfusion/cs-sdlc build` produces clean dist/

**Verification:**
- [ ] Build succeeds
- [ ] Typecheck passes
- [ ] Import test: `import { initSdlc, manifestSchema, type Manifest } from '@syncfusion/cs-sdlc'`

**Dependencies:** All previous tasks

**Files:**
- `src/index.ts`

**Scope:** S (1 file)

---

### ✅ Checkpoint: Phase 5 Complete — SDK v0.1.0 Ready
- [ ] `pnpm --filter @syncfusion/cs-sdlc test` — all green
- [ ] `pnpm --filter @syncfusion/cs-sdlc test:coverage` — 90%+ lines
- [ ] `pnpm --filter @syncfusion/cs-sdlc typecheck` — clean
- [ ] `pnpm --filter @syncfusion/cs-sdlc build` — clean
- [ ] `pnpm --filter @syncfusion/cs-sdlc schemas` — all generated
- [ ] All 3 conformance levels pass
- [ ] Public API matches SPEC.md

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Zod `.passthrough()` may not preserve field order | Medium | Test round-trip with ordered JSON; use `JSON.stringify` replacer if needed |
| YAML front matter edge cases (nested `---` in body) | Low | Follow §5.2.3 algorithm strictly; test with adversarial inputs |
| SemVer comparison complexity (pre-release tags) | Low | Use a minimal SemVer comparator in `utils/semver.ts`; test with spec examples |
| Scanner heuristics produce false positives | Medium | Return confidence levels; let consumers filter by confidence |
| `totalCompleted` counter drift after manual file edits | Low | Document that `totalCompleted` is cumulative and cannot be auto-recovered; `validateConsistency` warns but doesn't fix |
| Large monorepo scanning is slow | Low | Scan only top-level workspace directories, not deep recursion |

## Estimated Scope

| Phase | Tasks | Est. Files | Complexity |
|-------|-------|-----------|------------|
| Phase 1: Schemas | 6 | ~14 | Medium |
| Phase 2: Core I/O | 7 | ~15 | Medium |
| Phase 3: Operations | 11 | ~24 | High |
| Phase 4: Scanner | 3 | ~8 | Medium |
| Phase 5: Polish | 3 | ~8 | Medium |
| **Total** | **30** | **~69** | — |
