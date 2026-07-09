---
name: init-sdlc
description: 'Initialize SDLC tracking for a project. Use when setting up a new project, scanning an existing workspace, or when the user says "initialize", "set up project", "create .sdlc", or "scan workspace".'
argument-hint: 'Describe your project or say "scan" to auto-detect'
---

# Initialize SDLC Project

## Procedure

### Step 1: Detect Project Type
- Check if source code exists → **brownfield** (scan) or **greenfield** (interview)

### Step 2a: Brownfield — Auto-Scan
Read package.json, tsconfig, eslint, README, folder structure, test config, CI config.
Then go to Step 3.

### Step 2b: Greenfield — Interview (One Question at a Time)

**Start with a hypothesis and confidence number:**
```
HYPOTHESIS: You want to build a web application.
CONFIDENCE: ~20% — missing: what it does, who it's for, tech stack, first feature.
```

**Ask ONE question at a time. Wait for the answer before asking the next. Attach your best guess to each question.**

**Question 1: What are you building?**
```
Q: What are you building and what problem does it solve?
GUESS: Based on the empty workspace, I'm guessing a web application — but it could be a CLI tool, API, library, or mobile app. What is it?
```
⛔ Wait for answer.

**Question 2: Who will use it?**
```
Q: Who are the target users?
GUESS: <guess based on their answer to Q1>
```
⛔ Wait for answer.

**Question 3: What tech stack?**
```
Q: What tech stack do you want to use? Or should I suggest one based on what you're building?
GUESS: <suggest based on Q1 + Q2 — e.g., "For a web app with that audience, I'd suggest React + TypeScript + Node.js">
```
⛔ Wait for answer.

**Question 4: What's the first feature?**
```
Q: What's the first thing you want to build? This will become your first work item after setup.
GUESS: <guess based on previous answers>
```
⛔ Wait for answer.

**If any answer is vague** (e.g., "something modern", "the usual stack", "make it scalable"):
> Ask: "If you didn't have to justify this to anyone, what would you actually want?"

**Do NOT batch questions.** Batching encourages skim-reading and surface answers. The third question often depends on the answer to the first.

### Step 3: ⛔ CONFIRM WITH USER — Restate and Wait

Show a concrete summary using the user's own words:

**Brownfield:**
```
Here's what I found:

- Project:    <name>
- Stack:      <detected stack>
- Testing:    <framework>
- Build:      <command>
- Modules:    <count> (<names>)
- Out of scope: <what we're NOT setting up>

Is this correct? Say "yes" to proceed or tell me what to change.
```

**Greenfield:**
```
Here's what I understand:

- Outcome:    <what they're building, in their words>
- Users:      <who it's for>
- Stack:      <chosen tech stack>
- First work: <first feature to build>
- Out of scope: <what we're NOT building yet>

Is this correct? Say "yes" to proceed or tell me what to change.
```

**⛔ STOP. Wait for EXPLICIT "yes".** The following are NOT yes:
- "Whatever you think is best" → Re-ask with two concrete options
- "Sounds good" → Ask: "Anything you'd change?"
- "Sure, let's go" → Ask: "Before I create everything — anything to refine?"

### Step 4: Create .sdlc/
Only after user explicitly confirms, use `#sdlcInit` tool.

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
