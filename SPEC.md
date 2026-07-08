# Spec: `@syncfusion/cs-sdlc` — TypeScript SDK

## Objective

Build the **reference TypeScript SDK** for the `.sdlc/` file format specification (v1.0-draft). The SDK is a **library-only** package (no CLI) that any consumer — editor extensions, CLI tools, AI agent skills, CI/CD integrations — can import to read, write, validate, and operate on `.sdlc/` directories.

### Target Users

| Consumer | How They Use the SDK |
|----------|---------------------|
| **Code Studio extension** | Import SDK to render sidebar, manage work items, show quality metrics |
| **CLI tool** (future) | Import SDK to implement `cs-sdlc init`, `cs-sdlc start`, `cs-sdlc done`, etc. |
| **AI agent skills** | Import SDK to read project context, create work items, log decisions |
| **CI/CD integrations** | Import SDK to generate snapshots, validate quality gates |
| **Third-party editors** | Import SDK to add `.sdlc/` support to any editor |

### Success Criteria

- [ ] Full Level 3 (Full) conformance per Chapter 9 of the spec
- [ ] Every JSON schema in the spec has a corresponding Zod schema + inferred TypeScript type
- [ ] Every operation in Chapter 7 is implemented as a tested function
- [ ] Brownfield scanner detects Node.js, .NET, Python, Go, Rust, Java projects
- [ ] JSON Schema files are auto-generated from Zod schemas
- [ ] 90%+ test coverage
- [ ] Zero runtime dependencies beyond `zod` and `yaml`
- [ ] All spec invariants (§7.7) are enforced by the SDK

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | 5.5+ | Language |
| Node.js | 18+ | Runtime target |
| pnpm | 9.x | Package manager + workspace orchestration |
| Zod | 3.x | Runtime validation + type inference |
| zod-to-json-schema | 3.x | JSON Schema generation from Zod |
| yaml | 2.x | YAML front matter parsing |
| Vitest | 2.x | Testing framework |
| tsup | 8.x | Library bundling (ESM) |

## Monorepo Structure

This repo (`cs-sdlc-workflow`) is a **pnpm workspace monorepo** containing:

| Package | Path | Description |
|---------|------|-------------|
| `@syncfusion/cs-sdlc` | `packages/sdk/` | Core SDK — schemas, operations, scanner |
| `@syncfusion/cs-sdlc-extension` | `packages/extension/` | Code Studio extension (future) |
| `@syncfusion/tsconfig` | `packages/tsconfig/` | Shared TypeScript configs |

```
cs-sdlc-workflow/
├── pnpm-workspace.yaml           # Workspace definition
├── package.json                   # Root — scripts, devDeps
├── .npmrc                         # pnpm settings
├── spec/                          # .sdlc/ format specification (read-only reference)
│   └── sdlc/
├── packages/
│   ├── tsconfig/                  # Shared TS configs
│   │   ├── package.json
│   │   ├── base.json              # Strict base config
│   │   └── library.json           # ESM library preset
│   ├── sdk/                       # @syncfusion/cs-sdlc (this spec)
│   │   └── ...
│   └── extension/                 # @syncfusion/cs-sdlc-extension (future)
│       └── ...
└── SPEC.md                        # This file
```

The extension package will import `@syncfusion/cs-sdlc` as a workspace dependency.

## Commands

```bash
# ── Root (run from repo root) ──────────────────────────
pnpm install                     # Install all workspace deps
pnpm -r build                    # Build all packages
pnpm -r test                     # Test all packages
pnpm -r typecheck                # Type-check all packages

# ── SDK package (run from packages/sdk/ or via filter) ─
pnpm --filter @syncfusion/cs-sdlc build        # tsup → dist/
pnpm --filter @syncfusion/cs-sdlc test         # vitest run
pnpm --filter @syncfusion/cs-sdlc test:watch   # vitest (watch)
pnpm --filter @syncfusion/cs-sdlc test:coverage # vitest --coverage
pnpm --filter @syncfusion/cs-sdlc typecheck    # tsc --noEmit
pnpm --filter @syncfusion/cs-sdlc lint         # eslint src/
pnpm --filter @syncfusion/cs-sdlc schemas      # generate JSON Schemas
```

