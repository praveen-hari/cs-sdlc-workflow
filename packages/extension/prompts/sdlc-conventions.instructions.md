---
description: 'SDLC Workflow conventions, phase→skill mapping, and approval gates. Use when working in a project that has a .sdlc/ directory. Ensures the agent uses the right skills at each phase, uses SDLC tools correctly, and ALWAYS gets user approval before proceeding.'
applyTo: '**'
---

# SDLC Workflow Conventions

## Skill Discovery: Match Intent to Phase

When a task arrives, identify the SDLC phase and use the corresponding skills:

```
Task arrives
    │
    ├── Vague idea, needs clarity?        → interview-me, idea-refine
    ├── Need a formal spec?               → spec-driven-development
    ├── Need to set up project context?   → context-engineering, init-sdlc
    ├── Need to break work into tasks?    → plan-feature
    ├── Implementing code?                → implement-task
    │   ├── Writing tests?                → test-driven-development
    │   ├── Need doc-verified code?       → source-driven-development
    │   └── Something broke?              → debugging-and-error-recovery
    ├── Reviewing completed work?         → review-work
    │   ├── Too complex?                  → code-simplification
    │   ├── Security concerns?            → security-and-hardening
    │   └── Performance concerns?         → performance-optimization
    ├── Committing / releasing?           → git-workflow-and-versioning
    ├── Making a decision?                → log-decision
    └── Deploying to production?          → shipping-and-launch
```

**If a task matches a skill, use it.** Don't implement directly if a skill applies. Skills encode the workflows that prevent common mistakes.

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
| Mark task done | `#sdlcTodoToggle` | ❌ Don't manually edit checkboxes in todo.md |
| Log decision | `#sdlcDecision` | ❌ Don't manually create `decisions/` files |
| Create release | `#sdlcRelease` | ❌ Don't manually create `releases/` files |

## What You CAN Edit Directly (after tools create the structure)

- `.sdlc/context/architecture.md` — system design
- `.sdlc/context/conventions.md` — coding standards
- `.sdlc/work/active/<id>/spec.md` — feature specification (What/Why/AC/Testing/Boundaries)
- `.sdlc/work/active/<id>/plan.md` — implementation plan (approach, architecture decisions)
- `.sdlc/work/active/<id>/todo.md` — task checklist (checkboxes)

## What You Should NEVER Edit Directly

- `.sdlc/manifest.json`, `.sdlc/index/*.json` — managed by tools
- `.sdlc/work/active/<id>/todo.md` checkboxes — use `#sdlcTodoToggle` to keep counters in sync

## Core Behaviors (Always Active)

### Test After Every Task
After implementing any task, you MUST:
1. Run the test suite (use the test command from `.sdlc/context/conventions.md`)
2. Run the build (use the build command from `.sdlc/context/conventions.md`)
3. **Call `#sdlcTodoToggle` to mark the task done** — this toggles the checkbox in todo.md AND syncs the dashboard
4. Report results in the task review summary

**If tests fail, fix them BEFORE marking the task done.** Do NOT proceed with failing tests. Do NOT skip tests to move faster.

**CRITICAL: A task is NOT complete until `#sdlcTodoToggle` has been called.** If you skip this step, the dashboard shows 0% progress even though work is done. The user will see stale data. ALWAYS call it.

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

## Type-Aware Workflow

**Not every work type needs the same depth.** Match the workflow to the type:

| Type | spec.md | plan.md | todo.md | Workflow |
|------|---------|---------|---------|----------|
| **feature** (complex) | ✅ Full | ✅ Architecture | ✅ Tasks | SPEC → PLAN → BUILD → REVIEW |
| **feature** (small) | ⚠️ Light | ❌ Skip | ✅ Tasks | PLAN → BUILD → REVIEW |
| **bug** | ❌ Skip | ❌ Skip | ✅ Steps | BUILD → REVIEW |
| **refactor** | ❌ Skip | ⚠️ Maybe | ✅ Tasks | BUILD → REVIEW |
| **infrastructure** | ❌ Skip | ❌ Skip | ✅ Checklist | BUILD → REVIEW |
| **tech-debt** | ❌ Skip | ❌ Skip | ✅ Checklist | BUILD → REVIEW |
| **docs** | ❌ Skip | ❌ Skip | ✅ Checklist | BUILD → REVIEW |

**The todo.md is ALWAYS required.** Spec and plan are optional based on type.

### Full Workflow (features)

```
SPEC (features only — skip for bugs/infra/docs):
1. Gather requirements (interview-me skill or user description)

PLAN:
2. Create work item (#sdlcCreate)
3. Write spec.md (What/Why/AC — depth based on type)
4. Write plan.md (architecture — only for complex features)
5. Write todo.md (task breakdown — ALWAYS)
6. ⛔ STOP — Show plan to user — WAIT FOR APPROVAL

BUILD (repeat for each task — TDD is embedded here):
7.  Implement Task N
8.  Follow test-driven-development (RED → GREEN → REFACTOR)
9.  Run tests + build — fix if failing
10. Mark task done (#sdlcTodoToggle)
11. ⛔ STOP — Show changes + test results — WAIT FOR APPROVAL
12. Suggest commit — "git commit -m 'feat: ...'"
13. ... repeat for each task ...

REVIEW:
14. All tasks done — run full test suite
15. Use review-work skill (5-axis review)
16. ⛔ STOP — Show acceptance criteria verification — WAIT FOR APPROVAL

SHIP:
17. Complete work item (#sdlcComplete)
18. Suggest next action
```

### Lightweight Workflow (bugs, infra, refactor, docs)

```
1. Create work item (#sdlcCreate) with correct type
2. Write todo.md only (skip spec.md and plan.md)
3. ⛔ STOP — WAIT FOR APPROVAL
4. Implement tasks one by one (with TDD: RED → GREEN → REFACTOR)
5. Run tests after each task
6. Mark done (#sdlcTodoToggle)
7. ⛔ STOP after each task — WAIT FOR APPROVAL
8. When all done → quick review → #sdlcComplete
```
