# Design Decisions (ADRs)

This folder stores short Architecture/Design Decision Records (ADRs) for product UX and system design choices.

Each decision should explain:
- Context: what problem we were solving
- Decision: what we chose
- Why: user experience rationale and engineering rationale
- Consequences: tradeoffs and follow-ups

## File naming

Use:

- YYYY-MM-DD-short-title.md

Example:

- 2025-12-31-host-navigation-hub-vs-create.md

## Template

Copy this template when writing a new decision:

---

# Decision: <short title>

- Date: YYYY-MM-DD
- Status: Proposed | Accepted | Implemented | Reversed
- Owners: <names>
- Related: <links to PRs/issues/docs>

## Context
What problem are we solving? What constraints exist? What is happening today?

## Decision
What are we doing (one or two sentences)? What is the user-facing behavior?

## Options considered
1. Option A: <name>
   - Pros:
   - Cons:
2. Option B: <name>
   - Pros:
   - Cons:

## Why this decision
Explain the reasoning. Include:
- User experience rationale
- Expected scale/load assumptions (if any)
- Engineering/maintenance rationale
- How this aligns with product goals

## Consequences
- Positive:
- Negative / tradeoffs:
- Follow-ups / next steps:

## Rollout plan
How we will ship it safely (flags, phased rollout, migration steps).

## Success metrics
How we will know it worked.

## Notes
Edge cases, future revisit conditions, and open questions.


