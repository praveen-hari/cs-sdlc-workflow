---
name: implement-task
description: 'Implement a work item task by task with user review after each task. Use when the user says "continue working", "implement", "build this", "next task", or wants to resume work on an active item.'
argument-hint: 'Continue working on the active task or specify a work item ID'
---

# Implement Task

## Procedure

### Step 1: Load Context
1. Read `.sdlc/work/active/<id>/spec.md` for requirements and boundaries
2. Read `.sdlc/work/active/<id>/todo.md` for task checklist
3. Read `.sdlc/work/active/<id>/plan.md` for implementation approach
3. Read `.sdlc/context/conventions.md` for coding standards
4. Find the first unchecked task (`- [ ]`) — this is the current task
5. Check if this is a **bug** type work item — if so, use the Prove-It Pattern (Step 2b)

### Step 2: Announce Current Task
Tell the user what you're about to do:
```
📌 Working on Task N: <task description>

I will:
- <sub-task 1>
- <sub-task 2>

Proceeding...
```

### Step 2b: Prove-It Pattern (Bug Fixes Only)
For bug-type work items, **do not start by trying to fix it.** Start by reproducing:
1. Write a test that demonstrates the bug
2. Confirm the test FAILS (proving the bug exists)
3. Implement the fix
4. Confirm the test PASSES (proving the fix works)
5. Run full test suite (no regressions)

### Step 3: Simplicity Check
Before writing any code, ask: **"What is the simplest thing that could work?"**

```
SIMPLICITY CHECK:
✗ Generic EventBus with middleware pipeline for one notification
✓ Simple function call

✗ Abstract factory pattern for two similar components
✓ Two straightforward components with shared utilities

✗ Config-driven form builder for three forms
✓ Three form components
```

Implement the naive, obviously-correct version first. Optimize only after correctness is proven with tests.

### Step 4: Implement ONE Task
- Implement only the current task — do NOT skip ahead
- Follow conventions from `.sdlc/context/conventions.md`
- **Scope discipline:** Touch only what the task requires. If you notice something worth improving outside your task scope, note it — don't fix it:

```
NOTICED BUT NOT TOUCHING:
- src/utils/format.ts has an unused import (unrelated to this task)
- The auth middleware could use better error messages (separate task)
→ Want me to create tasks for these?
```

- Do NOT "clean up" adjacent code, refactor imports in files you're not modifying, or add features not in the spec

### Step 5: Verify
After implementing, run verification:
1. **Run tests** — `npm test` (or project-specific command from conventions.md)
2. **Run build** — `npm run build` (confirm no compile errors)
3. **Run typecheck** — `npx tsc --noEmit` (if TypeScript)
4. If any fail, fix before proceeding

### Step 6: Mark Done — MANDATORY
**You MUST call `#sdlcTodoToggle` with the task number BEFORE reporting to the user.** This toggles the checkbox in todo.md and syncs the dashboard. If you skip this, the dashboard shows stale progress and the user sees wrong completion %.

```
#sdlcTodoToggle id=<work-id> taskNumber=<N> completed=true
```

**A task is NOT done until `#sdlcTodoToggle` has been called.** Do not proceed to Step 7 without it.

### Step 7: ⛔ STOP — TASK REVIEW REQUIRED

After completing the task, show what was done:

```
✅ Task N Complete: <task description>

Changes made:
- Created/modified: <file list>
- <summary of what was done>

Verification:
- Tests: ✅ passing
- Build: ✅ clean
- Typecheck: ✅ clean

Progress: X/Y tasks (Z%)

Ready for the next task? Or would you like to review the changes first?
```

**⛔ STOP HERE. Do NOT proceed to the next task until the user responds.**

Wait for one of:
- "next" / "continue" / "looks good" → proceed to next task
- "review" / "show me" → show the changes in detail
- "change" / "fix" → make corrections, then ask again

### Step 8: Repeat
Go back to Step 1 for the next task. Each task gets its own review cycle.

### Step 9: All Tasks Done
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
- ALWAYS ask "what is the simplest thing that could work?" before coding
- ALWAYS stop after each task and wait for user response
- ALWAYS use `#sdlcTodoToggle` after completing a task — never edit todo.md checkboxes manually
- ALWAYS run tests + build after each task before reporting completion
- ALWAYS respect scope — don't touch code outside the current task
- For bugs, ALWAYS reproduce with a failing test before fixing (Prove-It Pattern)
- If a task requires a decision, use `#sdlcDecision` to log it
- Never call `#sdlcComplete` — that's for the review-work skill after user approval

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll test it all at the end" | Bugs compound. A bug in Task 1 makes Tasks 2-5 wrong. Test each task. |
| "It's faster to do it all at once" | It *feels* faster until something breaks and you can't find which of 500 changed lines caused it. |
| "Let me just quickly clean up this adjacent code" | Refactors mixed with features make both harder to review. Note it, don't fix it. |
| "This is too simple to test" | Simple code gets complicated. The test documents the expected behavior. |
| "I tested it manually" | Manual testing doesn't persist. Tomorrow's change might break it with no way to know. |
| "Let me build a generic solution" | Three similar lines of code is better than a premature abstraction. Generalize on the third use case, not the first. |

## Red Flags
- More than 100 lines of code written without running tests
- Multiple unrelated changes in a single task
- "Let me just quickly add this too" scope expansion
- Skipping the test/verify step to move faster
- Bug fixes without reproduction tests
- Building abstractions before the third use case demands it
- Touching files outside the task scope "while I'm here"

## See Also
- For detailed TDD patterns, see the `test-driven-development` skill
- For systematic debugging, see the `debugging-and-error-recovery` skill
- For commit conventions, see the `git-workflow-and-versioning` skill
