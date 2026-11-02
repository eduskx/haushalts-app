---
name: capture-idea
description: Records what the human mentions in passing, so nothing gets lost. Use whenever they drop a feature idea or a remark about how work should be done, even mid-task and even if they do not ask for it to be saved.
---

# Capture what is mentioned in passing

The human thinks out loud while other work is running. Capture it right away, keep working on the current task, and confirm in one line with a link.

## Decide what it is

**A product idea or wish:** create a tracker issue with the label `labels.idea`.
- Title: the idea in a few words.
- Body: what the human wants, in their words, plus anything already found out and open questions. No acceptance criteria yet.
- Search open issues first. If it extends an existing idea, add a comment to that issue instead.
- Never add the `labels.ready` label. Ideas do not enter the pipeline until the human promotes them through a spec.
- Tracker issues may be public. Leave out personal details such as names, banks or addresses.

**A remark about how we work:** change the workflow, do not just remember it.
- Applies to any project: edit `workflow-kit/`.
- Applies to this project only: edit `project.config.json` or the project's `CLAUDE.md`.
- These are protected paths, so open a pull request for the human. A pipeline agent cannot do this and reports it as blocked instead.
- If it is the cheaper option, enforce it with a script rather than a prompt line. See the `retro` skill for the order.

**Unsure which:** treat it as an idea and ask in one line whether it should also change the workflow.

## Do not

- Start building the idea.
- Stop the current task to discuss it, unless it changes that task.
- Ask for permission to record it. The human asked for this once, for all future cases.
