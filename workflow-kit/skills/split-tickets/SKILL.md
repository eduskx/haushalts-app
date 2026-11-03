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

## What the human must do

Sort each human touchpoint by when it happens. The `intake` skill collects the first two before the run.

- **A decision before the start:** add it to `humanInput` as a question with options. Check the docs first, and do not ask what they already decide.
- **Work only a human can do**, such as accounts or a test on a device: set `humanGate: "task"`. Keep it separate from tickets agents can run.
- **A judgement of the result**, such as taste: set `humanGate: "review"` and say in `humanReviewFocus` what to look at.
- **A change to protected paths or destructive SQL:** nothing to set. The orchestrator sees it in the diff and leaves the merge to the human.
