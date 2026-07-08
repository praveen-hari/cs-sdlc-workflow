# Chapter 1: Introduction

**Spec Version:** 1.0-draft
**Last Updated:** 2026-07-08

---

## 1.1 Purpose

The `.sdlc/` specification defines an **open, tool-agnostic file format** for storing software development lifecycle artifacts within a project repository. It is designed to work with **any AI coding agent, any editor, and any development workflow** — not locked to a specific vendor or tool.

It serves three primary consumers:

1. **AI Agents** (Claude Code, GitHub Copilot, Cursor, Windsurf, Codex, or any future agent) — Read project context (architecture, conventions, decisions) to produce code that fits the existing system, rather than generic output.
2. **Editor Extensions** (VS Code, Code Studio, JetBrains, Neovim, or any editor) — Parse structured JSON files to render project dashboards, work item trackers, and quality reports in the IDE sidebar.
3. **Human Developers** — Read and edit Markdown documents that describe the project's architecture, conventions, and active work.

### 1.1.1 Problem Statement

Modern AI-assisted development ("vibe coding") produces software without engineering discipline:

- AI agents lack persistent project context between conversations
- Generated code ignores existing architecture and conventions
- No traceability between requirements, decisions, and implementation
- Quality degrades as features accumulate without structure

Additionally, the current ecosystem is **fragmented**:

- Every AI tool has its own context format (`CLAUDE.md`, `.cursorrules`, `.windsurfrules`, `copilot-instructions.md`)
- None of these formats are structured enough for programmatic parsing
- None of them are interoperable — switching tools means rewriting context files
- None of them track work items, decisions, or quality metrics

### 1.1.2 Solution

The `.sdlc/` directory provides a **persistent, structured, universal context layer** that lives in the repository alongside source code. It is:

- **Open standard** — Any tool can implement it; no vendor lock-in
- **Machine-readable** — JSON files for fast parsing by tools and extensions
- **Human-readable** — Markdown files for developers and AI agents
- **Git-friendly** — All text files, diffable, reviewable in pull requests
- **Bounded** — Hot data never grows beyond ~2 KB regardless of project age
- **Layered** — Four access tiers from instant metrics to deep history
- **Interoperable** — Works alongside existing files (`CLAUDE.md`, `.cursorrules`, etc.) without conflict

### 1.1.3 Relationship to Existing Context Files

The `.sdlc/` format is designed to **complement, not replace** existing tool-specific context files:

| Existing File | Relationship |
|--------------|-------------|
| `CLAUDE.md` | Can `@import` from `.sdlc/context/conventions.md` to share rules |
| `.cursorrules` | Can reference `.sdlc/context/` documents for project context |
| `.github/copilot-instructions.md` | Can point to `.sdlc/context/conventions.md` for shared standards |
| `AGENTS.md` | Can coexist; `.sdlc/` adds structured data that `AGENTS.md` cannot provide |
| `.designs/DESIGN.md` (cs-design) | `.sdlc/` references design system; they serve different purposes |

Tools that implement the `.sdlc/` spec gain access to structured project data (JSON schemas, work item tracking, quality metrics) that plain markdown instruction files cannot provide. Tools that don't implement the spec can still read the markdown files in `context/` as plain text.

## 1.2 Scope

### 1.2.1 In Scope

This specification defines:

- The directory structure of `.sdlc/`
- The JSON schemas for all structured files (`manifest.json`, index files, snapshot files)
- The Markdown format for all document files (YAML front matter + prose body)
- The rules for creating, updating, archiving, and syncing files
- Multi-module project support (monorepo, microservices, mixed-tech)
- Conformance levels (Minimal, Standard, Full)

### 1.2.2 Out of Scope

This specification does NOT define:

- CLI command syntax or behavior (implementation-specific)
- Extension UI layout or interaction patterns (implementation-specific)
- AI agent skill definitions or prompts (implementation-specific)
- CI/CD pipeline integration details (implementation-specific)
- Network protocols or cloud sync mechanisms
- How specific tools (Claude Code, Cursor, Copilot, etc.) should load `.sdlc/` files — that is up to each tool's implementation

### 1.2.3 Implementation Freedom

This spec defines the **data format**, not the tooling. Implementations are free to:

