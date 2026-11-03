# workflow-kit

A reusable agent pipeline for Claude Code. Everything project-specific lives in the consuming project's `project.config.json`, so improving the kit improves every project.

## What is in it

| Path | Purpose | State |
|---|---|---|
| `agents/` | planner, implementer, reviewer, tester, auditor | ready |
| `skills/` | write-spec, split-tickets, intake, module-contract, design-foundation, retro, capture-idea | ready |
| `hooks/` | Blocks dangerous commands and protected-path edits. Guards against accidents, not a security boundary | ready, tested |
| `schemas/` | Config schema and the JSON the agents must return | ready |
| `templates/` | CI and PR templates, CLAUDE.md skeleton | ready |
| `cli/` | `wf`, the deterministic orchestrator | planned for phase 4 |

## How a ticket flows

```
intake (interactive) -> questions answered in the ticket
wf next -> oldest startable ticket by an allowed author
  -> worktree -> implementer -> wf check (scripts only, no tokens)
  -> red: back to implementer, at most limits.maxFixRounds
  -> wf pushes, opens PR, waits for CI
  -> reviewer (fresh context, diff and criteria only)
  -> tester if labelled ui
  -> wf sets status agent-review -> squash auto-merge
```

A ticket is startable when it is in the ready status, has neither `needsHuman` nor `humanTask`, and all its blockers are done.

## When the human is involved

| Label | Meaning | When | Pipeline |
|---|---|---|---|
| `needsHuman` | A question is open | Before the start | Skips it until answered |
| `humanTask` | Only a human can do it | Instead of a run | Never takes it |
| `humanReview` | The human judges the result | After the PR | Builds it, no auto-merge |

Run the `intake` skill before a pipeline run. It asks everything at once and stores the answers in the ticket, so unattended runs have no reason to stop. If an agent still hits an open question, `wf` writes it to the ticket's questions section and sets `needsHuman`, and the next intake round asks it. This return path arrives with `wf`.

Agents never push, merge or set statuses. They return commits and JSON, and `wf` acts. Run agents somewhere without GitHub or tracker credentials and without production secrets.

Tickets live in Linear, code and pull requests on GitHub. Linear is currently the only tracker adapter, and `tracker` in the config is where another one would plug in.

Diffs on `protectedPaths` or matching `destructiveSql` go to a human, whatever the reviewer says.

## Use it in another project

Until `wf init` exists:

1. Install the plugin. For one session: `claude --plugin-dir path/to/workflow-kit`. Permanently: `claude plugin marketplace add path/to/workflow-kit`, then `claude plugin install workflow-kit@workflow-kit-marketplace --scope project`.
2. Copy `templates/project.config.json` to the project root and fill it in.
3. Copy `templates/CLAUDE.md.tmpl` to `CLAUDE.md`.
4. Copy `templates/github/` to `.github/` and `templates/ci.yml` to `.github/workflows/ci.yml`, then adapt the commands. The template reads the Node version from `.nvmrc`.
5. Write the project's own module contract at `docs.moduleContract`.
6. In Linear, create the project and the labels named in the config, including `humanTask` and `humanReview`. Connect Linear to GitHub so that pull requests link to tickets.

Plugins cannot ship permissions, and plugin agents ignore `permissionMode` and their own hooks. So `wf` sets the mode on each `claude -p` call, and hooks live at plugin level.

## Rules for changing the kit

Nothing project-specific may enter this folder: no product names, stacks as hard requirements, or paths outside the config. If a change only makes sense for one project, it belongs in that project's config or docs.
