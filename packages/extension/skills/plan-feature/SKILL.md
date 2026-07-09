---
name: plan-feature
description: 'Plan a new feature with requirements, acceptance criteria, and implementation tasks. Use when the user wants to build something new, says "new feature", "I want to build", "plan", "start feature", or describes a feature idea.'
argument-hint: 'Describe the feature you want to build'
---

# Plan Feature

## Procedure

### Step 1: Understand the Idea
- Read `.sdlc/context/architecture.md` and `.sdlc/context/conventions.md`
- Ask clarifying questions if the idea is vague
- **Surface assumptions immediately.** Before writing any spec content, list what you're assuming:

```
ASSUMPTIONS I'M MAKING:
1. This is a web application (not native mobile)
2. Authentication uses session-based cookies (not JWT)
3. The database is PostgreSQL (based on existing Prisma schema)
→ Correct me now or I'll proceed with these.
```

Don't silently fill in ambiguous requirements. The brief's entire purpose is to surface misunderstandings *before* code gets written.

- **Reframe vague requirements as success criteria:**

```
REQUIREMENT: "Make the dashboard faster"

REFRAMED SUCCESS CRITERIA:
- Dashboard LCP < 2.5s on 4G connection
- Initial data load completes in < 500ms
→ Are these the right targets?
```

### Step 2: Create Work Item
Use `#sdlcCreate` tool with title, type, and priority.

### Step 3: Write Brief
Edit `brief.md` covering these sections:

1. **What** — What are we building? One paragraph.
2. **Why** — What problem does this solve? Who benefits?
3. **Acceptance Criteria** — Specific, testable conditions (pass/fail). Each criterion must be verifiable.
4. **Testing Strategy** — How will each criterion be verified? (unit test, integration test, manual check)
5. **Scope** — What's IN and what's OUT.
6. **Boundaries:**
   - **Always do:** Follow conventions, run tests, validate inputs
   - **Ask first:** Schema changes, new dependencies, API changes
   - **Never do:** Skip tests, hardcode secrets, break existing features

### Step 4: Write Plan
Edit `plan.md` with ordered task breakdown.

**Map the dependency graph first:**
```
Database schema
    ├── API types/models
    │       ├── API endpoints
    │       │       └── Frontend API client
    │       │               └── UI components
    │       └── Validation logic
    └── Seed data / migrations
```

**Slice vertically, not horizontally:**
```
✗ BAD: Task 1: Build all DB schema → Task 2: Build all API → Task 3: Build all UI
✓ GOOD: Task 1: User can create (schema + API + UI) → Task 2: User can list → Task 3: User can edit
```

**Task sizing guide:**

| Size | Files | Scope | Action |
|------|-------|-------|--------|
| **XS** | 1 | Single function or config | ✅ Good |
| **S** | 1-2 | One component or endpoint | ✅ Good |
| **M** | 3-5 | One feature slice | ✅ Good |
| **L** | 5-8 | Multi-component feature | ⚠️ Consider splitting |
| **XL** | 8+ | Too large | 🔴 MUST split further |

Each task must have:
- A short descriptive title
- Acceptance criteria (what must be true when done)
- Verification step (test command, build check, or manual check)
- Files likely touched

**Add checkpoints** between major phases:
```
## Checkpoint: After Tasks 1-3
- [ ] All tests pass
- [ ] Application builds without errors
- [ ] Core user flow works end-to-end
```

### Step 5: ⛔ STOP — PLAN APPROVAL REQUIRED

Show the complete plan to the user:

```
📋 Work Item Created: <id>

## Assumptions
<list assumptions made>

## Brief
**What:** <description>
**Why:** <motivation>

## Acceptance Criteria
- [ ] Criterion 1 → verified by: <test/check>
- [ ] Criterion 2 → verified by: <test/check>
- [ ] Criterion 3 → verified by: <test/check>

## Boundaries
- Always: <rules>
- Ask first: <rules>
- Never: <rules>

## Implementation Plan (N tasks, estimated size: S/M/L)
1. Task 1: <description> [S]
2. Task 2: <description> [M]
3. ── Checkpoint: verify core flow ──
4. Task 3: <description> [S]

Does this plan look right?
- Say **"approved"** to start implementing
- Or tell me what to change
```

**⛔ STOP HERE. Do NOT start implementing until the user explicitly approves the plan.**

If the user requests changes:
1. Make the changes to brief.md and plan.md
2. Show the updated plan
3. Ask for approval again
4. Repeat until approved

### Step 6: Only After Approval
Once the user says "approved", "yes", "looks good", "proceed", or similar — THEN hand off to the implement-task skill.

## Key Rules
- NEVER start coding before plan approval
- Acceptance criteria must be testable (pass/fail)
- Every criterion must have a verification method
- Tasks ordered by dependency (build foundations first)
- Each task completable in one session (S or M size)
- XL tasks MUST be broken down further
- Vertical slices over horizontal layers

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This is simple, I don't need a plan" | Simple tasks don't need *long* plans, but they still need acceptance criteria. A two-line brief is fine. |
| "I'll figure it out as I go" | That's how you end up with rework. 10 minutes of planning saves hours. |
| "The tasks are obvious" | Write them down anyway. Explicit tasks surface hidden dependencies and forgotten edge cases. |
| "The user knows what they want" | Even clear requests have implicit assumptions. The brief surfaces those assumptions. |
| "I'll add tests later" | Tests written after the fact test implementation, not behavior. Define the testing strategy now. |
| "Let me just start coding" | Code without a plan is guessing. The plan is the contract between you and the user. |

## Red Flags
- Starting to write code without any written requirements
- Tasks that say "implement the feature" without acceptance criteria
- No verification steps in the plan
- All tasks are XL-sized
- No checkpoints between tasks
- Dependency order isn't considered
- Acceptance criteria that aren't testable ("make it good")
