# ADR 0003: Supabase mit RLS-Vertrag und Rails-artigen Migrationen

**Status:** angenommen, 2026-11-02

**Kontext:** Geteilte Daten in Echtzeit, Fotos, strikte Trennung der Gruppen, und jedes Modul soll sein eigenes SQL mitbringen.

**Entscheidung:** Supabase. `packages/kit/spaces` veröffentlicht `private.is_space_member(space_id)`, alle Policies bauen darauf auf. Modul-Migrationen werden einmalig in die jeweilige App kopiert und dort gestempelt. Ein CI-Katalogtest schlägt fehl, wenn eine öffentliche Tabelle keine RLS, keine Policies oder keinen Test gegen fremde Gruppen hat.

**Sync:** Realtime ist nur ein Signal zum Neuladen. Offline-Unterstützung gibt es nur bei Listen: IndexedDB, Client-UUIDs, idempotente Upserts, Last-Write-Wins pro Feld. Keine CRDTs.

**Folgen:** Lokal und in CI wird Docker gebraucht. Im Free-Tier gibt es keine Backups, deshalb gehört ein verschlüsseltes nächtliches Backup in den Release-Meilenstein. Migrationen laufen nach Expand/Contract, weil alte Service-Worker alte Clients am Leben halten.
