---
name: log-decision
description: 'Log an architectural or technical decision as an ADR. Use when the user makes a significant decision, says "decide", "log decision", "ADR", "should we use X or Y".'
argument-hint: 'Describe the decision or the alternatives being considered'
---

# Log Decision

## When to Write an ADR
- Choosing a framework, library, or major dependency
- Designing a data model or database schema
- Selecting an authentication strategy
- Deciding on an API architecture (REST vs. GraphQL vs. tRPC)
- Choosing between build tools, hosting platforms, or infrastructure
- Any decision that would be **expensive to reverse**

**When NOT to write an ADR:** Trivial choices (variable naming, formatting), decisions already covered by conventions.md, or choices that are easily reversible.

## Procedure

### Step 1: Understand the Decision
If not fully described, ask: "What decision needs to be made?" and "What are the alternatives?"

### Step 2: Analyze Alternatives
For each alternative, provide a structured analysis:

```
### Alternative A: PostgreSQL
- Pros: ACID compliance, relational model fits our data, team experience, JSON support
- Cons: More complex setup than SQLite, requires managed hosting
- Effort: Medium — Prisma ORM handles migrations
- Fit: Strong — our data is inherently relational

### Alternative B: MongoDB
- Pros: Flexible schema, easy to start with
- Cons: Our data is relational; would need to manage relationships manually
- Effort: Low initial, high ongoing (manual joins, data duplication)
- Fit: Weak — relational data in a document store leads to complexity

### Alternative C: SQLite
- Pros: Zero configuration, embedded, fast for reads
- Cons: Limited concurrent write support, no managed hosting
- Effort: Low
- Fit: Weak — not suitable for multi-user web application
```

### Step 3: ⛔ CONFIRM BEFORE RECORDING

Show the proposed decision with full context:
```
📝 Decision Record

**Title:** Use PostgreSQL over MongoDB
**Context:** Need a database for user data with complex queries and relationships
**Decision:** PostgreSQL 16 with Prisma ORM

**Alternatives Considered:**
- MongoDB — rejected: relational data in document store leads to complexity
- SQLite — rejected: not suitable for multi-user web application

**Rationale:** Team experience, ACID compliance, JSON support, strong Prisma ecosystem

**Consequences:**
- Prisma provides type-safe database access and migration management
- We can use PostgreSQL's full-text search instead of adding Elasticsearch
- Team needs PostgreSQL knowledge (standard skill, low risk)
- Hosting on managed service (Supabase, Neon, or RDS)

Record this decision? Say "yes" to save or tell me what to change.
```

**⛔ STOP. Wait for user confirmation before recording.**

### Step 4: Record (only after confirmation)
Use `#sdlcDecision` tool with title, context, decision, and rationale.

### Step 5: Update Context (if needed)
If the decision changes the system architecture, update `.sdlc/context/architecture.md`.
If it changes coding standards, update `.sdlc/context/conventions.md`.

## Key Rules
- ALWAYS confirm with user before recording
- ALWAYS include alternatives considered — future developers need to know what was rejected and why
- ALWAYS include consequences — what follows from this decision
- Include rationale — future developers and agents need to understand WHY
- Not every choice needs an ADR — only significant, hard-to-reverse decisions
- Don't delete old ADRs — they capture historical context. When a decision changes, write a new ADR that supersedes the old one.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This decision is obvious" | Obvious decisions still have alternatives. Document why the obvious choice was made — it won't be obvious to everyone. |
| "ADRs are overhead" | A 10-minute ADR prevents a 2-hour debate about the same decision six months later. |
| "We can always change it later" | That's exactly why you need the ADR — so the person changing it later understands the original constraints. |
| "The code speaks for itself" | Code shows WHAT was built. It doesn't show WHY this approach was chosen over alternatives. |

## Red Flags
- Architectural decisions with no written rationale
- Decisions recorded without alternatives considered
- Missing consequences section
- Recording trivial decisions that don't warrant an ADR
- Silently making decisions without user confirmation

## See Also
- For detailed ADR patterns, see the `documentation-and-adrs` skill
