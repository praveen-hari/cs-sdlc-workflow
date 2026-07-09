---
name: plan-feature
description: 'Plan a new feature with requirements, acceptance criteria, and implementation tasks. Use when the user wants to build something new, says "new feature", "I want to build", "plan", "start feature", or describes a feature idea.'
argument-hint: 'Describe the feature you want to build'
---

# Plan Feature

## When to Use
- User describes a feature they want to build
- User says "new feature", "I want to add", "plan this", "start working on"
- Before any implementation begins

## Procedure

### Step 1: Understand the Idea

Read project context first:
- Read `.sdlc/context/architecture.md` to understand the system
- Read `.sdlc/context/conventions.md` to understand coding standards
- Read `.sdlc/manifest.json` to know the tech stack and modules

Then ask smart questions based on context:
- "What should this feature do?"
- "Any specific requirements?"
- "What does success look like?" (acceptance criteria)

### Step 2: Create Work Item

Use the `#sdlcCreate` tool:
```
Tool: #sdlcCreate
Input: { "title": "<feature description>", "type": "feature", "priority": "<priority>" }
```

### Step 3: Write the Brief

Edit `.sdlc/work/active/<id>/brief.md` directly with:

```markdown
# <Feature Title>

## What
<Clear description>

## Why
<Motivation and context>

## Acceptance Criteria
- [ ] Criterion 1 (testable, specific)
- [ ] Criterion 2
- [ ] Criterion 3

## Scope
### In Scope
- ...
### Out of Scope
- ...
```

### Step 4: Create Implementation Plan

Edit `.sdlc/work/active/<id>/plan.md` directly:

```markdown
---
totalTasks: <N>
completedTasks: 0
---

# Implementation Plan

## Task 1: <Foundation>
- [ ] Sub-task 1a
- [ ] Sub-task 1b

## Task 2: <Core Implementation>
- [ ] Sub-task 2a

## Task 3: <Testing>
- [ ] Write unit tests
- [ ] Write integration tests
```

### Step 5: Review with User

Show the brief + plan. Iterate until approved.

## Key Rules
- Read project context BEFORE planning — follow existing patterns
- Acceptance criteria must be testable (pass/fail)
- Tasks ordered by dependency (foundation → core → tests → polish)
- Each task completable in one session
- Use `#sdlcCreate` tool for work item creation, edit files directly for content