## Project Structure

```
packages/sdk/
├── package.json                  # @syncfusion/cs-sdlc
├── tsconfig.json                 # strict, ES2022, ESM
├── tsup.config.ts                # Library build config
├── vitest.config.ts              # Test config
│
├── src/
│   ├── index.ts                  # Public API barrel export
│   │
│   ├── schemas/                  # Zod schemas (single source of truth)
│   │   ├── manifest.ts           # Manifest schema (Ch. 3)
│   │   ├── indexes.ts            # Work, decisions, releases indexes (Ch. 4)
│   │   ├── objects.ts            # Front matter schemas for all object types (Ch. 5)
│   │   ├── snapshots.ts          # Latest + history snapshot schemas (Ch. 6)
│   │   └── shared.ts             # Shared types: identifiers, dates, enums
│   │
│   ├── types/                    # Inferred TypeScript types from Zod
│   │   └── index.ts              # Re-exports z.infer<> types from schemas
│   │
│   ├── core/                     # Low-level read/write primitives
│   │   ├── discovery.ts          # Find .sdlc/ directory (walk-up algorithm, §2.1.2)
│   │   ├── reader.ts             # Read + parse JSON files, Markdown + YAML front matter
│   │   ├── writer.ts             # Atomic write (temp + rename, §2.6.1)
│   │   ├── frontmatter.ts        # YAML front matter parse/serialize (§5.2)
│   │   ├── identifiers.ts        # Validate identifiers (§2.4.4)
│   │   └── errors.ts             # SDK error types (SdlcError, ValidationError, etc.)
│   │
│   ├── operations/               # High-level operations (Ch. 7)
│   │   ├── init.ts               # Greenfield init (§7.2.1)
│   │   ├── init-scan.ts          # Brownfield init with scanner (§7.2.2)
│   │   ├── work-start.ts         # Start work item (§7.3.1)
│   │   ├── work-complete.ts      # Complete work item (§7.3.2)
│   │   ├── work-abandon.ts       # Abandon work item (§7.3.3)
│   │   ├── decision-create.ts    # Create decision record (§7.5)
│   │   ├── decision-supersede.ts # Supersede a decision (§7.5.2)
│   │   ├── release-create.ts     # Create release record (§7.6)
│   │   ├── snapshot-generate.ts  # Generate snapshot (§6.4)
│   │   └── sync.ts               # Index rebuild, counter recalc, consistency check (§7.7)
│   │
│   ├── scanner/                  # Brownfield project scanner (§7.2.2, §8.3)
│   │   ├── detect-stack.ts       # Detect language/framework from config files
│   │   ├── detect-modules.ts     # Detect monorepo modules (§8.3.1)
│   │   └── heuristics.ts         # Detection rules and confidence levels (§8.3.2)
│   │
│   └── utils/                    # Internal utilities
│       ├── slugify.ts            # Title → kebab-case slug
│       ├── semver.ts             # SemVer comparison for release ordering
│       └── dates.ts              # ISO 8601 helpers
│
├── schemas/                      # Generated JSON Schema output
│   ├── manifest.schema.json
│   ├── work-index.schema.json
│   ├── decisions-index.schema.json
│   ├── releases-index.schema.json
│   ├── latest-snapshot.schema.json
│   └── history-snapshot.schema.json
│
├── scripts/
│   ├── generate-schemas.ts       # Zod → JSON Schema generator
│   └── validate-sample.ts        # Self-test: create + validate a sample .sdlc/
│
└── tests/
    ├── schemas/                  # Schema validation tests
    │   ├── manifest.test.ts
    │   ├── indexes.test.ts
    │   ├── objects.test.ts
    │   └── snapshots.test.ts
    │
    ├── core/                     # Core primitive tests
    │   ├── discovery.test.ts
    │   ├── reader.test.ts
    │   ├── writer.test.ts
    │   ├── frontmatter.test.ts
    │   └── identifiers.test.ts
    │
    ├── operations/               # Operation integration tests
    │   ├── init.test.ts
    │   ├── init-scan.test.ts
    │   ├── work-start.test.ts
    │   ├── work-complete.test.ts
    │   ├── work-abandon.test.ts
    │   ├── decision-create.test.ts
    │   ├── release-create.test.ts
    │   ├── snapshot-generate.test.ts
    │   └── sync.test.ts
    │
    ├── scanner/                  # Scanner tests
    │   ├── detect-stack.test.ts
    │   └── detect-modules.test.ts
    │
    ├── conformance/              # Spec conformance tests
    │   ├── level1.test.ts        # Minimal conformance
    │   ├── level2.test.ts        # Standard conformance
    │   └── level3.test.ts        # Full conformance
    │
    └── fixtures/                 # Test fixtures
        ├── valid/                # Valid .sdlc/ directories
        │   ├── minimal/          # Level 1 only
        │   ├── standard/         # Level 2
        │   └── full/             # Level 3
        ├── invalid/              # Invalid files for error testing
        └── projects/             # Fake project trees for scanner tests
            ├── react-app/
            ├── dotnet-api/
            ├── python-fastapi/
            ├── monorepo-turborepo/
            └── go-service/
```

