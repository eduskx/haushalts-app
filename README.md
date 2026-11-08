# haushalts-app

Cozy Haushalts-App für Paare als PWA, und ein wiederverwendbarer Baukasten aus App-Modulen und Agenten-Workflow.

Status: the monorepo, `packages/kit/config`, `packages/kit/core`, the app shell in `apps/web` and the local Supabase with pgTAP are in place. `packages/features` and `apps/demo-wg` do not exist yet.

## Setup and run

Needs Node 26 (see `.nvmrc`), pnpm 10 and, for the database, Docker and the Supabase CLI.

- `pnpm install`: install all workspaces.
- `pnpm --filter web dev`: start the app with Vite.
- `pnpm --filter web build`: build the app into `apps/web/dist`.
- `pnpm check`: typecheck, lint, tests and the module rules for the whole repo. `pnpm check:affected` does the same only for changed packages and their dependents.

- Regeln für Agenten und Menschen: [CLAUDE.md](CLAUDE.md)
- Was gebaut wird: [docs/specs/v1.md](docs/specs/v1.md)
- Warum so: [docs/adr/](docs/adr/)
- Modulgrenzen: [docs/module-contract.md](docs/module-contract.md)
- Workflow in andere Projekte mitnehmen: [workflow-kit/README.md](workflow-kit/README.md)

## Local database

Local Supabase is for development and tests only. Needs Docker and the Supabase CLI.

- `pnpm db:start` / `pnpm db:stop`: start or stop the local stack (copy URL and anon key into `apps/web/.env`, see `apps/web/.env.example`).
- `pnpm db:test`: run the pgTAP tests in `apps/web/supabase/tests/`.
- `pnpm db:install-modules`: copy new migrations from `packages/kit/*/migrations/` into `apps/web/supabase/migrations/` with a timestamp prefix. Copied files are pinned in `apps/web/supabase/modules.lock.json`; `pnpm check` fails if a pinned migration changes. Add a new migration instead.
