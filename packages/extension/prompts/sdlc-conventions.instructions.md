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

## Workflow with Approval Gates

```
1. Create work item (#sdlcCreate)
2. Write brief + plan
3. ⛔ STOP — Show plan to user — WAIT FOR APPROVAL
4. Implement Task 1
5. Mark task done (#sdlcPlanToggle)
6. ⛔ STOP — Show changes — WAIT FOR APPROVAL
7. Implement Task 2
8. Mark task done (#sdlcPlanToggle)
9. ⛔ STOP — Show changes — WAIT FOR APPROVAL
10. ... repeat for each task ...
11. All tasks done
12. ⛔ STOP — Verify acceptance criteria — WAIT FOR APPROVAL
13. Complete work item (#sdlcComplete)
```
