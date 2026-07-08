# @syncfusion/cs-sdlc

[![Tests](https://img.shields.io/badge/tests-414%20passing-brightgreen)]() [![Conformance](https://img.shields.io/badge/conformance-Level%203%20(Full)-blue)]() [![Node](https://img.shields.io/badge/node-%3E%3D18-green)]() [![ESM](https://img.shields.io/badge/module-ESM-yellow)]()

TypeScript SDK for the `.sdlc/` file format specification — an open, tool-agnostic format for storing structured project context inside software repositories.

## What is `.sdlc/`?

The `.sdlc/` directory is a **single, shared format** that any AI coding agent, editor extension, CLI tool, or CI/CD pipeline can read and write. It stores:

- **Project identity** — name, stack, modules (manifest.json)
- **Architecture & conventions** — living documents for AI context (context/*.md)
- **Work items** — tracked features, bugs, refactors with plans (work/)
- **Decisions** — immutable Architecture Decision Records (decisions/)
- **Releases** — versioned release notes (releases/)
- **Quality snapshots** — test coverage, security, accessibility metrics (snapshots/)

## Install

```bash
npm install @syncfusion/cs-sdlc
# or
pnpm add @syncfusion/cs-sdlc
```

> **Runtime dependencies:** Only `zod` and `yaml`. No other dependencies.

## Quick Start

```typescript
import {
  initSdlc,
  startWork,
  completeWork,
  createDecision,
  readManifest,
  validateConsistency,
} from '@syncfusion/cs-sdlc';

// Initialize a new .sdlc/ directory
const manifest = await initSdlc({
  projectRoot: '/path/to/project',
  name: 'My App',
  stack: { language: 'typescript', framework: 'react' },
});

// Start tracking a feature
const { id } = await startWork('/path/to/project', {
  description: 'Add Dark Mode',
  type: 'feature',
  priority: 'medium',
  modules: ['web-app'],
});

// Complete it when done
await completeWork('/path/to/project', id);

// Log an architectural decision
await createDecision('/path/to/project', {
  title: 'Use PostgreSQL for persistence',
  context: 'We need a relational database for complex queries.',
  decision: 'Use PostgreSQL 16.',
  rationale: 'Best open-source RDBMS, team has experience.',
});

// Read project state
const m = await readManifest('/path/to/project');
console.log(m.project.name);       // "My App"
console.log(m.counters.activeWork); // 0
console.log(m.counters.decisions);  // 1

// Validate consistency
const report = await validateConsistency('/path/to/project');
console.log(report.valid); // true
```

## Brownfield Scanning

For existing projects, the SDK can auto-detect your stack and modules:

```typescript
import { initSdlcFromScan } from '@syncfusion/cs-sdlc';

const result = await initSdlcFromScan('/path/to/existing-project');

console.log(result.detectedStack);
// { language: 'typescript', framework: 'react', testing: 'vitest', styling: 'tailwind', confidence: 'high' }

console.log(result.detectedModules);
// 2 (for monorepos)

console.log(result.detectedArtifacts);
// { hasCI: true, hasTesting: true, hasDocs: false, hasDesignSystem: false }
```

**Supported ecosystems:** Node.js/TypeScript, .NET/C#, Python, Go, Rust, Java
**Monorepo detection:** npm/pnpm workspaces, Turborepo, Nx, Lerna

## API

### Initialization

| Function | Description |
|----------|-------------|
| `initSdlc(options)` | Create a new `.sdlc/` directory (greenfield) |
| `initSdlcFromScan(projectRoot)` | Create `.sdlc/` by scanning an existing project (brownfield) |

### Discovery

| Function | Description |
|----------|-------------|
| `discoverSdlc(startPath)` | Find `.sdlc/` by walking up from any path |

### Reading

| Function | Description |
|----------|-------------|
| `readManifest(projectRoot)` | Read and validate `manifest.json` |
| `readWorkIndex(projectRoot)` | Read work item index |
| `readDecisionsIndex(projectRoot)` | Read decisions index |
| `readReleasesIndex(projectRoot)` | Read releases index |
| `readContextDoc(projectRoot, name)` | Read a context document (e.g., `'architecture'`) |
| `readWorkItem(projectRoot, id)` | Read a work item (active or archived) |
| `readDecision(projectRoot, id)` | Read a decision record |
| `readRelease(projectRoot, version)` | Read a release record |
| `readLatestSnapshot(projectRoot)` | Read the latest quality snapshot |
| `readHistoricalSnapshot(projectRoot, month)` | Read a monthly history snapshot |

### Work Management

| Function | Description |
|----------|-------------|
| `startWork(projectRoot, options)` | Create a new active work item |
| `completeWork(projectRoot, id)` | Complete and archive a work item |
| `abandonWork(projectRoot, id)` | Abandon and archive a work item |

### Decisions

| Function | Description |
|----------|-------------|
| `createDecision(projectRoot, options)` | Create a new decision record (ADR) |
| `supersedeDecision(projectRoot, oldId, options)` | Supersede an existing decision |

### Releases

| Function | Description |
|----------|-------------|
| `createRelease(projectRoot, options)` | Create a release record |

### Snapshots

| Function | Description |
|----------|-------------|
| `generateSnapshot(projectRoot, metrics)` | Generate a quality snapshot from pre-computed metrics |

### Maintenance

| Function | Description |
|----------|-------------|
| `rebuildIndexes(projectRoot)` | Rebuild all indexes from filesystem |
| `recalculateCounters(projectRoot)` | Recalculate manifest counters from indexes |
| `validateConsistency(projectRoot)` | Check all spec invariants, return a report |

### Phase & Modules

| Function | Description |
|----------|-------------|
| `updatePhase(projectRoot, phase)` | Update the project development phase |
| `addModule(projectRoot, id, entry)` | Add a module to the manifest |
| `removeModule(projectRoot, id)` | Remove a module |
| `renameModule(projectRoot, oldId, newId)` | Rename a module (updates references) |

### Validation

All Zod schemas are exported for custom validation:

```typescript
import { manifestSchema, workIndexSchema } from '@syncfusion/cs-sdlc';

const result = manifestSchema.safeParse(data);
if (!result.success) {
  console.error(result.error.issues);
}
```

### Types

All TypeScript types are inferred from Zod schemas:

```typescript
import type { Manifest, WorkItem, DecisionRecord } from '@syncfusion/cs-sdlc';
```

### Constants

Spec constants are exported for consumers:

```typescript
import { DEBOUNCE_MS, MAX_MANIFEST_SIZE, SPEC_VERSION } from '@syncfusion/cs-sdlc';
```

### Errors

All errors extend `SdlcError` for easy catch filtering:

```typescript
import { SdlcError, NotFoundError, ValidationError } from '@syncfusion/cs-sdlc';

try {
  await readManifest('/no/sdlc/here');
} catch (err) {
  if (err instanceof NotFoundError) {
    // .sdlc/ not found
  }
  if (err instanceof SdlcError) {
    console.log(err.code); // e.g., "SDLC_NOT_FOUND"
  }
}
```

## Conformance

This SDK implements **Level 3 (Full)** conformance per the `.sdlc/` specification v1.0-draft:

- ✅ Layer 1: Manifest (project identity, counters, health, gates)
- ✅ Layer 2: Indexes (work, decisions, releases)
- ✅ Layer 3: Objects (context docs, work items, decisions, releases)
- ✅ Layer 4: Snapshots (latest + monthly history)
- ✅ All Chapter 7 operations (init, work CRUD, decisions, releases, snapshots, sync)
- ✅ Multi-module support (Chapter 8) — add, remove, rename modules
- ✅ Brownfield scanning (§7.2.2) — 6 language ecosystems + monorepo detection
- ✅ Forward compatibility (§9.6.1) — unknown fields preserved on read/write
- ✅ Graceful degradation (§9.6.3) — Level 3 reader handles Level 1 directories

## JSON Schemas

13 JSON Schema files are generated from the Zod schemas and included in the `schemas/` directory:

```
schemas/
├── manifest.schema.json
├── work-index.schema.json
├── decisions-index.schema.json
├── releases-index.schema.json
├── latest-snapshot.schema.json
├── history-snapshot.schema.json
├── architecture-frontmatter.schema.json
├── conventions-frontmatter.schema.json
├── requirements-frontmatter.schema.json
├── brief-frontmatter.schema.json
├── plan-frontmatter.schema.json
├── decision-frontmatter.schema.json
└── release-frontmatter.schema.json
```

Regenerate with: `pnpm --filter @syncfusion/cs-sdlc schemas`

## Project Structure

```
src/
├── index.ts                  # Public API barrel export
├── schemas/                  # Zod schemas (single source of truth)
│   ├── shared.ts             # Identifiers, dates, extensible enums
│   ├── manifest.ts           # Manifest schema (Ch. 3)
│   ├── indexes.ts            # Work, decisions, releases indexes (Ch. 4)
│   ├── objects.ts            # Front matter schemas (Ch. 5)
│   └── snapshots.ts          # Snapshot schemas (Ch. 6)
├── types/                    # Inferred TypeScript types
├── core/                     # Low-level I/O primitives
│   ├── constants.ts          # Paths, sizes, magic values
│   ├── errors.ts             # Error hierarchy
│   ├── discovery.ts          # .sdlc/ walk-up discovery
│   ├── reader.ts             # JSON + Markdown reader
│   ├── writer.ts             # Atomic JSON writer
│   ├── frontmatter.ts        # YAML front matter parser
│   └── identifiers.ts        # Identifier validation
├── operations/               # High-level CRUD operations (Ch. 7)
│   ├── init.ts               # Greenfield init
│   ├── init-scan.ts          # Brownfield init with scanner
│   ├── work-start.ts         # Start work item
│   ├── work-complete.ts      # Complete/abandon work item
│   ├── decision-create.ts    # Create/supersede decisions
│   ├── release-create.ts     # Create releases
│   ├── snapshot-generate.ts  # Generate quality snapshots
│   ├── sync.ts               # Index rebuild, counter recalc, consistency
│   ├── phase.ts              # Phase update + module lifecycle
│   └── read-helpers.ts       # All public read functions
├── scanner/                  # Brownfield project scanner
│   ├── detect-stack.ts       # Language/framework detection
│   ├── detect-modules.ts     # Monorepo module detection
│   └── heuristics.ts         # Detection rules + confidence
└── utils/                    # Internal utilities
    ├── slugify.ts            # Title → kebab-case
    ├── semver.ts             # SemVer comparison
    └── dates.ts              # ISO 8601 helpers
```

## Requirements

- Node.js 18+
- ESM only (`"type": "module"`)

## Development

```bash
pnpm install                                     # Install deps
pnpm --filter @syncfusion/cs-sdlc test           # Run tests (414)
pnpm --filter @syncfusion/cs-sdlc test:coverage  # Coverage report
pnpm --filter @syncfusion/cs-sdlc typecheck      # Type check
pnpm --filter @syncfusion/cs-sdlc build          # Build to dist/
pnpm --filter @syncfusion/cs-sdlc schemas        # Generate JSON Schemas
```

## License

MIT
