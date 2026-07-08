# Chapter 8: Multi-Module Support

**Spec Version:** 1.0-draft
**Last Updated:** 2026-07-08

---

## 8.1 Overview

The `.sdlc/` format supports projects ranging from a single-file script to a multi-repo microservices platform. This chapter defines how modules are declared, detected, and referenced across the format.

### 8.1.1 Module Definition

A **module** is a distinct, independently buildable unit within a project. Examples:

| Module | Type | Example Path |
|--------|------|-------------|
| React frontend | `frontend` | `apps/web/` |
| .NET API service | `backend` | `services/auth/` |
| Python worker | `backend` | `services/notifications/` |
| Shared TypeScript types | `library` | `libs/shared/` |
| Terraform config | `infrastructure` | `infra/` |

### 8.1.2 When Modules Apply

| Project Structure | Modules? | Example |
|-------------------|----------|---------|
| Single app (one language, one build) | No — omit `modules` from manifest | A React app, a CLI tool |
| Frontend + Backend (same repo) | Yes — 2+ modules | React + Express in one repo |
| Monorepo with workspaces | Yes — N modules | Turborepo, Nx, Lerna projects |
| Microservices (one repo) | Yes — N modules | Multiple services in one repo |
| Microservices (multiple repos) | Special — see §8.5 | Each service in its own repo |

## 8.2 Module Declaration

Modules are declared in `manifest.json` → `modules` (see Chapter 3, §3.4).

### 8.2.1 Single-Module Projects

For single-module projects, the `modules` object SHOULD be omitted. The `stack` object is placed directly in `project`:

```json
{
  "project": {
    "name": "My CLI Tool",
    "createdAt": "2026-07-08T10:00:00Z",
    "stack": {
      "language": "typescript",
      "runtime": "node"
    }
  }
}
```

Implementations MUST treat this as equivalent to a single module with ID `"app"` and path `"."`.

### 8.2.2 Multi-Module Projects

For multi-module projects, each module is declared with its path and stack:

```json
{
  "modules": {
    "web-app": {
      "path": "apps/web",
      "type": "frontend",
      "stack": { "language": "typescript", "framework": "react" }
    },
    "api": {
      "path": "services/api",
      "type": "backend",
      "stack": { "language": "csharp", "framework": "dotnet-8" }
    }
  }
}
```

### 8.2.3 Module ID Rules

- Module IDs MUST follow the identifier rules in §2.4.4 (kebab-case, max 64 chars).
- Module IDs MUST be unique within a project.
- Module IDs SHOULD be descriptive (e.g., `auth-service` not `svc1`).

## 8.3 Module Detection (Brownfield)

When initializing `.sdlc/` on an existing project (`init --scan`), implementations SHOULD auto-detect modules.

### 8.3.1 Detection Heuristics

**Step 1: Detect monorepo root indicators**

| File | Indicates |
|------|-----------|
| `package.json` with `workspaces` | npm/yarn/pnpm monorepo |
| `pnpm-workspace.yaml` | pnpm monorepo |
| `lerna.json` | Lerna monorepo |
| `nx.json` | Nx monorepo |
| `turbo.json` | Turborepo monorepo |

**Step 2: Scan workspace directories**

For each workspace directory, detect the module type:

| Indicator | Module Type |
|-----------|------------|
| Has `src/` with `.tsx`/`.jsx` files + React dependency | `frontend` |
| Has `src/` with `.ts`/`.js` files + Express/Fastify/Hono dependency | `backend` |
| Has `*.csproj` with `Microsoft.AspNetCore` reference | `backend` |
| Has `pyproject.toml` with FastAPI/Django/Flask dependency | `backend` |
| Has `main.go` or `go.mod` | `backend` |
| Has no application entry point, only exports | `library` |
| Has `*.tf` files | `infrastructure` |
| Has `Dockerfile` without other indicators | `other` |

**Step 3: Generate module entries**

For each detected module, create an entry in `manifest.json` → `modules` with:
- `path`: relative path from project root
- `type`: detected type
- `stack`: detected language and framework

### 8.3.2 Detection Confidence

Implementations SHOULD indicate detection confidence to the user:

| Confidence | Meaning | Action |
|-----------|---------|--------|
| High | Strong indicators (e.g., `package.json` with React dependency) | Auto-add to manifest |
| Medium | Moderate indicators (e.g., directory with `.ts` files) | Suggest to user, ask for confirmation |
| Low | Weak indicators (e.g., directory with mixed files) | Show as optional, don't auto-add |

