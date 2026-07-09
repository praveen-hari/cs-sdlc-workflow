---
name: log-decision
description: 'Log an architectural or technical decision as an ADR. Use when the user makes a significant decision, says "decide", "log decision", "ADR", "should we use X or Y", or when choosing between alternatives during implementation.'
argument-hint: 'Describe the decision or the alternatives being considered'
---

# Log Decision

## When to Use
- User makes a significant technical decision
- User chooses between alternatives (e.g., "should we use PostgreSQL or MongoDB?")
- User says "decide", "log decision", "ADR", "record this decision"
- During implementation when an architectural choice is made

## Procedure

### Step 1: Understand the Decision

If the user hasn't fully described the decision, ask:
- "What decision needs to be made?"
- "What are the alternatives?"
- "What are the constraints?"

### Step 2: Analyze Options

For each alternative, discuss:
- **Pros**: What's good about this option
- **Cons**: What's bad or risky
- **Effort**: How much work to implement
- **Fit**: How well it fits the existing architecture

Read `.sdlc/context/architecture.md` to understand the current system.

### Step 3: Record the Decision

Use the `#sdlcDecision` tool:

```
Tool: #sdlcDecision
Input: {
  "title": "<Decision title>",
  "context": "<What prompted this decision>",
  "decision": "<What was decided>",
  "rationale": "<Why this option was chosen over alternatives>",
  "status": "accepted"
}
```

### Step 4: Update Architecture (if needed)

If the decision affects the system architecture, edit `.sdlc/context/architecture.md` directly to reflect the change.

### Step 5: Confirm

Show the recorded decision to the user with the assigned ID.

## Key Rules
- Use `#sdlcDecision` tool — it handles auto-incrementing IDs and index updates
- Include rationale — future developers need to understand WHY
- Reference alternatives that were considered and rejected
- Update architecture.md if the decision changes the system design
- Not every choice needs an ADR — only significant, hard-to-reverse decisions
