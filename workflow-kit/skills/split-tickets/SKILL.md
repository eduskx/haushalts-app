---
name: split-tickets
description: Splits an approved milestone into small, independently mergeable tickets. Use when planning implementation of a milestone.
---

# Split into tickets

Agents work best on small, unambiguous tickets, and small tickets are cheap to retry.

## A good ticket

- Fits within `limits.maxDiffLines` lines of diff, tests excluded.
- Can merge alone and leaves the main branch working.
- Touches one module. Kit changes needed by a feature get their own earlier ticket.
- Says what must be true afterwards, not how to build it.
- Has criteria that decide yes or no, with concrete inputs and outcomes.

## How to split

1. Start with the thinnest path a user can walk end to end, then widen it.
2. Put schema and access rules first, with their tests.
3. Put anything risky or unknown early, as a small ticket that proves it.
4. Separate things that can fail for different reasons.
5. Mark `dependsOn` only for real dependencies.

## Signs a ticket is wrong

- "and" in the title
- A criterion such as "works correctly" or "looks good"
- Two feature modules involved
- It only makes sense together with the next ticket
- The criteria require reading the implementation to judge

A ticket that needs human taste gets `needsHuman: true`, with what the human should look at.
