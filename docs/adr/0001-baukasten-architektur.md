# ADR 0001: Baukasten-Architektur im Monorepo

**Status:** angenommen, 2026-11-02

**Kontext:** Bausteine der App sollen in anderen Apps wiederverwendbar sein. Das darf nicht bloß behauptet werden.

**Entscheidung:** pnpm- und Turborepo-Monorepo mit `packages/kit`, `packages/features` und `apps`. Ein Modul trennt `domain`, `data`, `ui` und `migrations`, sein Manifest hat die Felder `id`, `routes`, `nav`, `homeWidgets`. Die zweite App `apps/demo-wg` wird in CI gebaut und beweist die Wiederverwendung. dependency-cruiser und eine Wort-Sperre erzwingen die Grenzen.

**Bewusst nicht:** Ports und Adapter pro Modul, Event-Bus, Matrix-Build pro entferntem Modul. Sie kosten laufend und bringen ohne zweiten Nutzer nichts. Die Abhängigkeitsregeln und die zweite App decken dasselbe Risiko ab.

**Folgen:** Module lassen sich erst einzeln veröffentlichen, wenn ein zweites Projekt sie braucht. Bis dahin reicht die Nutzung im Monorepo.
