# Chapter 9: Conformance Levels

**Spec Version:** 1.0-draft
**Last Updated:** 2026-07-08

---

## 9.1 Overview

The `.sdlc/` specification defines three conformance levels, allowing implementations to support the format incrementally. Each level builds on the previous one.

```
Level 1: Minimal     ← Just the manifest (project identity)
    │
    ▼
Level 2: Standard    ← + Context docs + work items + decisions
    │
    ▼
Level 3: Full        ← + Indexes + snapshots + releases + archive
```

### 9.1.1 Why Conformance Levels?

- **For implementors:** Build support incrementally. A Level 1 reader is useful on its own.
- **For users:** Start with minimal setup, add structure as the project grows.
- **For interoperability:** Tools can declare which level they support.

## 9.2 Level 1: Minimal

**The simplest valid `.sdlc/` directory.**

### 9.2.1 Required Files

```
.sdlc/
└── manifest.json
```

### 9.2.2 Manifest Requirements

The manifest MUST contain:
- `specVersion` (string)
- `magic` (string, value `"cs-sdlc"`)
- `project.name` (string)
- `project.createdAt` (string, ISO 8601)
- `counters.activeWork` (integer)
- `counters.totalCompleted` (integer)
- `counters.decisions` (integer)

All other fields are OPTIONAL at Level 1.

### 9.2.3 Reader Requirements

A Level 1 conformant reader MUST:
- Parse `manifest.json` and extract all required fields.
- Display project name and stack information.
- Handle missing optional fields gracefully (use defaults).
- Ignore unknown fields without error.

### 9.2.4 Writer Requirements

A Level 1 conformant writer MUST:
- Create a valid `manifest.json` with all required fields.
- Preserve unknown fields when updating the manifest.

### 9.2.5 Use Cases

- Quick project identification ("What is this project?")
- AI agent context (project name + stack)
- Extension sidebar header

## 9.3 Level 2: Standard

**Adds context documents, work tracking, and decisions.**

### 9.3.1 Required Files (in addition to Level 1)

```
.sdlc/
├── manifest.json              ← Level 1
├── context/
│   ├── architecture.md        ← NEW: System design
│   └── conventions.md         ← NEW: Code rules
└── work/
    └── active/                ← NEW: Active work items directory
```

### 9.3.2 Optional Files

```
.sdlc/
├── context/
│   ├── requirements.md        ← Optional
│   └── stack.md               ← Optional
├── work/
│   └── active/
│       └── {id}/
│           ├── brief.md       ← Required per work item
│           └── plan.md        ← Optional per work item
└── decisions/
    └── {NNN}-{slug}.md        ← Optional
```

### 9.3.3 Reader Requirements (in addition to Level 1)

A Level 2 conformant reader MUST:
- Parse YAML front matter from Markdown files.
- Read and display context documents.
- List active work items by scanning `work/active/` directories.
- Read work item `brief.md` files.
- List decisions by scanning `decisions/` directory.

### 9.3.4 Writer Requirements (in addition to Level 1)

A Level 2 conformant writer MUST:
- Create context documents with valid YAML front matter.
- Create work item directories with `brief.md`.
- Move completed work items from `work/active/` to `work/archive/`.
- Update `manifest.json` counters on work item state changes.
- Create decision records with valid YAML front matter.

### 9.3.5 Use Cases

- Full AI agent context (architecture + conventions + active work)
- Work item tracking (start, progress, complete)
- Decision logging
- Extension sidebar with work item list

## 9.4 Level 3: Full

**Adds indexes, snapshots, releases, and archive management.**

### 9.4.1 Required Files (in addition to Level 2)

```
.sdlc/
├── manifest.json              ← Level 1
├── index/
│   └── work.json              ← NEW: Work item index
├── context/                   ← Level 2
├── work/                      ← Level 2
└── snapshots/
    └── latest.json            ← NEW: Quality snapshot
```

### 9.4.2 Optional Files

```
.sdlc/
├── index/
│   ├── decisions.json         ← Optional
│   └── releases.json          ← Optional
├── work/
│   └── archive/
│       └── {YYYY-MM}/         ← Optional (monthly archives)
├── releases/
│   └── v{semver}.md           ← Optional
└── snapshots/
    └── history/
        └── {YYYY-MM}.json     ← Optional (monthly history)
```

