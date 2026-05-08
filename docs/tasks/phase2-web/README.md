# Phase 2 — Web ausbauen

Ziel: Die Web-App wird das Planungs- und Analyse-Tool. Sie ergaenzt iOS, indem sie Verwaltung, Bulk-Aktionen und Statistiken liefert.

## Reihenfolge

Phase 2 kann **parallel zu Phase 1** laufen. Innerhalb von Phase 2 ist die Reihenfolge:

| # | Task | Datei | Abhaengigkeit |
|---|---|---|---|
| 1 | Dashboard mit Trinkreife-Analyse | [task-1-dashboard.md](./task-1-dashboard.md) | Phase 1 Task 2 (drinkWindow utility) |
| 2 | Merkliste-Promotion-Flow verbessern | [task-2-wishlist-promotion.md](./task-2-wishlist-promotion.md) | — |
| 3 | Einkaufsliste-Priorisierung + Haendler | [task-3-shopping-priority.md](./task-3-shopping-priority.md) | — |
| 4 | Keller-Bulk-Aktionen | [task-4-cellar-bulk.md](./task-4-cellar-bulk.md) | — |
| 5 | Cloud Storage fuer Bilder | [task-5-cloud-storage.md](./task-5-cloud-storage.md) | strategischer Entscheid noetig |

## Konventionen

- Code in `src/` (Web-App) und `apps/api/` (Backend)
- Gemeinsame Logik in `packages/core/` extrahieren
- shadcn/ui Komponenten verwenden, kein neues Component-Framework
- Tailwind CSS, keine separaten Stylesheets
- React Query fuer Server-State
- Tests mit Vitest

## Definition of Done je Task

- Code laeuft im Vite Dev-Server (`npm run dev`)
- Lint und Typescheck gruen (`npm run lint`)
- Manueller Smoke-Test im Browser dokumentiert
- Backlog (`docs/backlog.md`) aktualisiert wo relevant
