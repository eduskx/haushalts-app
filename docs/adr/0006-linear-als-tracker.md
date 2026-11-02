# ADR 0006: Linear als Ticket-System

**Status:** angenommen, 2026-11-02. Ersetzt die frühere Wahl von GitHub Issues.

**Kontext:** Das System aus GitHub Issues gefiel im Alltag nicht, und Issues teilen sich ihren Nummernzähler mit den PRs. Linear ist von der Arbeit vertraut.

**Entscheidung:** Tickets und Ideen liegen in Linear, im Team `EDU` und Projekt `haushalts-app`. GitHub bleibt für Code, PRs und CI. Der Workflow liest Team, Projekt, Status und Labels aus `project.config.json`.

| Zustand | Abbildung in Linear |
|---|---|
| Idee | Status `Backlog`, Label `idea` |
| Freigegeben | Status `Todo` |
| In Arbeit | Status `In Progress` |
| PR wird geprüft | Status `In Progress`, Label `in-review` |
| Fertig | Status `Done` |
| Mensch gefragt | Label `needs-human` |

**Folgen für Agenten und `wf`:**
- Interaktive Sitzungen nutzen den Linear-Connector. `wf` läuft ohne Sitzung und braucht in Phase 4 einen eigenen Linear-API-Schlüssel auf der Windows-Seite.
- Pipeline-Agenten bekommen wie in ADR 0004 keinen Tracker-Zugang. `wf` reicht ihnen nur den Tickettext freigegebener Autoren durch.
- Tickets dürfen persönliche Details enthalten, weil der Workspace privat ist. In das öffentliche Repo gehören solche Details weiterhin nicht.

**Offen:** Die GitHub-Integration von Linear richtet der Mensch ein. Dass sie Status und PRs wie erwartet verknüpft, ist noch nicht geprüft.
