---
name: retro
description: Evaluates a finished milestone's pipeline data and proposes concrete improvements to the workflow kit. Use at the end of each milestone.
---

# Retro

The kit gets better here, and every project benefits. Base this on data, not impressions.

1. Collect for the milestone: tickets, share merged without human input, fix rounds per ticket, `needs-human` cases and why, review findings by category, and cost per ticket.
2. Find what repeats. One failure is an incident. Two of the same kind point to a cause.
3. For each repeat, choose the cheapest effective fix, in this order:
   - A script check, which costs no tokens and cannot forget
   - A template or better example
   - A clearer ticket rule
   - A prompt change, and only then
4. Sort each fix: does it belong in `workflow-kit/` for all projects, or in this project's config and docs? Do not put project details in the kit.
5. Also propose removals: rules nothing ever triggers, and agent steps that never find anything. Every prompt line costs tokens on every run.

Report to the human in `project.language`: the numbers, the top three proposals with expected effect, and removals. Changes to the kit are protected paths and need human approval, so prepare them as a separate pull request.