## Code Style

### Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Files | kebab-case | `work-start.ts`, `detect-stack.ts` |
| Types/Interfaces | PascalCase | `Manifest`, `WorkIndexEntry`, `DecisionStatus` |
| Zod schemas | camelCase + `Schema` suffix | `manifestSchema`, `workIndexEntrySchema` |
| Functions | camelCase, verb-first | `initSdlc()`, `startWork()`, `rebuildIndexes()` |
| Constants | UPPER_SNAKE_CASE | `MAX_MANIFEST_SIZE`, `MAGIC_STRING` |
| Test files | `{source}.test.ts` | `manifest.test.ts` |

### Example: Schema + Type + Operation Pattern

```typescript
// src/schemas/manifest.ts — Single source of truth
import { z } from 'zod';
import { identifierSchema, iso8601Schema } from './shared.js';

export const stackSchema = z.object({
  language: z.string().min(1),
  framework: z.string().optional(),
  runtime: z.string().optional(),
  database: z.string().optional(),
  testing: z.string().optional(),
  styling: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  createdAt: iso8601Schema,
  mode: z.enum(['greenfield', 'brownfield']).optional().default('greenfield'),
  stack: stackSchema.optional(),
});

export const countersSchema = z.object({
  activeWork: z.number().int().min(0),
  totalCompleted: z.number().int().min(0),
  decisions: z.number().int().min(0),
  releases: z.number().int().min(0).optional().default(0),
});

export const manifestSchema = z.object({
  $schema: z.string().optional(),
  specVersion: z.string(),
  magic: z.literal('cs-sdlc'),
  project: projectSchema,
  modules: z.record(identifierSchema, moduleEntrySchema).optional(),
  counters: countersSchema,
  phase: z.enum(['understand', 'structure', 'build', 'verify', 'ship']).optional(),
  health: healthSchema.optional(),
  gates: gatesSchema.optional(),
});

// src/types/index.ts — Inferred types
export type Manifest = z.infer<typeof manifestSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Stack = z.infer<typeof stackSchema>;
export type Counters = z.infer<typeof countersSchema>;
```

```typescript
// src/operations/init.ts — Operation using schemas
import { type Manifest, manifestSchema } from '../schemas/manifest.js';
import { writeJsonAtomic } from '../core/writer.js';
import { SDLC_DIR, MANIFEST_FILE } from '../core/constants.js';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

export interface InitOptions {
  projectRoot: string;
  name: string;
  description?: string;
  stack?: Stack;
}

export async function initSdlc(options: InitOptions): Promise<Manifest> {
  const sdlcDir = join(options.projectRoot, SDLC_DIR);
  const manifest: Manifest = {
    specVersion: '1.0',
    magic: 'cs-sdlc',
    project: {
      name: options.name,
      createdAt: new Date().toISOString(),
      mode: 'greenfield',
      description: options.description,
      stack: options.stack,
    },
    counters: {
      activeWork: 0,
      totalCompleted: 0,
      decisions: 0,
      releases: 0,
    },
  };

  // Validate before writing
  const validated = manifestSchema.parse(manifest);

  await mkdir(sdlcDir, { recursive: true });
  await mkdir(join(sdlcDir, 'context'), { recursive: true });
  await writeJsonAtomic(join(sdlcDir, MANIFEST_FILE), validated);

  // Create template context docs
  await createArchitectureTemplate(sdlcDir, options.name);
  await createConventionsTemplate(sdlcDir);

  return validated;
}
```

