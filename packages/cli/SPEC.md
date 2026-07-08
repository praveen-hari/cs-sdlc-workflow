# Spec: `@syncfusion/cs-sdlc-cli` — CLI Tool

## Objective

Build a **command-line interface** for the `.sdlc/` file format that wraps the `@syncfusion/cs-sdlc` SDK. The CLI is the primary developer-facing tool for initializing, managing, and inspecting `.sdlc/` directories from the terminal.

### Target Users

| User | How They Use the CLI |
|------|---------------------|
| **Developers** | `cs-sdlc init`, `cs-sdlc start "Add Auth"`, `cs-sdlc done add-auth` |
| **CI/CD pipelines** | `cs-sdlc validate --json`, `cs-sdlc snapshot --json` |
| **AI agent skills** | Shell out to `cs-sdlc status --json` for structured project context |

### Success Criteria

- [ ] All 13 commands implemented and tested
- [ ] Human-readable colored output by default
- [ ] `--json` flag on all commands for machine-readable output
- [ ] Auto-discovers `.sdlc/` from current directory (walk-up)
- [ ] Meaningful exit codes (0 = success, 1 = error, 2 = validation failure)
- [ ] `--help` on every command with usage examples
- [ ] Zero runtime dependencies beyond `citty`, `picocolors`, and `@syncfusion/cs-sdlc`

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | 5.5+ | Language |
| Node.js | 18+ | Runtime |
| citty | latest | CLI framework (subcommands, args, help) |
| picocolors | latest | Terminal colors |
| @syncfusion/cs-sdlc | workspace:* | SDK (all business logic) |
| tsup | 8.x | Bundling |
| Vitest | 2.x | Testing |

## Commands

### Full Command Reference

```
cs-sdlc <command> [options]

Initialization:
  cs-sdlc init                    Create a new .sdlc/ directory (greenfield)
  cs-sdlc init --scan             Scan existing project and create .sdlc/ (brownfield)

Work Management:
  cs-sdlc start <description>     Start tracking a new work item
  cs-sdlc done <id>               Complete a work item
  cs-sdlc abandon <id>            Abandon a work item

Decisions:
  cs-sdlc decide <title>          Record an architectural decision

Releases:
  cs-sdlc release <version>       Create a release record

Status & Inspection:
  cs-sdlc status                  Show project summary (manifest overview)
  cs-sdlc list work               List active work items
  cs-sdlc list decisions          List decision records
  cs-sdlc list releases           List releases
  cs-sdlc show <id>               Show details of a work item or decision

Quality:
  cs-sdlc snapshot                Generate a quality snapshot (placeholder metrics)

Maintenance:
  cs-sdlc validate                Check consistency of .sdlc/ directory
  cs-sdlc sync                    Rebuild indexes from filesystem
  cs-sdlc phase <phase>           Update the development phase

Global Options:
  --json                          Output as JSON (for scripting/CI)
  --help, -h                      Show help
  --version, -v                   Show version
```

### Command Details

#### `cs-sdlc init [--scan] [--name <name>] [--description <desc>]`
- Without `--scan`: greenfield init → `initSdlc()`
- With `--scan`: brownfield init → `initSdlcFromScan()`
- Auto-detects project name from `package.json` if `--name` not given

#### `cs-sdlc start <description> [--type <type>] [--priority <priority>] [--modules <m1,m2>]`
- Creates work item → `startWork()`
- Default type: `feature`
- Modules: comma-separated list

#### `cs-sdlc done <id>`
- Completes and archives → `completeWork()`

#### `cs-sdlc abandon <id>`
- Abandons and archives → `abandonWork()`

#### `cs-sdlc decide <title> [--context <text>] [--decision <text>] [--rationale <text>] [--supersedes <id>]`
- Without `--supersedes`: `createDecision()`
- With `--supersedes`: `supersedeDecision()`

#### `cs-sdlc release <version> [--title <title>]`
- Creates release → `createRelease()`

#### `cs-sdlc status [--json]`
- Reads manifest → `readManifest()`
- Shows: project name, phase, counters, health, modules