- Build a CLI tool that reads/writes `.sdlc/` files
- Build an editor extension that renders `.sdlc/` data in a sidebar
- Build AI agent skills/plugins that read `.sdlc/context/` for project knowledge
- Build a web dashboard that visualizes `.sdlc/` project health
- Build a CI/CD integration that validates `.sdlc/` quality gates
- Build a GitHub Action that auto-generates snapshots on PR merge

Multiple implementations can coexist — they all read and write the same file format, just like multiple PDF readers can open the same PDF file.

## 1.3 Versioning

The specification uses [Semantic Versioning](https://semver.org/):

- **MAJOR** version: Breaking changes to file structure or schemas
- **MINOR** version: New optional fields or files added (backward-compatible)
- **PATCH** version: Clarifications, typo fixes, examples added

The spec version is recorded in `manifest.json` as the `specVersion` field. Implementations MUST check this field and handle unknown versions gracefully.

### 1.3.1 Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0-draft | 2026-07-08 | Initial draft specification |

## 1.4 Terminology

The following terms are used throughout this specification with specific meanings:

### 1.4.1 Requirement Levels

This specification uses the requirement level keywords defined in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119):

| Keyword | Meaning |
|---------|---------|
| **MUST** | Absolute requirement. Non-compliance means the implementation is non-conformant. |
| **MUST NOT** | Absolute prohibition. |
| **SHOULD** | Recommended but not required. Valid reasons may exist to deviate. |
| **SHOULD NOT** | Discouraged but not prohibited. |
| **MAY** | Optional. Implementations can choose to include or omit. |

### 1.4.2 Definitions

| Term | Definition |
|------|-----------|
| **Project** | A software system being developed, which may consist of one or more modules. |
| **Module** | A distinct, independently buildable unit within a project (e.g., a frontend app, a backend service, a shared library). |
| **Manifest** | The `manifest.json` file — the fixed-size header containing project identity, module registry, counters, and health metrics. |
| **Index** | A JSON file in `index/` that catalogs the location and summary of content objects without containing the full content. |
| **Object** | A content file (Markdown or JSON) in `context/`, `work/`, `decisions/`, or `releases/` that contains the actual artifact data. |
| **Snapshot** | A point-in-time quality report stored in `snapshots/`. |
| **Living Document** | A Markdown file in `context/` that is continuously updated as the project evolves (e.g., `architecture.md`). |
| **Work Item** | A unit of tracked work (feature, bug fix, refactor, etc.) stored as a folder in `work/active/` or `work/archive/`. |
| **Decision Record** | An immutable Markdown file in `decisions/` documenting an architectural or technical decision (ADR). |
| **YAML Front Matter** | A YAML block delimited by `---` fences at the top of a Markdown file, containing machine-readable metadata. |
| **Hot Data** | Files that the extension UI reads on every render (manifest + indexes). MUST remain small and bounded. |
| **Cold Data** | Files loaded only on user interaction (work item details, decision content, historical snapshots). |
| **Phase** | One of the five stages of guided development: Understand, Structure, Build, Verify, Ship. |
| **Brownfield** | An existing project where `.sdlc/` is being added retroactively. |
| **Greenfield** | A new project where `.sdlc/` is created from the start. |

### 1.4.3 File Format Conventions

| Convention | Rule |
|-----------|------|
| **Encoding** | All files MUST be UTF-8 encoded. |
| **Line Endings** | All files SHOULD use LF (`\n`) line endings. CRLF (`\r\n`) MUST be accepted by parsers. |
| **JSON** | All JSON files MUST be valid JSON per [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259). Files SHOULD be formatted with 2-space indentation for human readability. |
| **Markdown** | All Markdown files MUST be valid [CommonMark](https://commonmark.org/) with optional YAML front matter. |
| **YAML** | YAML front matter MUST conform to [YAML 1.2](https://yaml.org/spec/1.2.2/). |
| **Dates** | All date/time values MUST use [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format (e.g., `2026-07-08T10:00:00Z`). Date-only values use `YYYY-MM-DD`. |
| **Identifiers** | Work item names, module IDs, and decision IDs MUST use kebab-case (`add-dark-mode`, `auth-service`). |
| **Paths** | All paths within `.sdlc/` files MUST use forward slashes (`/`) regardless of operating system. Paths are relative to the `.sdlc/` directory. |

---

**Next:** [Chapter 2: File Structure](./02-file-structure.md)