```typescript
// tests/operations/init.test.ts — Test pattern
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initSdlc } from '../../src/operations/init.js';
import { readManifest } from '../../src/core/reader.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('initSdlc', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'sdlc-test-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('creates a valid minimal .sdlc/ directory', async () => {
    const manifest = await initSdlc({
      projectRoot,
      name: 'Test Project',
    });

    expect(manifest.magic).toBe('cs-sdlc');
    expect(manifest.project.name).toBe('Test Project');
    expect(manifest.counters.activeWork).toBe(0);

    // Verify files on disk
    const read = await readManifest(projectRoot);
    expect(read).toEqual(manifest);
  });

  it('rejects empty project name', async () => {
    await expect(
      initSdlc({ projectRoot, name: '' })
    ).rejects.toThrow();
  });
});
```

### Error Handling Pattern

```typescript
// All SDK errors extend SdlcError for easy catch filtering
export class SdlcError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'SdlcError';
  }
}

export class NotFoundError extends SdlcError {
  constructor(path: string) {
    super(`No .sdlc/ directory found at or above: ${path}`, 'SDLC_NOT_FOUND');
  }
}

export class ValidationError extends SdlcError {
  constructor(file: string, issues: z.ZodIssue[]) {
    super(`Validation failed for ${file}: ${issues.map(i => i.message).join(', ')}`, 'VALIDATION_ERROR');
  }
}

export class ConsistencyError extends SdlcError {
  constructor(message: string) {
    super(message, 'CONSISTENCY_ERROR');
  }
}
```

## Testing Strategy

### Framework & Location

- **Framework:** Vitest 2.x
- **Test files:** Co-located in `tests/` directory mirroring `src/` structure
- **Naming:** `{module}.test.ts`
- **Coverage target:** 90%+ lines, 85%+ branches

### Test Levels

| Level | What | Where | Count (est.) |
|-------|------|-------|-------------|
| **Unit** | Zod schemas, identifiers, slugify, frontmatter parse/serialize, date helpers | `tests/schemas/`, `tests/core/` | ~60 |
| **Integration** | Operations (init, start, complete, etc.) against real temp filesystem | `tests/operations/` | ~40 |
| **Scanner** | Brownfield detection against fixture project trees | `tests/scanner/` | ~15 |
| **Conformance** | End-to-end: create Level 1/2/3 directories, validate all invariants | `tests/conformance/` | ~15 |

### Test Patterns

- **Filesystem tests** use `mkdtemp` + `rm` for isolated temp directories (no mocking fs)
- **Schema tests** use valid/invalid fixture data (no filesystem needed)
- **Scanner tests** use pre-built fixture project trees in `tests/fixtures/projects/`
- **Conformance tests** exercise the full SDK API to create, modify, and validate `.sdlc/` directories

### What to Test

| Spec Requirement | Test |
|-----------------|------|
| Manifest ≤ 2 KB (§2.2.2) | Write a manifest, assert `Buffer.byteLength(JSON.stringify(m)) <= 2048` |
| Identifier rules (§2.4.4) | Valid/invalid identifiers: `add-dark-mode` ✅, `Add_Dark_Mode` ❌, `--fix` ❌ |
| YAML front matter parsing (§5.2.3) | Parse files with/without front matter, edge cases (empty YAML, no closing `---`) |
| Counter sync (§7.7.1) | After `startWork`, assert `manifest.counters.activeWork` incremented |
| Index consistency (§7.7.2) | After `completeWork`, assert entry moved from `active` to `recent` |
| Recent cap at 10 (§4.2.4) | Complete 12 items, assert `recent.length === 10` |
| Atomic writes (§2.6.1) | Verify temp file is created then renamed (mock `rename` to check) |
| Discovery walk-up (§2.1.2) | Create `.sdlc/` at root, discover from nested subdirectory |
| Brownfield detection (§7.2.2) | Fixture with `package.json` → detect TypeScript + React |
| Forward compat (§9.6.1) | Parse manifest with unknown fields, assert they're preserved on write |