### 9.4.3 Reader Requirements (in addition to Level 2)

A Level 3 conformant reader MUST:
- Read index files for fast list rendering (instead of scanning directories).
- Read `snapshots/latest.json` for quality metrics.
- Display per-module metrics when available.
- Read historical snapshots for trend views.

### 9.4.4 Writer Requirements (in addition to Level 2)

A Level 3 conformant writer MUST:
- Maintain index files in sync with Layer 3 objects (see §7.7).
- Generate snapshots on analysis runs.
- Sync snapshot metrics to `manifest.json` → `health`.
- Manage `work/archive/` with monthly partitioning.
- Cap `index/work.json` → `recent` at 10 entries.
- Rebuild indexes from filesystem when inconsistencies are detected.

### 9.4.5 Use Cases

- Full extension dashboard with quality metrics
- Historical trend analysis
- Release management
- Fast list rendering via indexes (no directory scanning)

## 9.5 Conformance Declaration

Implementations SHOULD declare their conformance level in documentation and/or programmatically.

### 9.5.1 In Documentation

```
This tool supports .sdlc/ specification v1.0 at Level 2 (Standard).
```

### 9.5.2 Programmatically

Implementations MAY expose conformance information via CLI:

```bash
$ cs-sdlc --version
cs-sdlc v1.0.0
Spec: .sdlc/ v1.0
Conformance: Level 3 (Full)
```

## 9.6 Forward Compatibility

### 9.6.1 Unknown Fields

All conformance levels MUST:
- **Preserve** unknown fields in JSON files when writing (do not strip them).
- **Ignore** unknown fields in JSON files when reading (do not error).
- **Preserve** unknown YAML front matter keys in Markdown files.
- **Preserve** unknown files and directories within `.sdlc/`.

### 9.6.2 Version Handling

When reading a `manifest.json` with a `specVersion` higher than the implementation supports:

| Scenario | Behavior |
|----------|----------|
| Minor version higher (e.g., impl supports 1.0, file is 1.2) | MUST read successfully. Unknown fields are ignored. |
| Major version higher (e.g., impl supports 1.x, file is 2.0) | SHOULD warn the user. MAY attempt to read with best effort. MUST NOT corrupt the file. |

### 9.6.3 Graceful Degradation

If a Level 3 implementation encounters a `.sdlc/` directory that only has Level 1 files:
- It MUST work correctly with the available files.
- It MAY offer to create missing files (e.g., "Would you like to add context documents?").
- It MUST NOT fail or error due to missing optional files.

## 9.7 Conformance Summary

| Feature | Level 1 (Minimal) | Level 2 (Standard) | Level 3 (Full) |
|---------|:-:|:-:|:-:|
| `manifest.json` | ✅ Required | ✅ Required | ✅ Required |
| `project` + `counters` | ✅ Required | ✅ Required | ✅ Required |
| `modules` | Optional | Optional | Optional |
| `health` + `gates` | Optional | Optional | Optional |
| `context/architecture.md` | — | ✅ Required | ✅ Required |
| `context/conventions.md` | — | ✅ Required | ✅ Required |
| `context/requirements.md` | — | Optional | Optional |
| `work/active/` | — | ✅ Required | ✅ Required |
| `work/archive/` | — | Optional | ✅ Required |
| `decisions/` | — | Optional | Optional |
| `index/work.json` | — | — | ✅ Required |
| `index/decisions.json` | — | — | Optional |
| `index/releases.json` | — | — | Optional |
| `snapshots/latest.json` | — | — | ✅ Required |
| `snapshots/history/` | — | — | Optional |
| `releases/` | — | — | Optional |
| Counter sync | ✅ Required | ✅ Required | ✅ Required |
| Index sync | — | — | ✅ Required |
| Snapshot → manifest sync | — | — | ✅ Required |

---

**Previous:** [Chapter 8: Multi-Module Support](./08-multi-module.md)
**Next:** [Appendix A: Examples](./appendix-a-examples.md)
