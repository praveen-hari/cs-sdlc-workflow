# SDLC Studio

A structured SDLC workflow system for AI-assisted software development — from agent configuration to deployment.

## What is this?

SDLC Studio gives developers clear visibility, control, and review over AI-assisted software development. It provides a structured workflow:

1. **Agent Configuration** — Configure skills, tools, MCP servers, and coding standards
2. **Project Context** — Define architecture, conventions, requirements, and modules
3. **Work Management** — Create work items with briefs and implementation plans
4. **Review & Approval** — Review agent work, approve or request changes
5. **History & Decisions** — Track completed work and architectural decisions

All project data is stored locally in a `.sdlc/` directory using the [cs-sdlc format specification](spec/sdlc/README.md).

## Monorepo Structure

```
cs-sdlc-workflow/
├── packages/
│   ├── sdk/          → @syncfusion/cs-sdlc — TypeScript SDK for .sdlc/ format
│   ├── cli/          → @syncfusion/cs-sdlc-cli — Command-line interface
│   └── tsconfig/     → @syncfusion/tsconfig — Shared TypeScript config
├── spec/sdlc/        → .sdlc/ format specification (v1.0-draft)
├── .designs/         → UI design prototypes (SDLC Studio extension)
└── tasks/            → Project planning
```

## Packages

| Package | Path | Description | Status |
|---------|------|-------------|--------|
| [`@syncfusion/cs-sdlc`](packages/sdk/) | `packages/sdk/` | TypeScript SDK for reading, writing, and validating `.sdlc/` directories | v0.1.0 — 414 tests, Level 3 conformance ✅ |
| `@syncfusion/cs-sdlc-cli` | `packages/cli/` | CLI tool (`cs-sdlc init`, `start`, `done`, etc.) | In progress |
| `@syncfusion/tsconfig` | `packages/tsconfig/` | Shared TypeScript configuration | Done |
| SDLC Studio Extension | `packages/extension/` | VS Code / Code Studio extension | Planned — [UI designs](.designs/) |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9

### Setup

```bash
# Clone and install
git clone <repo-url>
cd cs-sdlc-workflow
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Type-check
pnpm typecheck
```

### SDK Usage

```typescript
import { readManifest, startWork, completeWork } from '@syncfusion/cs-sdlc';

// Read project manifest
const manifest = await readManifest('/path/to/project');

// Start a new work item
await startWork('/path/to/project', {
  description: 'Add dark mode toggle',
  type: 'feature',
});

// Complete work
await completeWork('/path/to/project', 'add-dark-mode');
```

### CLI Usage

```bash
# Initialize .sdlc/ in a project
cs-sdlc init --scan

# Start work
cs-sdlc start "Add dark mode toggle"

# Check status
cs-sdlc status

# Complete work
cs-sdlc done add-dark-mode
```

## The `.sdlc/` Format

The `.sdlc/` directory is a structured, file-based format for tracking software development lifecycle data. It stores:

- **Manifest** (`manifest.json`) — Project identity, modules, counters, phase
- **Context** (`context/`) — Architecture, conventions, requirements (Markdown + YAML front matter)
- **Work Items** (`work/`) — Active and archived work with briefs and plans
- **Decisions** (`decisions/`) — Architectural Decision Records (ADRs)
- **Indexes** (`index/`) — Fast-lookup JSON indexes for work items, decisions, releases
- **Snapshots** (`snapshots/`) — Point-in-time project health snapshots

See the [full specification](spec/sdlc/README.md) for details.

## UI Design

The extension UI design is in [`.designs/`](.designs/). Open `.designs/index.html` in a browser to preview.

**Screens:**
- **Overview** — Workflow status cards (Agent, Context, Work)
- **Agent Configuration** — Skills, MCP servers, coding standards
- **Project Context** — Identity, context documents, modules
- **Work** — Create form → Brief / Plan / Review tabs
- **History** — Completed work grouped by month + decision records
- **Settings** — Project configuration

## Tech Stack

- **Language:** TypeScript (ESM-only)
- **Package Manager:** pnpm (workspaces)
- **Build:** tsup (esbuild)
- **Test:** Vitest
- **Validation:** Zod
- **YAML:** yaml

## License

MIT
