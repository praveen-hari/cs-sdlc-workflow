# `.sdlc/` File Format Specification

**Version:** 1.0-draft
**Status:** Draft
**Date:** 2026-07-08
**Authors:** CS Design Studio Team
**License:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

---

## Overview

The `.sdlc/` specification defines an **open, tool-agnostic file format** for storing persistent, structured project context inside a software repository. It is designed to be read and written by any AI coding agent, any editor extension, and any developer — regardless of which tools they use.

### Why This Exists

Today, every AI coding tool has its own way of storing project context — and none of them talk to each other:

| Tool | Context File | Limitation |
|------|-------------|-----------|
| Claude Code | `CLAUDE.md` | Claude-only, unstructured markdown, no schema |
| Cursor | `.cursor/rules/*.md` | Cursor-only, no structured data |
| GitHub Copilot | `.github/copilot-instructions.md` | Copilot-only, single file |
| Windsurf | `.windsurfrules` | Windsurf-only |
| Devin | `.devin/rules/` | Devin-only |
| Code Studio | `.codestudio/codestudio-instructions.md` | Code Studio-only |
| Superpowers | Skills (in-memory) | No persistence between sessions |
| Plandex | Server database | Not in the repo, requires server |
| Bolt.new / v0 | None | Zero persistence |

**The result:** developers maintain separate instruction files for each tool, project knowledge is fragmented, and nothing is structured enough for an IDE to parse and display.

### What `.sdlc/` Provides

The `.sdlc/` directory is a **single, shared format** that any tool can implement:

- **AI agents** (Claude, Copilot, Cursor, Windsurf, etc.) read `context/*.md` for project architecture and conventions
- **Editor extensions** (VS Code, Code Studio, JetBrains, etc.) parse `manifest.json` for instant dashboard rendering
- **CLI tools** read/write structured JSON for automation and CI/CD integration
- **Developers** read and edit Markdown documents directly

It is **not locked to any specific editor, AI provider, or tool**. Any implementation that follows this spec can read and write `.sdlc/` directories.

### Design Inspirations

The format is inspired by proven file format architectures:

| Inspiration | What We Borrowed |
|-------------|-----------------|
| **PDF** (ISO 32000) | Header → Body → Cross-Reference → Trailer layered architecture |
| **SQLite** | Fixed-size header with counters for instant metrics |
| **Git** | Immutable objects, content-addressed storage, append-only history |
| **DESIGN.md** (Stitch/Google) | YAML front matter + Markdown body dual format |
| **CLAUDE.md / .cursorrules** | The idea of repo-level AI context (but made structured + universal) |

## Specification Chapters

| # | Chapter | Description |
|---|---------|-------------|
| 1 | [Introduction](./01-introduction.md) | Purpose, scope, versioning, terminology |
| 2 | [File Structure](./02-file-structure.md) | Directory layout, four-layer architecture, naming conventions |
| 3 | [Layer 1: Manifest](./03-manifest.md) | `manifest.json` schema — project identity, modules, counters, health |
| 4 | [Layer 2: Indexes](./04-indexes.md) | Index file schemas — work, decisions, releases catalogs |
| 5 | [Layer 3: Objects](./05-objects.md) | Content objects — context docs, work items, decisions, releases |
| 6 | [Layer 4: Snapshots](./06-snapshots.md) | Quality snapshots — latest report, historical trends |
| 7 | [Operations](./07-operations.md) | CRUD operations — init, create, complete, update, sync rules |
| 8 | [Multi-Module Support](./08-multi-module.md) | Monorepo, microservices, mixed-tech project support |
| 9 | [Conformance Levels](./09-conformance.md) | Minimal, Standard, Full conformance definitions |

## Appendices

| # | Appendix | Description |
|---|----------|-------------|
| A | [Examples](./appendix-a-examples.md) | Complete examples for different project types |
| B | [JSON Schemas](./appendix-b-schemas.md) | Machine-readable JSON Schema definitions |
| C | [Migration Guide](./appendix-c-migration.md) | Upgrading between spec versions |

## Quick Reference

### Minimal Valid `.sdlc/` Directory

```
.sdlc/
└── manifest.json
```

### Standard `.sdlc/` Directory

```
.sdlc/
├── manifest.json
├── context/
│   ├── architecture.md
│   └── conventions.md
└── work/
    └── active/
```

### Full `.sdlc/` Directory

```
.sdlc/
├── manifest.json
├── index/
│   ├── work.json
│   ├── decisions.json
│   └── releases.json
├── context/
│   ├── requirements.md
│   ├── architecture.md
│   ├── conventions.md
│   └── stack.md
├── work/
│   ├── active/
│   └── archive/
├── decisions/
├── releases/
└── snapshots/
    ├── latest.json
    └── history/
```

## Adoption Guide

### For AI Agent Developers (Claude Code, Cursor, Copilot, etc.)

At minimum, read `manifest.json` + `context/*.md` at session start. This gives your agent persistent project knowledge without any extra setup from the user.

```
Session start:
  1. Check if .sdlc/manifest.json exists
  2. Read manifest.json → project name, stack, modules
  3. Read context/architecture.md → system design
  4. Read context/conventions.md → coding rules
  → Agent now has full project context
```

### For Editor Extension Developers (VS Code, JetBrains, etc.)

Read `manifest.json` (500 bytes) + `index/work.json` (1-2 KB) to render a full project sidebar. No heavy parsing needed.

### For CLI Tool Developers

Implement the operations in [Chapter 7](./07-operations.md) to create a CLI that manages `.sdlc/` files. The SDK layer should be pure functions returning `Result<T>` types.

### For CI/CD Integration

Run analysis tools and write results to `snapshots/latest.json`. Compare `health` metrics against `gates` thresholds to pass/fail quality checks.

## Interoperability

The `.sdlc/` format is designed to coexist with existing tool-specific files:

```
my-project/
├── .sdlc/                    ← This spec (structured, universal)
├── CLAUDE.md                 ← Claude Code instructions (can @import from .sdlc/)
├── .cursor/rules/            ← Cursor rules (can reference .sdlc/context/)
├── .github/copilot-instructions.md  ← Copilot (can point to .sdlc/)
├── AGENTS.md                 ← Generic agent instructions
├── .designs/                 ← cs-design (design system)
└── src/                      ← Source code
```

## License

This specification is released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Anyone is free to implement, extend, and distribute tools based on this spec.
