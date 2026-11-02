---
name: write-spec
description: Writes or refines a product spec with milestones and testable conditions for human approval. Use when starting a project or preparing the next milestone.
---

# Write a spec

The spec is where a human decides. It should make their decisions easy and leave nothing for agents to guess.

1. Ask the human everything that changes what gets built, before writing. Offer a recommendation with each question. Do not ask what you can find out yourself.
2. Write to `docs.spec`, in `project.language`.

A spec contains:
- **Goal:** one or two sentences about who can do what afterwards.
- **Not included:** what was consciously left out, so nobody adds it. Later features go here so they are not lost.
- **Milestones:** each usable on its own, in order of risk. Prove the riskiest assumption first.
- **Conditions per milestone:** each decidable with yes or no. Cover empty, offline, failure and foreign-tenant cases where they apply.
- **Gates:** where a human must look, because no script can judge it, such as taste or real-device behaviour.
- **Open questions:** each with your recommendation, and which milestone it blocks.

Describe behaviour, not implementation. Architecture decisions go into an ADR in `docs.adrDir`, with context, decision, what was rejected, and consequences.

Stop when the human has approved the milestone. Tickets come only after that, using `split-tickets`.
