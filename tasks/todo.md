# Task List: `@syncfusion/cs-sdlc` SDK

## Phase 1: Schemas & Types
- [ ] Task 1: Shared schemas (identifiers, dates, enums, extensible unions)
- [ ] Task 2: Manifest schema (project, modules, counters, health, gates)
- [ ] Task 3: Index schemas (work, decisions, releases)
- [ ] Task 4: Object front matter schemas (context docs, brief, plan, decision, release)
- [ ] Task 5: Snapshot schemas (latest, history, all sub-objects)
- [ ] Task 6: Types barrel export (`z.infer<>` re-exports)
- [ ] **Checkpoint: Phase 1** — all schema tests pass, typecheck clean

## Phase 2: Core I/O
- [ ] Task 7: Error types (SdlcError hierarchy)
- [ ] Task 8: Identifier validation + slug generation
- [ ] Task 9: YAML front matter parser/serializer
- [ ] Task 10: Atomic JSON writer (temp + rename)
- [ ] Task 11: File reader (JSON + Markdown with validation)
- [ ] Task 12: Directory discovery (walk-up algorithm)
- [ ] Task 13: Constants (paths, sizes, magic, version)
- [ ] **Checkpoint: Phase 2** — core I/O tests pass, can read/write/discover

## Phase 3: Operations
- [ ] Task 14: Greenfield init (`initSdlc`)
- [ ] Task 15: Start work (`startWork`)
- [ ] Task 16: Complete work (`completeWork` + archive)
- [ ] Task 17: Abandon work (`abandonWork`)
- [ ] Task 18: Create decision (`createDecision`)
- [ ] Task 19: Supersede decision (`supersedeDecision`)
- [ ] Task 20: Create release (`createRelease`)
- [ ] Task 21: Generate snapshot (`generateSnapshot` + history + manifest sync)
- [ ] Task 22: Sync & consistency (`rebuildIndexes`, `recalculateCounters`, `validateConsistency`)
- [ ] Task 23: Read helpers (all `read*` functions)
- [ ] Task 24: Update phase + module lifecycle (add/remove/rename)
- [ ] **Checkpoint: Phase 3** — all operations pass, full lifecycle works

## Phase 4: Brownfield Scanner
- [ ] Task 25: Stack detection (Node, .NET, Python, Go, Rust, Java)
- [ ] Task 26: Module detection (monorepo workspaces)
- [ ] Task 27: Brownfield init (`initSdlcFromScan`)
- [ ] **Checkpoint: Phase 4** — scanner detects all ecosystems

## Phase 5: Polish & Ship
- [ ] Task 28: JSON Schema generation (Zod → JSON Schema)
- [ ] Task 29: Conformance tests (Level 1/2/3 + forward compat + degradation)
- [ ] Task 30: Barrel export + public API wiring
- [ ] **Checkpoint: Phase 5** — SDK v0.1.0 ready (build, test, coverage, schemas)
