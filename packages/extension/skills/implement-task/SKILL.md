---
name: implement-task
description: 'Implement a work item task by task following the plan. Use when the user says "continue working", "implement", "build this", "next task", or wants to resume work on an active item. Follows the plan.md checklist and updates progress.'
argument-hint: 'Continue working on the active task or specify a work item ID'
---

# Implement Task

## When to Use
- User wants to implement a feature or fix
- User says "continue", "next task", "implement", "build"
- Resuming work on an active work item

## Procedure

### Step 1: Load Context

1. Read `.sdlc/manifest.json` to get project info
2. Read `.sdlc/index/work.json` to find the active work item
3. Read `.sdlc/work/active/<id>/brief.md` for requirements and acceptance criteria
4. Read `.sdlc/work/active/<id>/plan.md` for the task checklist
5. Read `.sdlc/context/conventions.md` for coding standards

### Step 2: Find Current Task

Parse `plan.md` to find the first unchecked task (`- [ ]`). This is the current task.

### Step 3: Implement

For the current task:
1. Announce what you're about to do
2. Implement the changes (create/edit source files)
3. Follow conventions from `.sdlc/context/conventions.md`
4. After completing, update `plan.md` — change `- [ ]` to `- [x]` for completed sub-tasks
5. Update the front matter counters (`completedTasks`)

### Step 4: Verify

After each task:
- Run relevant tests if they exist
- Check that the change doesn't break existing functionality
- If the task has specific acceptance criteria, verify them

### Step 5: Report Progress

Tell the user:
- What was completed
- Current progress (X/Y tasks)
- What's next
- Any issues or decisions needed

### Step 6: Continue or Stop

Ask: "Ready for the next task, or want to review first?"

If all tasks are done, suggest using `#sdlcComplete` to mark the work item as done.

## Key Rules
- Always read the brief and plan BEFORE implementing
- Follow project conventions — read conventions.md
- Update plan.md checkboxes as you complete sub-tasks
- One task at a time — don't skip ahead
- If a task requires a decision, use `#sdlcDecision` to log it
- Edit source files directly — no special tools needed for code changes
