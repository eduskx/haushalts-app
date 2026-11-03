# ADR 0007: Automatisierung vorziehen, Agenten in einer Docker-Sandbox auf dem Mac

**Status:** angenommen, 2026-11-03. Ändert den Laufort aus ADR 0004 und die Reihenfolge der Meilensteine.

**Kontext:** Der Nutzer will die Prozesse so schnell wie möglich automatisieren. Der Orchestrator `wf` war für Phase 4 geplant, also nach M1 und den Listen. ADR 0004 und ADR 0006 gehen außerdem von Windows mit WSL2 aus, entwickelt wird inzwischen auf einem Mac.

**Entscheidung:**
- `wf` wird direkt nach CI und Branch-Schutz gebaut, also vor dem Rest von M1. Die verbleibenden M1-Tickets laufen bereits durch die Pipeline.
- `wf` läuft auf dem Mac und hält die Tokens. Agenten laufen in einer Docker-Sandbox ohne GitHub- und Linear-Token und ohne Produktions-Secrets. Das ersetzt die WSL2-Distribution, die Vertrauensgrenze aus ADR 0004 bleibt.
- Auch `wf check` führt von Agenten geschriebenen Code aus und läuft deshalb nie in einer Umgebung mit Tokens.
- Es gilt Auto-Merge wie in ADR 0004. Geschützte Pfade, zerstörerisches SQL und das Label `human-review` warten auf den Menschen.

**Bewusst nicht:** GitHub Actions oder Cloud-Routinen als Laufort. Beide kämen ohne laufenden Rechner aus, aber die Trennung von Tokens und Agenten müsste neu gebaut werden.

**Offen:**
- Ob `claude -p` mit Abo-Login, Worktrees und lokales Supabase in der Sandbox laufen, zeigt ein Test vor dem Bau von `wf`. Das beantwortet auch die Docker-Frage aus ADR 0004.
- Ob das Abo für den Betrieb reicht, zeigt die Kostenerfassung.
- Wie der Mensch einen wartenden PR am Handy freigibt, ohne dass `wf` dieselbe Ausnahme nutzen kann. Dafür kommt vermutlich doch ein eigener Bot-Zugang infrage, den ADR 0004 bisher ausschließt.

**Folgen:** Läufe finden nur statt, solange der Mac an ist. Das iPhone-Fundament aus M1 kommt etwas später, dafür entsteht es schon mit der Pipeline.
