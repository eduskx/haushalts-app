# workflow-kit

A reusable agent pipeline for Claude Code. Everything project-specific lives in the consuming project's `project.config.json`, so improving the kit improves every project.

## What is in it

| Path | Purpose | State |
|---|---|---|
| `agents/` | planner, implementer, reviewer, tester, auditor | ready |
| `skills/` | write-spec, split-tickets, module-contract, design-foundation, retro | ready |
| `hooks/` | Blocks dangerous commands and protected-path edits. Guards against accidents, not a security boundary | ready, tested |
| `schemas/` | Config schema and the JSON the agents must return | ready |
| `templates/` | CI, issue and PR templates, CLAUDE.md skeleton | ready |
| `cli/` | `wf`, the deterministic orchestrator | planned for phase 4 |

## How a ticket flows

```
wf next -> oldest `ready` issue by an allowed author
  -> worktree -> implementer -> wf check (scripts only, no tokens)
  -> red: back to implementer, at most limits.maxFixRounds
  -> wf pushes, opens PR, waits for CI
  -> reviewer (fresh context, diff and criteria only)
  -> tester if labelled ui
  -> wf sets status agent-review -> squash auto-merge
```

Agents never push, merge or set statuses. They return commits and JSON, and `wf` acts. Run agents somewhere without GitHub credentials or production secrets.

Diffs on `protectedPaths` or matching `destructiveSql` go to a human, whatever the reviewer says.

## Use it in another project

Until `wf init` exists:

1. Install the plugin. For one session: `claude --plugin-dir path/to/workflow-kit`. Permanently: `claude plugin marketplace add path/to/workflow-kit`, then `claude plugin install workflow-kit@workflow-kit-marketplace --scope project`.
2. Copy `templates/project.config.json` to the project root and fill it in.
3. Copy `templates/CLAUDE.md.tmpl` to `CLAUDE.md`.
4. Copy `templates/github/` to `.github/` and `templates/ci.yml` to `.github/workflows/ci.yml`, then adapt the commands.
5. Write the project's own module contract at `docs.moduleContract`.

Plugins cannot ship permissions, and plugin agents ignore `permissionMode` and their own hooks. So `wf` sets the mode on each `claude -p` call, and hooks live at plugin level.

## Rules for changing the kit

Nothing project-specific may enter this folder: no product names, stacks as hard requirements, or paths outside the config. If a change only makes sense for one project, it belongs in that project's config or docs.
