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
| Log decision | `#sdlcDecision` | ❌ Don't manually create `decisions/` files |

## What You CAN Edit Directly (after tools create the structure)

- `.sdlc/context/architecture.md` — system design
- `.sdlc/context/conventions.md` — coding standards
- `.sdlc/work/active/<id>/brief.md` — work item requirements
- `.sdlc/work/active/<id>/plan.md` — task checklist (`- [ ]` → `- [x]`)

## What You Should NEVER Edit Directly

- `.sdlc/manifest.json`, `.sdlc/index/*.json` — managed by tools

## Workflow with Approval Gates

```
1. Create work item (#sdlcCreate)
2. Write brief + plan
3. ⛔ STOP — Show plan to user — WAIT FOR APPROVAL
4. Implement Task 1
5. ⛔ STOP — Show changes — WAIT FOR APPROVAL
6. Implement Task 2
7. ⛔ STOP — Show changes — WAIT FOR APPROVAL
8. ... repeat for each task ...
9. All tasks done
10. ⛔ STOP — Verify acceptance criteria — WAIT FOR APPROVAL
11. Complete work item (#sdlcComplete)
```
