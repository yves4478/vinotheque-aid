# Phase 1 — iOS schaerfen

Ziel: Die iOS-App fokussiert sich auf den mobilen Kernflow (Erfassen, Selektieren, Rating). Sie ist nicht mehr eine Mini-Kopie der Web-App.

## Reihenfolge

Die Tasks bauen aufeinander auf. **Strikt in dieser Reihenfolge** durch Agenten umsetzen.

| # | Task | Datei | Abhaengigkeit |
|---|---|---|---|
| 1 | Tab-Bar reduzieren und neu strukturieren | [task-1-tab-bar.md](./task-1-tab-bar.md) | — |
| 2 | Drink-Window-Badge auf Weinkarte | [task-2-drink-window-badge.md](./task-2-drink-window-badge.md) | — |
| 3 | "Heute oeffnen"-Flow | [task-3-heute-oeffnen.md](./task-3-heute-oeffnen.md) | Task 2 |
| 4 | Schnelles Rating nach dem Trinken | [task-4-quick-rating.md](./task-4-quick-rating.md) | Task 3 |
| 5 | Offline-Erfassung + Sync-Queue | [task-5-offline-sync.md](./task-5-offline-sync.md) | Task 1 |
| 6 | Einkaufsliste auf "Schnell hinzufuegen" reduzieren | [task-6-shopping-quick-add.md](./task-6-shopping-quick-add.md) | Task 1 |

## Konventionen

- Alle Tasks arbeiten auf Branch `claude/plan-app-architecture-6dUk6` oder eigenen Sub-Branches
- Code in `apps/mobile/` (Expo React Native)
- Gemeinsame Logik nach `packages/core/` extrahieren, wenn auch im Web nutzbar
- Keine neuen Dependencies ohne Ruecksprache
- Tests nach Moeglichkeit (Jest fuer Logik, Maestro fuer E2E falls existiert)

## Definition of Done je Task

- Code laeuft im Expo-Simulator
- Lint und Typescheck gruen (`npm run lint`, `npm run typecheck` falls vorhanden)
- Manueller Smoke-Test des Kernflows dokumentiert
- Commit-Message folgt Repo-Konvention
- Backlog (`docs/backlog.md`) aktualisiert wo relevant
