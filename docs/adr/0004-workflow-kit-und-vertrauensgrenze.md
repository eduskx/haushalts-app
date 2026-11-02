# ADR 0004: Workflow-Kit im Repo, Agenten ohne Schreibrechte auf GitHub

**Status:** angenommen, 2026-11-02

**Kontext:** Maximale Automation mit Auto-Merge auf einem Pro-Abo. Der Workflow soll in andere Projekte wandern. Ein Review ist wertlos, wenn der geprüfte Agent es selbst setzen kann.

**Entscheidung:**
- Der Workflow ist ein Claude-Code-Plugin in `workflow-kit/`. Alles Projektspezifische steht in `project.config.json`. Der Kit-Beweis ist ein Wegwerf-Repo.
- Der deterministische Orchestrator `wf` handelt: Er liest Tickets, pusht, öffnet PRs, setzt den Status `agent-review` und merged. Agenten liefern nur Commits und JSON.
- Agenten laufen in einer eigenen WSL2-Distribution ohne GitHub-Token und ohne Produktions-Secrets.
- Pflichtprüfung ist der Commit-Status `agent-review`, weil ein Konto seinen eigenen PR nicht freigeben kann.
- Diffs auf geschützten Pfaden und zerstörerisches SQL gehen an den Menschen.
- `wf` gibt nur Text freigegebener Autoren an Agenten weiter, weil das Repo öffentlich ist.

**Bewusst nicht:** Eigenes Repo für das Kit (Wahl des Nutzers, `git subtree split` bleibt der Weg dorthin) und eine GitHub App (unnötig, solange Agenten keinen Token haben).

**Offen:** Docker-Zugriff in der Distribution könnte die Grenze schwächen. Phase 2 prüft das, und der Mensch entscheidet bei Bedarf über eine Alternative.

**Folgen:** Hooks im Plugin sind nur Schutz gegen Versehen, nicht die Sicherheitsgrenze. Änderungen am Kit durchlaufen immer den Menschen.