## 8.4 Cross-Module References

### 8.4.1 In Work Items

Work items that span multiple modules declare affected modules in the YAML front matter:

```yaml
---
type: feature
title: Add Payment Integration
modules:
  - billing-service
  - web-app
  - shared-types
  - notification-service
---
```

### 8.4.2 In Plans

Task breakdowns in `plan.md` SHOULD group tasks by module:

```markdown
## Task 1: Define Types
Module: shared-types
- [x] Create PaymentMethod type
- [x] Create Invoice type

## Task 2: Build API
Module: billing-service
- [ ] Create Stripe service wrapper
- [ ] Add payment endpoints

## Task 3: Build UI
Module: web-app
- [ ] Create CheckoutPage component
- [ ] Connect to billing API
```

### 8.4.3 In Context Documents

`context/architecture.md` SHOULD describe module relationships:

```markdown
## Module Communication

- **web-app** → **api-gateway**: REST/HTTPS
- **api-gateway** → **auth-service**: gRPC
- **api-gateway** → **billing-service**: gRPC
- **billing-service** → **notification-service**: Event bus (RabbitMQ)
```

`context/conventions.md` MAY have per-module sections:

```markdown
## TypeScript Modules (web-app, billing-service, shared-types)
- Strict mode enabled
- Use Zod for validation

## .NET Modules (auth-service)
- .NET 8 minimal APIs
- xUnit for testing

## Python Modules (notification-service)
- Python 3.12+, FastAPI
- pytest for testing
```

### 8.4.4 In Snapshots

`snapshots/latest.json` MAY include per-module metrics:

```json
{
  "modules": {
    "web-app": { "coverage": 85 },
    "auth-service": { "coverage": 91 },
    "billing-service": { "coverage": 72 }
  }
}
```

## 8.5 Multi-Repo Projects

For projects where modules live in separate Git repositories, two approaches are supported:

### 8.5.1 Approach A: Independent `.sdlc/` Per Repo

Each repository has its own `.sdlc/` directory tracking that module independently.

```
org/user-service/
├── .sdlc/                ← Tracks user-service only
└── src/

org/payment-service/
├── .sdlc/                ← Tracks payment-service only
└── src/
```

**Pros:** Simple, each repo is self-contained.
**Cons:** No cross-repo work item tracking, no unified dashboard.

### 8.5.2 Approach B: Umbrella `.sdlc/` with Remote Modules

A dedicated repository (or the "platform" repo) contains the `.sdlc/` directory with `repo` fields pointing to external repositories.

```json
{
  "modules": {
    "user-service": {
      "repo": "https://github.com/org/user-service",
      "path": ".",
      "type": "backend",
      "stack": { "language": "csharp", "framework": "dotnet-8" }
    },
    "payment-service": {
      "repo": "https://github.com/org/payment-service",
      "path": ".",
      "type": "backend",
      "stack": { "language": "typescript", "framework": "express" }
    }
  }
}
```

**Pros:** Unified tracking, cross-repo work items.
**Cons:** Requires a separate repo or meta-repo for `.sdlc/`.

### 8.5.3 Remote Module Fields

When `repo` is present in a module entry:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repo` | string | REQUIRED | Git repository URL (HTTPS or SSH). |
| `path` | string | REQUIRED | Path within the remote repo (usually `"."`). |
| `branch` | string | OPTIONAL | Default branch name (default: `"main"`). |

Implementations MAY use the `repo` field to:
- Clone or fetch the remote repo for analysis
- Link to the repo in the UI
- Open the repo in a new editor window

Implementations MUST NOT require network access for basic `.sdlc/` operations. Remote module information is informational — the `.sdlc/` format works offline.

## 8.6 Module Lifecycle

### 8.6.1 Adding a Module

1. Add entry to `manifest.json` → `modules`.
2. Optionally update `context/architecture.md` to describe the new module.
3. Optionally update `context/conventions.md` with module-specific rules.

### 8.6.2 Removing a Module

1. Remove entry from `manifest.json` → `modules`.
2. Update `context/architecture.md` to remove references.
3. Existing work items that reference the removed module are NOT modified (historical accuracy).

### 8.6.3 Renaming a Module

1. Update the module ID key in `manifest.json` → `modules`.
2. Update all references in `index/work.json` → `active` entries' `modules` arrays.
3. Update references in `context/*.md` documents.
4. Existing archived work items are NOT modified.

---

**Previous:** [Chapter 7: Operations](./07-operations.md)
**Next:** [Chapter 9: Conformance Levels](./09-conformance.md)