## Boundaries

### Always Do

- Validate all data with Zod before writing to disk
- Use atomic writes (temp + rename) for all JSON files
- Preserve unknown fields in JSON and YAML (forward compatibility, §9.6.1)
- Enforce spec invariants (counter sync, index consistency) after every write operation
- Use `node:` prefix for all Node.js built-in imports
- Keep runtime dependencies to `zod` + `yaml` only
- Write tests before or alongside implementation (TDD)
- Follow the spec's RFC 2119 keywords literally (MUST = enforced, SHOULD = warned, MAY = optional)

### Ask First

- Adding any new runtime dependency beyond `zod` and `yaml`
- Changing the public API surface (exported functions/types)
- Deviating from the spec's defined schemas or operations
- Adding Node.js version requirements beyond 18+
- Changing the project structure layout

### Never Do

- Ship CJS — ESM only
- Mock the filesystem in integration/operation tests — use real temp dirs
- Silently drop unknown fields from JSON or YAML (violates §9.6.1)
- Manually edit counter values — always derive from filesystem/indexes
- Add browser/Deno/Bun compatibility shims (Node-only per decision)
- Import from `dist/` within `src/` — always use source imports

## Resolved Design Decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | **File locking (§2.6.3)** | Defer to v2 | Atomic writes (temp + rename) prevent corruption. True concurrent conflicts are rare in practice. |
| 2 | **Snapshot metrics (§6.4)** | Accept pre-computed metrics | Consumer runs analysis tools (test runner, security scanner, etc.) and passes numbers to `generateSnapshot()`. SDK just structures and writes the data. |
| 3 | **Event system** | No events — stateless library | Functions in, results out. Consumers use file watchers (§2.6.2) to detect changes. Keeps the SDK simple and dependency-free. |
| 4 | **File watcher (§2.6.2)** | Leave to consumers | Every environment has built-in file watching (Code Studio: `FileSystemWatcher`, Node: `fs.watch`/`chokidar`). SDK should not duplicate this. |

## Public API Surface (Planned)

```typescript
// === Initialization ===
initSdlc(options: InitOptions): Promise<Manifest>
initSdlcFromScan(projectRoot: string): Promise<Manifest>

// === Discovery ===
discoverSdlc(startPath: string): Promise<string>  // returns .sdlc/ path

// === Reading ===
readManifest(projectRoot: string): Promise<Manifest>
readWorkIndex(projectRoot: string): Promise<WorkIndex>
readDecisionsIndex(projectRoot: string): Promise<DecisionsIndex>
readReleasesIndex(projectRoot: string): Promise<ReleasesIndex>
readContextDoc(projectRoot: string, name: string): Promise<ContextDocument>
readWorkItem(projectRoot: string, id: string): Promise<WorkItem>
readDecision(projectRoot: string, id: string): Promise<DecisionRecord>
readLatestSnapshot(projectRoot: string): Promise<LatestSnapshot>

// === Work Management ===
startWork(projectRoot: string, options: StartWorkOptions): Promise<WorkItem>
completeWork(projectRoot: string, id: string): Promise<void>
abandonWork(projectRoot: string, id: string): Promise<void>

// === Decisions ===
createDecision(projectRoot: string, options: CreateDecisionOptions): Promise<DecisionRecord>
supersedeDecision(projectRoot: string, oldId: string, options: CreateDecisionOptions): Promise<DecisionRecord>

// === Releases ===
createRelease(projectRoot: string, options: CreateReleaseOptions): Promise<ReleaseRecord>

// === Snapshots ===
generateSnapshot(projectRoot: string, metrics: SnapshotMetrics): Promise<LatestSnapshot>

// === Maintenance ===
rebuildIndexes(projectRoot: string): Promise<void>
recalculateCounters(projectRoot: string): Promise<void>
validateConsistency(projectRoot: string): Promise<ConsistencyReport>

// === Validation ===
validateManifest(data: unknown): Manifest          // throws on invalid
validateWorkIndex(data: unknown): WorkIndex
// ... etc for all schemas

// === JSON Schema ===
getJsonSchema(schemaName: string): object           // returns JSON Schema object
```
