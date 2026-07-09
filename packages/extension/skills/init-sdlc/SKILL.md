---
name: init-sdlc
description: 'Initialize SDLC tracking for a project. Use when setting up a new project, scanning an existing workspace, or when the user says "initialize", "set up project", "create .sdlc", or "scan workspace". Detects tech stack, modules, and conventions automatically for brownfield projects.'
argument-hint: 'Describe your project or say "scan" to auto-detect'
---

# Initialize SDLC Project

## When to Use
- User opens a workspace without `.sdlc/` directory
- User says "initialize", "set up", "scan project", "create .sdlc"
- User wants to start tracking their development workflow

## Procedure

### Step 1: Detect Project Type

Check if source code exists (package.json, *.csproj, pyproject.toml, go.mod, etc.):
- Code exists → **brownfield** (scan and detect)
- Empty/new → **greenfield** (ask user what they want to build)

### Step 2: Brownfield — Scan Existing Project

Read these files directly to detect the stack:

1. `package.json` → name, dependencies, frameworks, TypeScript, testing, styling, database
2. `tsconfig.json` → strict mode, module settings
3. `.eslintrc*` / `eslint.config.*` → lint rules
4. `.prettierrc*` → formatting rules
5. `pnpm-workspace.yaml` / `package.json` workspaces → monorepo modules
6. `src/` folder structure → architecture pattern
7. `README.md` → project description
8. `.github/workflows/` → CI/CD
9. Check for Syncfusion packages → UI library

### Step 3: Greenfield — Interview User

Ask: "What are you building?", "Who will use it?", "Any tech preferences?"

### Step 4: Create .sdlc/ Directory

Use the `#sdlcInit` tool with the project name and description.

### Step 5: Populate Context Documents

Edit the files directly:

- **Edit `.sdlc/context/architecture.md`** with system overview, tech stack, modules, data flow
- **Edit `.sdlc/context/conventions.md`** with naming rules, testing patterns, code style

### Step 6: Confirm with User

Show what was detected and suggest next steps.

## Key Rules
- Read project files directly — no special tool needed for reading
- Edit context docs directly — no special tool needed for writing
- Use `#sdlcInit` tool only for the initial `.sdlc/` directory creation
- Always confirm with user before writing
