# @syncfusion/cs-sdlc

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
- ✅ All Chapter 7 operations
- ✅ Multi-module support (Chapter 8)
- ✅ Forward compatibility (unknown fields preserved)

## Requirements

- Node.js 18+
- ESM only (`"type": "module"`)

## License

MIT
