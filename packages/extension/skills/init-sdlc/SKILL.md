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
- **Brownfield**: Read package.json, tsconfig, eslint, README, folder structure
- **Greenfield**: Ask "What are you building?", "Who will use it?"

### Step 3: ⛔ CONFIRM WITH USER
Show what was detected:
```
I found the following:
- Name: my-app
- Stack: TypeScript + React + Node.js
- Testing: Vitest
- Modules: 3 (web-app, api, shared)

Is this correct? Should I proceed with initialization?
```
**STOP. Wait for user to confirm before creating anything.**

### Step 4: Create .sdlc/
Only after user confirms, use `#sdlcInit` tool.

### Step 5: Populate Context Docs
Edit `.sdlc/context/architecture.md` and `.sdlc/context/conventions.md` with detected info.

### Step 6: ⛔ SHOW RESULT
Show what was created and suggest next steps. Wait for user acknowledgment.
