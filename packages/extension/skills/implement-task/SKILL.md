---
name: implement-task
description: 'Implement a work item task by task with user review after each task. Use when the user says "continue working", "implement", "build this", "next task", or wants to resume work on an active item.'
argument-hint: 'Continue working on the active task or specify a work item ID'
---

# Implement Task

## Procedure

### Step 1: Load Context
1. Read `.sdlc/work/active/<id>/brief.md` for requirements
2. Read `.sdlc/work/active/<id>/plan.md` for task checklist
3. Read `.sdlc/context/conventions.md` for coding standards
4. Find the first unchecked task (`- [ ]`) — this is the current task

### Step 2: Announce Current Task
Tell the user what you're about to do:
```
📌 Working on Task N: <task description>

I will:
- <sub-task 1>
- <sub-task 2>

Proceeding...
```

### Step 3: Implement ONE Task
- Implement only the current task — do NOT skip ahead
- Follow conventions from `.sdlc/context/conventions.md`
- Update `plan.md` — change `- [ ]` to `- [x]` for completed sub-tasks

### Step 4: ⛔ STOP — TASK REVIEW REQUIRED

After completing the task, show what was done:

```
✅ Task N Complete: <task description>

Changes made:
- Created/modified: <file list>
- <summary of what was done>

Progress: X/Y tasks (Z%)

Ready for the next task? Or would you like to review the changes first?
```

**⛔ STOP HERE. Do NOT proceed to the next task until the user responds.**

Wait for one of:
- "next" / "continue" / "looks good" → proceed to next task
- "review" / "show me" → show the changes in detail
- "change" / "fix" → make corrections, then ask again

### Step 5: Repeat
Go back to Step 1 for the next task. Each task gets its own review cycle.

### Step 6: All Tasks Done
When all tasks are checked:
```
🎉 All tasks complete!

Progress: Y/Y tasks (100%)

Next step: Review acceptance criteria before completing.
Would you like me to verify the acceptance criteria now?
```

**⛔ STOP. Wait for user to confirm before running review.**

## Key Rules
- ONE task at a time — never implement multiple tasks without review
- ALWAYS stop after each task and wait for user response
- If a task requires a decision, use `#sdlcDecision` to log it
- Never call `#sdlcComplete` — that's for the review-work skill after user approval
