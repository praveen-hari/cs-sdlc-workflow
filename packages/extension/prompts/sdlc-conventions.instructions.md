---
description: 'SDLC Workflow conventions and approval gates. Use when working in a project that has a .sdlc/ directory. Ensures the agent uses SDLC tools correctly, follows tracking practices, and ALWAYS gets user approval before proceeding.'
applyTo: '**'
---

# SDLC Workflow Conventions

## CRITICAL: Human Approval Required at Every Stage

**NEVER proceed to the next stage without explicit user approval.** The user must review and approve before you continue. This is non-negotiable.

### Approval Gates

| Gate | When | What to Show | Wait For |
|------|------|-------------|----------|
| **Plan Approval** | After creating brief + plan | Show the full brief (What/Why/AC) and task breakdown | User says "approved", "yes", "looks good", "proceed" |
| **Task Review** | After completing each task | Show what files were changed and what was done | User says "next", "continue", "looks good" |
| **Completion Approval** | After all tasks done | Show acceptance criteria checklist (pass/fail each) | User says "complete", "done", "approve" |

### How to Stop and Wait

After each gate, you MUST:
1. Summarize what was done
2. Ask a clear question: "Does this look right? Should I proceed?"
3. **STOP. Do not write any more code until the user responds.**
4. If the user requests changes, make them and ask again

Example:
```
✅ I've created the implementation plan:

## Task 1: Create ThemeProvider context
## Task 2: Add toggle component in header
## Task 3: Configure Syncfusion dark mode
## Task 4: Add localStorage persistence
## Task 5: Test all pages

Does this plan look right? Say "approved" to start implementing, or tell me what to change.
```

## CRITICAL: Always Use Tools — Never Create .sdlc/ Files Manually

| Action | Tool to Use | NEVER Do This |
|--------|------------|---------------|
| Initialize project | `#sdlcInit` | ❌ Don't manually create `.sdlc/` directory |
| Create work item | `#sdlcCreate` | ❌ Don't manually create `work/active/` directories |
| Complete work item | `#sdlcComplete` | ❌ Don't manually move files to `archive/` |
| Abandon work item | `#sdlcAbandon` | ❌ Don't manually delete `work/active/` directories |
| Mark task done | `#sdlcPlanToggle` | ❌ Don't manually edit checkboxes in plan.md |
| Log decision | `#sdlcDecision` | ❌ Don't manually create `decisions/` files |
| Create release | `#sdlcRelease` | ❌ Don't manually create `releases/` files |

## What You CAN Edit Directly (after tools create the structure)

- `.sdlc/context/architecture.md` — system design
- `.sdlc/context/conventions.md` — coding standards
- `.sdlc/work/active/<id>/brief.md` — work item requirements

## What You Should NEVER Edit Directly

- `.sdlc/manifest.json`, `.sdlc/index/*.json` — managed by tools
- `.sdlc/work/active/<id>/plan.md` checkboxes — use `#sdlcPlanToggle` to keep counters in sync

## Core Behaviors (Always Active)

### Test After Every Task
After implementing any task, you MUST:
1. Run the test suite (use the test command from `.sdlc/context/conventions.md`)
2. Run the build (use the build command from `.sdlc/context/conventions.md`)
3. Report results in the task review summary

**If tests fail, fix them BEFORE marking the task done.** Do NOT proceed with failing tests. Do NOT skip tests to move faster.

### Commit After Task Approval
After the user approves a completed task, suggest committing:
```
Want me to commit these changes?
Suggested: git commit -m "feat(<scope>): <description>"
```
Follow conventional commit format. One atomic commit per task. If the user declines, proceed to the next task — but note that uncommitted changes accumulate risk.

### Manage Confusion — Never Guess
When you encounter conflicting requirements, unclear specs, or ambiguous instructions:
1. **STOP.** Do not proceed with a guess.
2. Name the specific confusion: "I see X in the spec but Y in the existing code."
3. Present the tradeoff or ask the clarifying question.
4. **Wait for resolution before continuing.**

**Bad:** Silently picking one interpretation and hoping it's right.
**Good:** "The brief says 'support dark mode' but conventions.md says 'no CSS-in-JS'. Should I use CSS variables or Tailwind dark: classes?"

### Push Back When Warranted
You are not a yes-machine. When an approach has clear problems:
1. Point out the issue directly
2. Explain the concrete downside (quantify when possible — "this adds ~200ms latency" not "this might be slower")
3. Propose an alternative
4. Accept the user's decision if they override with full information

Sycophancy is a failure mode. "Of course!" followed by implementing a bad idea helps no one.

## Full Workflow: SPEC → PLAN → BUILD → TEST → REVIEW → SHIP

```
SPEC:
1. Gather requirements (interview-me skill or user description)

PLAN:
2. Create work item (#sdlcCreate)
3. Write brief (What/Why/AC/Testing Strategy/Boundaries)
4. Write plan (tasks with dependencies, sized S/M/L)
5. ⛔ STOP — Show plan to user — WAIT FOR APPROVAL

BUILD + TEST (repeat for each task):
6. Implement Task N
7. Run tests + build — fix if failing
8. Mark task done (#sdlcPlanToggle)
9. ⛔ STOP — Show changes + test results — WAIT FOR APPROVAL
10. Suggest commit — "git commit -m 'feat: ...'"
11. ... repeat for each task ...

REVIEW:
12. All tasks done
13. Run full test suite + 5-axis review
14. ⛔ STOP — Show acceptance criteria verification — WAIT FOR APPROVAL

SHIP:
15. Complete work item (#sdlcComplete)
16. Suggest next action:
    - "Start next work item?"
    - "Create a release with #sdlcRelease?"
    - "Update project context docs?"
```