#### `cs-sdlc list <type> [--json]`
- `work` → `readWorkIndex()` — shows active + recent
- `decisions` → `readDecisionsIndex()`
- `releases` → `readReleasesIndex()`

#### `cs-sdlc show <id> [--json]`
- Auto-detects type: work item (kebab-case) or decision (3-digit)
- Work item → `readWorkItem()`
- Decision → `readDecision()`

#### `cs-sdlc validate [--json]`
- Runs `validateConsistency()`
- Exit code 0 if valid, 2 if issues found

#### `cs-sdlc sync`
- Runs `rebuildIndexes()` + `recalculateCounters()`

#### `cs-sdlc phase <phase>`
- Updates phase → `updatePhase()`

#### `cs-sdlc snapshot [--grade <grade>] [--coverage <n>] [--tests-total <n>] [--tests-passing <n>] [--tests-failing <n>] [--vulnerabilities <n>]`
- Generates snapshot → `generateSnapshot()`
- All metrics passed via flags

### Build & Dev Commands

```bash
# Build
pnpm --filter @syncfusion/cs-sdlc-cli build

# Test
pnpm --filter @syncfusion/cs-sdlc-cli test

# Type check
pnpm --filter @syncfusion/cs-sdlc-cli typecheck

# Run locally (dev)
pnpm --filter @syncfusion/cs-sdlc-cli dev -- init --help
```

## Project Structure

```
packages/cli/
├── package.json                  # @syncfusion/cs-sdlc-cli, bin: cs-sdlc
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
│
├── src/
│   ├── index.ts                  # Entry point: parse args, dispatch to commands
│   ├── main.ts                   # citty main command definition
│   │
│   ├── commands/                 # One file per command
│   │   ├── init.ts
│   │   ├── start.ts
│   │   ├── done.ts
│   │   ├── abandon.ts
│   │   ├── decide.ts
│   │   ├── release.ts
│   │   ├── status.ts
│   │   ├── list.ts
│   │   ├── show.ts
│   │   ├── validate.ts
│   │   ├── sync.ts
│   │   ├── phase.ts
│   │   └── snapshot.ts
│   │
│   ├── output/                   # Output formatting
│   │   ├── human.ts              # Colored human-readable output
│   │   ├── json.ts               # JSON output
│   │   └── table.ts              # Simple table formatter
│   │
│   └── utils/
│       ├── resolve-root.ts       # Auto-discover project root via SDK
│       └── error-handler.ts      # Catch SdlcError → friendly message + exit code
│
└── tests/
    ├── commands/                 # Command integration tests
    │   ├── init.test.ts
    │   ├── start.test.ts
    │   ├── done.test.ts
    │   ├── status.test.ts
    │   ├── list.test.ts
    │   ├── validate.test.ts
    │   └── ...
    └── output/
        ├── human.test.ts
        └── json.test.ts
```

## Code Style

### Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Files | kebab-case | `resolve-root.ts`, `error-handler.ts` |
| Commands | kebab-case (matches CLI) | `init.ts`, `start.ts`, `list.ts` |
| Functions | camelCase, verb-first | `runInit()`, `formatStatus()`, `resolveProjectRoot()` |
| Constants | UPPER_SNAKE_CASE | `EXIT_SUCCESS`, `EXIT_ERROR` |

### Command Pattern

Every command file follows the same structure:

```typescript
// src/commands/start.ts
import { defineCommand } from 'citty';
import { startWork } from '@syncfusion/cs-sdlc';
import { resolveProjectRoot } from '../utils/resolve-root.js';
import { formatWorkItem } from '../output/human.js';

export default defineCommand({
  meta: {
    name: 'start',
    description: 'Start tracking a new work item',
  },
  args: {
    description: {
      type: 'positional',
      description: 'What the work is about',
      required: true,
    },
    type: {
      type: 'string',
      description: 'Work type (feature, bug, refactor, etc.)',
      default: 'feature',
    },
    priority: {
      type: 'string',
      description: 'Priority (critical, high, medium, low)',
    },
    modules: {
      type: 'string',
      description: 'Comma-separated module IDs',
    },
    json: {
      type: 'boolean',
      description: 'Output as JSON',
      default: false,
    },
  },
  async run({ args }) {
    const projectRoot = await resolveProjectRoot();
    const result = await startWork(projectRoot, {
      description: args.description,
      type: args.type,
      priority: args.priority,
      modules: args.modules?.split(',').map(m => m.trim()),
    });

    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      formatWorkItem(result);
    }
  },
});
```

