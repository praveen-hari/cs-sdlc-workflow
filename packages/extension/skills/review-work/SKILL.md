---
name: review-work
description: 'Review completed work against acceptance criteria and get user approval to complete. Use when the user says "review", "verify", "check criteria", "are we done", or before completing a work item.'
argument-hint: 'Review the active work item or specify an ID'
---

# Review Work

## Procedure

### Step 1: Load Work Item
1. Read `.sdlc/work/active/<id>/brief.md` for acceptance criteria
2. Read `.sdlc/work/active/<id>/plan.md` for task completion status

### Step 2: Check Plan Completion
Verify all tasks in `plan.md` are checked. If any remain, report them.

### Step 3: Verify Each Acceptance Criterion

For each criterion in `brief.md`, check the implementation and report:

```
## Acceptance Criteria Verification

✅ Criterion 1: Toggle button in header
   → Implemented in src/components/ThemeToggle.tsx

✅ Criterion 2: Preference saved in localStorage
   → Implemented in src/hooks/useTheme.ts

❌ Criterion 3: Respects OS preference on first visit
   → NOT IMPLEMENTED — missing prefers-color-scheme check

✅ Criterion 4: Smooth CSS transition
   → Implemented in src/styles/theme.css

Result: 3/4 criteria met
```

### Step 4: ⛔ STOP — COMPLETION APPROVAL REQUIRED

Show the full verification report:

```
📋 Work Item Review: <title>

Tasks: Y/Y complete ✅
Acceptance Criteria: X/Y met

<verification details above>

<If all criteria met>
All acceptance criteria are met. Ready to complete this work item?
- Say **"complete"** to archive the work item
- Or tell me what needs fixing

<If some criteria failed>
Some criteria are not met. Would you like me to:
- Fix the failing criteria?
- Complete anyway?
- Or make other changes?
```

**⛔ STOP HERE. Do NOT call #sdlcComplete until the user explicitly says "complete", "done", "approve".**

### Step 5: Complete (only after approval)
Once user approves, use `#sdlcComplete` tool to archive the work item.

## Key Rules
- NEVER complete a work item without user approval
- Be honest — don't mark criteria as passed if they're not
- If criteria fail, offer to fix them
- Only use `#sdlcComplete` after explicit user approval
