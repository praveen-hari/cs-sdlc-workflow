---
name: init-sdlc
description: 'Initialize SDLC tracking for a project. Use when setting up a new project, scanning an existing workspace, or when the user says "initialize", "set up project", "create .sdlc", or "scan workspace".'
argument-hint: 'Describe your project or say "scan" to auto-detect'
---

# Initialize SDLC Project

## Procedure

### Step 1: Detect Project Type
- Check if source code exists → **brownfield** (scan) or **greenfield** (ask user)

### Step 2: Gather Information
- **Brownfield**: Read package.json, tsconfig, eslint, README, folder structure, test config, CI config
- **Greenfield**: Ask "What are you building?", "Who will use it?", "What's the tech stack?"

### Step 3: ⛔ CONFIRM WITH USER
Show what was detected:
```
I found the following:
- Name: my-app
- Stack: TypeScript + React + Node.js
- Testing: Vitest
- Build: npm run build
- Modules: 3 (web-app, api, shared)

Is this correct? Should I proceed with initialization?
```
**STOP. Wait for user to confirm before creating anything.**

### Step 4: Create .sdlc/
Only after user confirms, use `#sdlcInit` tool.

### Step 5: Populate Context Docs

**architecture.md** — System design:
- High-level architecture (monolith, microservices, monorepo)
- Key modules and their responsibilities
- Data flow between components
- External dependencies and integrations

**conventions.md** — Coding standards with boundaries:
```markdown
## Code Style
<detected or user-specified conventions>

## Commands
- Build: <command>
- Test: <command>
- Lint: <command>
- Dev: <command>

## Boundaries
### Always Do
- Run tests before marking tasks complete
- Follow naming conventions
- Validate inputs at API boundaries
- Use parameterized queries (no string concatenation)

### Ask First
- Database schema changes
- Adding new dependencies
- Changing CI/CD configuration
- Modifying public API contracts

### Never Do
- Commit secrets, tokens, or credentials
- Skip tests to move faster
- Edit vendor/generated directories
- Remove failing tests without understanding why they fail
- Hardcode environment-specific values
```

### Step 6: ⛔ SHOW RESULT
Show what was created and suggest next steps:
```
✅ SDLC tracking initialized!

Created:
- .sdlc/manifest.json — project identity
- .sdlc/context/architecture.md — system design
- .sdlc/context/conventions.md — coding standards + boundaries
- .sdlc/index/ — work, decisions, releases indexes

Next steps:
1. Review the context docs — do they accurately describe your project?
2. Start your first work item when ready
```

Wait for user acknowledgment.

## Key Rules
- ALWAYS confirm with user before creating .sdlc/
- ALWAYS populate conventions.md with boundaries (always/ask-first/never)
- ALWAYS include build/test/lint commands in conventions.md
- Detect as much as possible automatically — minimize questions

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll set up conventions later" | Conventions set at init are followed. Conventions added later are ignored. Do it now. |
| "Boundaries are overkill for a small project" | Small projects grow. Boundaries prevent the agent from making irreversible mistakes early. |
| "The README already has this info" | The agent reads `.sdlc/context/`, not the README. Duplicate the key info where the agent will find it. |

## Red Flags
- Creating .sdlc/ without user confirmation
- Empty conventions.md (no boundaries, no commands)
- Missing build/test commands in conventions.md

## See Also
- For context engineering best practices, see the `context-engineering` skill
