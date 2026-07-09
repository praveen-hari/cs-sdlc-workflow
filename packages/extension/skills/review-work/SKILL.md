---
name: review-work
description: 'Review completed work against acceptance criteria and get user approval to complete. Use when the user says "review", "verify", "check criteria", "are we done", or before completing a work item.'
argument-hint: 'Review the active work item or specify an ID'
---

# Review Work

## Procedure

### Step 1: Load Work Item
1. Read `.sdlc/work/active/<id>/brief.md` for acceptance criteria and boundaries
2. Read `.sdlc/work/active/<id>/plan.md` for task completion status
3. Read `.sdlc/context/conventions.md` for project standards

### Step 2: Check Plan Completion
Verify all tasks in `plan.md` are checked. If any remain, report them.

### Step 3: Five-Axis Review

Review the implementation across five dimensions. Label every finding with severity.

**Severity labels:**

| Prefix | Meaning | Author Action |
|--------|---------|---------------|
| **Critical:** | Blocks completion | Must fix before completing |
| *(no prefix)* | Required change | Should fix before completing |
| **Nit:** | Minor, optional | Can ignore — formatting, style |
| **Optional:** | Suggestion | Worth considering but not required |

#### Axis 1: Correctness
- Does the code match the acceptance criteria?
- Are edge cases handled (null, empty, boundary values)?
- Are error paths handled (not just the happy path)?
- Do tests exist and pass? Are they testing the right things?

#### Axis 2: Readability
- Are names descriptive and consistent with project conventions?
- Is the control flow straightforward?
- Could this be done in fewer lines? (1000 lines where 100 suffice is a failure)
- Are abstractions earning their complexity?

#### Axis 3: Architecture
- Does the change follow existing patterns or introduce a new one? If new, is it justified?
- Does it maintain clean module boundaries?
- Is there code duplication that should be shared?
- Are dependencies flowing in the right direction?

#### Axis 4: Security
- Is user input validated and sanitized?
- Are secrets kept out of code, logs, and version control?
- Is authentication/authorization checked where needed?
- Are SQL queries parameterized (no string concatenation)?
- Are outputs encoded to prevent XSS?

#### Axis 5: Performance
- Any N+1 query patterns?
- Any unbounded loops or unconstrained data fetching?
- Any synchronous operations that should be async?
- Any missing pagination on list endpoints?

### Step 4: Verify Each Acceptance Criterion

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

### Step 5: Check for Dead Code

After any implementation, check for orphaned code:
```
DEAD CODE IDENTIFIED:
- formatLegacyDate() in src/utils/date.ts — replaced by formatDate()
- OldTaskCard component in src/components/ — replaced by TaskCard
→ Safe to remove these?
```

Don't leave dead code lying around. But don't silently delete things you're not sure about — ask first.

### Step 6: Run Verification Suite
1. **Tests pass:** Run the test suite
2. **Build succeeds:** Run the build
3. **Typecheck passes:** Run typecheck (if TypeScript)
4. **No lint errors:** Run linter

### Step 7: ⛔ STOP — COMPLETION APPROVAL REQUIRED

Show the full verification report:

```
📋 Work Item Review: <title>

## Plan Status
Tasks: Y/Y complete ✅

## Five-Axis Review
- Correctness: <findings or ✅ clean>
- Readability: <findings or ✅ clean>
- Architecture: <findings or ✅ clean>
- Security: <findings or ✅ clean>
- Performance: <findings or ✅ clean>

## Acceptance Criteria: X/Y met
<verification details>

## Verification
- Tests: ✅ passing
- Build: ✅ clean
- Typecheck: ✅ clean

<If all criteria met and no Critical findings>
All acceptance criteria are met. Ready to complete this work item?
- Say **"complete"** to archive the work item
- Or tell me what needs fixing

<If some criteria failed or Critical findings exist>
Issues found that should be addressed:
- <Critical/Required findings>

Would you like me to:
- Fix the issues?
- Complete anyway?
- Abandon with `#sdlcAbandon`?
```

**⛔ STOP HERE. Do NOT call #sdlcComplete until the user explicitly says "complete", "done", "approve".**

### Step 8: Complete (only after approval)
Once user approves, use `#sdlcComplete` tool to archive the work item.

## Key Rules
- NEVER complete a work item without user approval
- Be honest — don't mark criteria as passed if they're not
- Don't rubber-stamp. "All good" without evidence of review helps no one
- Don't soften real issues. "This might be a minor concern" when it's a bug is dishonest
- Quantify problems when possible. "This N+1 query will add ~50ms per item" beats "this could be slow"
- If criteria fail, offer to fix them or offer to abandon with `#sdlcAbandon`
- Only use `#sdlcComplete` after explicit user approval
- Only use `#sdlcAbandon` after explicit user confirmation

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It works, that's good enough" | Working code that's unreadable, insecure, or architecturally wrong creates debt that compounds. |
| "The tests pass, so it's good" | Tests are necessary but not sufficient. They don't catch architecture problems, security issues, or readability concerns. |
| "AI-generated code is probably fine" | AI code needs MORE scrutiny, not less. It's confident and plausible, even when wrong. |
| "We'll clean it up later" | Later never comes. The review is the quality gate — use it. |
| "It's only a small change" | Small changes can introduce security vulnerabilities, performance regressions, or architectural drift. Review everything. |

## Red Flags
- "LGTM" without evidence of actual review
- Security-sensitive changes without security-focused review
- No regression tests with bug fix work items
- Accepting "I'll fix it later"
- Criteria marked as passed without checking the actual implementation

## See Also
- For detailed security review, see the `security-and-hardening` skill
- For performance review, see the `performance-optimization` skill
- For code simplification, see the `code-simplification` skill
