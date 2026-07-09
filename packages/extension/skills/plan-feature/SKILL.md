---
name: plan-feature
description: 'Plan a new feature with requirements, acceptance criteria, and implementation tasks. Use when the user wants to build something new, says "new feature", "I want to build", "plan", "start feature", or describes a feature idea.'
argument-hint: 'Describe the feature you want to build'
---

# Plan Feature

## Procedure

### Step 1: Understand the Idea
- Read `.sdlc/context/architecture.md` and `.sdlc/context/conventions.md`
- Ask clarifying questions if the idea is vague

### Step 2: Create Work Item
Use `#sdlcCreate` tool with title, type, and priority.

### Step 3: Write Brief + Plan
Edit `brief.md` with What/Why/Acceptance Criteria/Scope.
Edit `plan.md` with ordered task breakdown.

### Step 4: ⛔ STOP — PLAN APPROVAL REQUIRED

Show the complete plan to the user:

```
📋 Work Item Created: <id>

## Brief
**What:** <description>
**Why:** <motivation>

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Implementation Plan
1. Task 1: <description>
2. Task 2: <description>
3. Task 3: <description>

Does this plan look right?
- Say **"approved"** to start implementing
- Or tell me what to change
```

**⛔ STOP HERE. Do NOT start implementing until the user explicitly approves the plan.**

If the user requests changes:
1. Make the changes to brief.md and plan.md
2. Show the updated plan
3. Ask for approval again
4. Repeat until approved

### Step 5: Only After Approval
Once the user says "approved", "yes", "looks good", "proceed", or similar — THEN hand off to the implement-task skill.

## Key Rules
- NEVER start coding before plan approval
- Acceptance criteria must be testable (pass/fail)
- Tasks ordered by dependency
- Each task completable in one session
