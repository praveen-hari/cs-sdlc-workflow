---
name: interview-me
description: 'Extracts what the user actually wants through one-question-at-a-time interview until ~95% confidence. Use when an ask is underspecified ("build me X" without "for whom" or "why now"), when the user says "interview me", "grill me", or when you catch yourself silently filling in ambiguous requirements.'
argument-hint: 'Describe what you want to build, or say "interview me"'
---

# Interview Me

## Overview

What people ask for and what they actually want are different things. They ask for "a dashboard" because that's what one asks for, not because a dashboard solves their problem. They say "make it faster" without a number to hit.

This skill closes the gap before it costs anything. Ask one question at a time, with your best guess attached, until you can predict what the user is going to say before they say it.

## When to Use

- The ask is missing at least one of: **who** the user is, **why** they want it, what **success** looks like
- The request is conventional rather than specific ("build me X", "make it faster")
- You're tempted to start with assumptions you haven't surfaced
- The user explicitly invokes: "interview me", "grill me", "before we start, are we sure?"

**When NOT to use:**
- The ask is unambiguous and self-contained ("rename this variable", "fix this typo")
- Pure information requests ("how does X work?")
- The user has explicitly asked for speed over verification

## Procedure

### Step 1: Hypothesize with a Confidence Number

Before asking anything, write down your current best read in **one sentence**, plus an honest confidence number (0–100%):

```
HYPOTHESIS: You want a way to answer "how are we doing?" in standup, and "dashboard" was the convention that came to mind.
CONFIDENCE: ~30% — missing: who it's for, what "metrics" means in context, and what success looks like.
```

When confidence is below ~70%, append a brief reason — what's still unresolved. This tells the user exactly what the interview needs to surface.

### Step 2: Ask One Question at a Time, Each with a Guess

Format:
```
Q: <one focused question>
GUESS: <your hypothesis for the answer, with the reasoning that produced it>
```

**⛔ Wait for the user to react before asking the next question.**

**Why one at a time:**
- The user can't react to your hypotheses if you bury them in a list
- Batches encourage skim-reading and surface answers
- The third question often depends on the answer to the first

**Why attach a guess:**
- The user reacts faster to a wrong guess than they generate an answer from scratch
- It surfaces YOUR assumptions, which is what the interview is meant to expose

### Step 3: Listen for "Want vs. Should Want"

Watch for answers that pattern-match best-practice talk rather than what they actually want:
- "I want it to be scalable" (without specifics)
- "The standard approach" / "the way most apps do it"
- "I should probably…" / "good engineering practice says…"
- Buzzwords as goals: "modern", "scalable", "robust"

When you hear these, ask:
> "If you didn't have to justify this to anyone, what would you actually want?"

### Step 4: Restate Intent in the User's Own Words

When confidence is high (~95%), write back what you now think the user wants. Keep it tight, use their language:

```
Here's what I now think you want:

- Outcome:      <one line — what they're building>
- User:         <one line — who benefits>
- Why now:      <one line — what changed or what's the trigger>
- Success:      <one line — how we know it worked>
- Constraint:   <one line — the binding limit>
- Out of scope: <one line — what we're explicitly NOT doing>

Yes / no / refine?
```

Including "Out of scope" is non-negotiable. Half of misalignment is silent disagreement about what is *not* being built.

### Step 5: Confirm — Explicit Yes, Not "Whatever You Think"

The gate is an **explicit "yes."** The following are NOT yes:

- **"Whatever you think is best."** → Re-ask with two concrete options framed as a choice
- **"Sounds good."** → Ask: "Anything you'd refine?"
- **"Sure, let's go."** → Ask: "Before we proceed — anything to change?"
- **Silence followed by "okay let's start."** → The user has given up, not converged. Ask if you've missed something.

If they correct you, fold the correction in and restate. Loop until you get an explicit yes.

### The 95% Confidence Stop

You're done when you can answer yes to this:

> *Can I predict the user's reaction to the next three questions I would ask?*

If yes, you have shared understanding. Stop interviewing and produce the restate.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The ask is clear enough" | If you can't write the user's desired outcome in one sentence right now, the ask isn't clear. Run Step 1 before deciding. |
| "Asking too many questions wastes their time" | 4–6 targeted questions take 5 minutes. Building the wrong thing takes days. |
| "I'll figure it out as I build" | Switching costs after code exists are 10x what they are now. |
| "They said 'whatever you think,' so I should just decide" | "Whatever you think" is delegation, not decision. Re-ask with two concrete options. |
| "I should give them several options to pick from" | Options work when the user knows what they want. They don't yet. Asking narrows; listing widens. |
| "We've talked enough, I get it" | Test it: can you predict their reaction to the next three questions? If not, you don't get it yet. |

## Red Flags
- Three or more questions in a single message (that's batching, not interviewing)
- A question without your hypothesis attached (that's surveying, not committing)
- Accepting "whatever you think is best" as a terminal answer
- Producing a spec, plan, or task list before the user has explicitly confirmed your restate
- The user gives a buzzword answer and you accept it without probing
- Three or more rounds without confidence visibly rising (you're asking the wrong questions)

## Verification

After applying interview-me:

- [ ] A hypothesis with confidence number was stated in the first turn
- [ ] Questions were asked one at a time, each with the agent's guess attached
- [ ] At least one "what would you actually want?" probe ran when the user gave a vague answer
- [ ] A concrete restate (Outcome/User/Why now/Success/Constraint/Out of scope) was written
- [ ] The user confirmed with an explicit yes (not "whatever you think", not "sounds good")
- [ ] At the stop point, the agent could predict reactions to the next three questions