### Output Pattern

```typescript
// Human output (default)
$ cs-sdlc start "Add Dark Mode" --type feature --priority medium
✓ Created work item: add-dark-mode
  Type:     feature
  Priority: medium
  Path:     .sdlc/work/active/add-dark-mode/

// JSON output (--json)
$ cs-sdlc start "Add Dark Mode" --json
{
  "id": "add-dark-mode",
  "manifest": { ... },
  "workIndex": { ... }
}
```

### Error Output Pattern

```typescript
// Human
$ cs-sdlc done non-existent
✗ Work item not found: non-existent

// JSON
$ cs-sdlc done non-existent --json
{
  "error": "Work item not found: non-existent",
  "code": "ITEM_NOT_FOUND"
}
```

## Testing Strategy

### Framework & Location

- **Framework:** Vitest 2.x
- **Test files:** `tests/commands/*.test.ts`, `tests/output/*.test.ts`
- **Pattern:** Each test creates a temp directory, runs the command function, asserts output

### Test Approach

Commands are tested by calling the command's `run()` function directly (not spawning a child process). This is faster and more reliable.

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initSdlc, readManifest } from '@syncfusion/cs-sdlc';
import startCommand from '../../src/commands/start.js';

describe('start command', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'cli-test-'));
    await initSdlc({ projectRoot, name: 'Test' });
    // Mock cwd to point to temp dir
    vi.spyOn(process, 'cwd').mockReturnValue(projectRoot);
  });

  it('creates a work item', async () => {
    const output = captureOutput(() =>
      startCommand.run({ args: { description: 'Add Auth', type: 'feature', json: false } })
    );
    expect(output).toContain('add-auth');
  });
});
```

### What to Test

| Command | Key Tests |
|---------|-----------|
| `init` | Creates .sdlc/, rejects if exists, --scan detects stack |
| `start` | Creates work item, handles ID conflicts, validates type |
| `done` | Archives item, updates counters, rejects non-existent |
| `status` | Shows manifest summary, --json outputs valid JSON |
| `list` | Lists work/decisions/releases, empty state, --json |
| `validate` | Returns exit 0 for valid, exit 2 for invalid |
| `show` | Auto-detects work vs decision, not-found error |

## Boundaries

### Always Do

- Use the SDK for all business logic — CLI is a thin wrapper
- Auto-discover `.sdlc/` from cwd using `discoverSdlc()`
- Show `--help` with usage examples on every command
- Use exit code 0 for success, 1 for errors, 2 for validation failures
- Colored output by default, respect `NO_COLOR` env var

### Ask First

- Adding interactive prompts (breaks scriptability)
- Adding new runtime dependencies beyond citty + picocolors
- Changing command names or argument structure

### Never Do

- Put business logic in the CLI — always delegate to the SDK
- Use `console.error` for normal output (only for errors)
- Hardcode paths — always use SDK constants
- Swallow errors silently — always show the error message and exit with non-zero

## Resolved Design Decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Interactive prompts | No — all input via flags/args | Keeps CLI scriptable for CI/CD |
| 2 | Global `--project` flag | No — auto-discover from cwd | Simpler UX, matches git behavior |
| 3 | `list` as subcommand vs separate commands | `cs-sdlc list work` (subcommand) | Cleaner namespace, fewer top-level commands |
| 4 | `show` auto-detection | Detect by ID format (3-digit = decision, kebab = work) | Avoids `show --type work` boilerplate |
