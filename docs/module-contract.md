# Modul-Vertrag dieses Projekts

Die allgemeinen Regeln stehen im Skill [`module-contract`](../workflow-kit/skills/module-contract/SKILL.md). Hier steht nur, was für dieses Projekt konkret gilt.

## Pakete

| Paket | Aufgabe | Darf importieren |
|---|---|---|
| `packages/kit/config` | tsconfig-, ESLint- und Tailwind-Presets | nichts |
| `packages/kit/core` | Fehlertypen, Zeit, IDs, Modul-Manifest | `config` |
| `packages/kit/ui` | Token-Vertrag, iOS-nahe Bausteine, kein festes Theme | `core` |
| `packages/kit/auth` | Login, Session | `core`, `ui` |
| `packages/kit/spaces` | Gruppe mit `max_members`, Einladungen, RLS-Vertrag | `core`, `auth`, `ui` |
| `packages/kit/sync` | Offline-Warteschlange, Refetch bei Rückkehr | `core` |
| `packages/kit/media` | Foto verkleinern, EXIF entfernen, privater Upload | `core` |
| `packages/kit/activity` | Aktivitäts-Tabelle, von Triggern befüllt | `core`, `spaces` |
| `packages/kit/notify` | Web-Push, ab Meilenstein 7 | `core` |
| `packages/features/*` | Fachmodule `avatar`, `lists`, `chores`, `checkin` | nur `packages/kit/*` |
| `apps/*` | Zusammenbau | alles aus `packages/` |

`packages/kit` importiert nie aus `packages/features`. `packages/` importiert nie aus `apps/`.

## Gesperrte Wörter in `packages/`

`couple`, `partner`, `paar`, `freundin`, `boyfriend`, `girlfriend`. Die Liste steht in `project.config.json`. Sie zwingt zu allgemeinen Begriffen: `space` und `member` statt Paar und Partner.

## RLS-Vertrag

`packages/kit/spaces` veröffentlicht in einem privaten Schema:

```sql
private.is_space_member(space_id uuid) returns boolean  -- SECURITY DEFINER, stable
```

Jede Tabelle eines Moduls hat eine Spalte `space_id` und baut ihre Policies auf dieser Funktion auf. Der Einzug läuft als atomarer RPC, damit `max_members` nicht überschritten werden kann. Fotos liegen in privaten Buckets, deren Policies auf `storage.objects` dieselbe Funktion nutzen.

## Migrationen

Ein Modul legt nummerierte SQL-Dateien in `migrations/` ab und ändert sie nach dem Merge nie mehr. Das Skript `pnpm db:install-modules` kopiert neue Dateien in Abhängigkeits-Reihenfolge nach `apps/<app>/supabase/migrations/` und stempelt sie beim Kopieren. CI vergleicht Hashes.

## Aktivitäten

Features schreiben Aktivitäten per DB-Trigger über `activity.record(...)`. Die spätere Gamification liest diese Tabelle nur und ändert kein Feature.

## Goldenes Beispiel

`packages/features/lists` ist nach Phase 3 die Vorlage. Baue neue Module nach seinem Muster.
