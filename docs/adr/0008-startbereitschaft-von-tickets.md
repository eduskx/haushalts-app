# ADR 0008: Fragerunde vor dem Start und getrennte Labels für den Menschen

**Status:** angenommen, 2026-11-03. Erweitert die Tabelle aus ADR 0006.

**Kontext:** Unbeaufsichtigte Läufe können niemanden fragen. Das Label `needs-human` vermischte vier Fälle: offene Entscheidung, Arbeit nur für Menschen, Freigabe im PR und Geschmacksfrage. Nur die ersten beiden lassen sich vor dem Start klären. Außerdem blieb das Label auf erledigten Tickets stehen, und der Status `Todo` versprach keine Startbarkeit.

**Entscheidung:**

| Label | Bedeutung | Wann | Pipeline |
|---|---|---|---|
| `needs-human` | Eine Frage ist gerade offen | Vor dem Start | Überspringt, bis sie beantwortet ist |
| `human-task` | Nur ein Mensch kann es tun | Statt eines Agentenlaufs | Nimmt es nie |
| `human-review` | Der Mensch beurteilt das Ergebnis | Nach dem PR | Baut es, kein Auto-Merge |

- Geschützte Pfade und zerstörerisches SQL bekommen kein Label, `wf` erkennt sie am Diff.
- Startbar ist ein Ticket im Status `Todo` ohne `needs-human` und `human-task`, dessen Blocker alle erledigt sind.
- Der Skill `intake` prüft vor dem Lauf alle offenen Tickets des Meilensteins, auch die ohne Label, und fragt interaktiv nur, was das Ergebnis ändert.
- Antworten stehen im Abschnitt `Antworten` der Ticketbeschreibung, offene Fragen unter `Offene Fragen`. Nach jeder Fragerunde wird sofort gespeichert.
- Darf ein Ticket geschützte Pfade ändern, steht dort `allowProtected`. Der Merge bleibt trotzdem beim Menschen.
- Trifft ein Agent im Lauf auf eine Frage, kommt sie über denselben Abschnitt in die nächste Fragerunde.
- Secrets werden nie abgefragt.

**Bewusst nicht:** Ein eigener Linear-Status für „wartet auf Eingabe“. Labels reichen, und ein Ticket kann so zugleich `needs-human` und `human-review` tragen.

**Folgen:** Die Fragerunde braucht eine interaktive Sitzung. Bis `wf` existiert, prüft niemand die Startbarkeit maschinell.
