---
name: log-decision
description: 'Log an architectural or technical decision as an ADR. Use when the user makes a significant decision, says "decide", "log decision", "ADR", "should we use X or Y".'
argument-hint: 'Describe the decision or the alternatives being considered'
---

# Log Decision

## Procedure

### Step 1: Understand the Decision
If not fully described, ask: "What decision needs to be made?" and "What are the alternatives?"

### Step 2: Analyze Options
For each alternative, discuss pros, cons, effort, and fit with existing architecture.

### Step 3: ⛔ CONFIRM BEFORE RECORDING

Show the proposed decision:
```
📝 Decision Record

**Title:** Use PostgreSQL over MongoDB
**Context:** Need a database for user data with complex queries
**Decision:** PostgreSQL 16 with Prisma ORM
**Rationale:** Team experience, ACID compliance, JSON support

Record this decision? Say "yes" to save or tell me what to change.
```

**⛔ STOP. Wait for user confirmation before recording.**

### Step 4: Record (only after confirmation)
Use `#sdlcDecision` tool. Update architecture.md if the decision changes the system.

## Key Rules
- Always confirm with user before recording
- Include rationale — future developers need to understand WHY
- Not every choice needs an ADR — only significant, hard-to-reverse decisions
