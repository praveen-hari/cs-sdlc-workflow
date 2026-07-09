---
name: review-work
description: 'Review completed work against acceptance criteria and conventions. Use when the user says "review", "verify", "check criteria", "are we done", "is this ready", or before completing a work item.'
argument-hint: 'Review the active work item or specify an ID'
---

# Review Work

## When to Use
- All tasks in plan.md are completed
- User says "review", "verify", "check", "are we done"
- Before marking a work item as complete

## Procedure

### Step 1: Load Work Item

1. Read `.sdlc/index/work.json` to find the active work item
2. Read `.sdlc/work/active/<id>/brief.md` for acceptance criteria
3. Read `.sdlc/work/active/<id>/plan.md` for task completion status
4. Read `.sdlc/context/conventions.md` for coding standards

### Step 2: Check Plan Completion

Verify all tasks in `plan.md` are checked (`- [x]`). If any are unchecked, report which tasks remain.

### Step 3: Verify Acceptance Criteria

For each acceptance criterion in `brief.md`:
1. Determine how to verify (code inspection, test run, visual check)
2. Check the implementation
3. Report: ✅ pass / ❌ fail / ⚠️ partial

Format:
```
## Acceptance Criteria Verification

✅ Criterion 1 — description
✅ Criterion 2 — description
❌ Criterion 3 — what's missing
⚠️ Criterion 4 — partially met, needs X

Result: 3/4 criteria met
```

### Step 4: Convention Check

Review changed files against `.sdlc/context/conventions.md`:
- Naming conventions followed?
- Error handling patterns correct?
- Test coverage adequate?

### Step 5: Report

Provide a summary:
- Criteria met / total
- Convention compliance
- Any issues found
- Recommendation: approve, fix issues, or needs more work

### Step 6: Complete or Fix

If all criteria met:
- Suggest using `#sdlcComplete` tool to archive the work item

If issues found:
- List specific fixes needed
- Offer to implement the fixes

## Key Rules
- Read the brief's acceptance criteria — they are the source of truth
- Every criterion must be verifiable (pass/fail)
- Be honest — don't mark criteria as passed if they're not
- Check conventions — code quality matters
- Use `#sdlcComplete` tool only when ALL criteria are met
