# Vinotheque – Agent Guide (Codex & AI Assistants)

## Projekt-Überblick

Vinotheque ist eine Weinkellar-Verwaltungs-App (PWA + iOS/Android).

**Stack:** React 18 · TypeScript · Vite · shadcn/ui · Tailwind CSS  
**Monorepo:** Bun Workspaces  
**Testing:** Vitest + Testing Library

## Monorepo-Struktur

```
/                        # Web-App (Vite + React)
  src/
    pages/               # Route-Komponenten (React Router)
    components/          # Gemeinsame UI-Komponenten
    hooks/               # useWineStore (Hauptzustand), useFeedbackStore
    lib/                 # apiClient, runtime, utils
packages/
  core/                  # @vinotheque/core – geteilte Typen und Logik
    src/types/           # Wine, WishlistItem, Merchant, CellarMovement …
    src/data/            # Wein-Regionen, Traubensorten, Testdaten
    src/lib/             # Business-Logik, Helpers
apps/
  mobile/                # Expo React Native
```

## Befehle

```bash
npm run dev          # Web-Dev-Server starten
npm run build        # Produktions-Build
npm run test         # Alle Tests ausführen
npm run lint         # ESLint
```

## Konventionen

- `@/` ist ein Pfad-Alias für `src/`
- Typen und plattform-neutrale Logik gehören in `packages/core`
- State wird über `useWineStore` (React Context + localStorage) verwaltet
- API-Calls laufen über `src/lib/apiClient.ts`
- Tests liegen neben den Quelldateien als `*.test.tsx`
- Styling: Tailwind CSS + shadcn/ui Komponenten

## Entwicklungs-Prinzipien

- YAGNI: Nur implementieren was gebraucht wird
- TDD bevorzugt: Tests vor der Implementierung schreiben
- Keine Kommentare außer bei nicht-offensichtlichem Verhalten
- Kleine, fokussierte Commits
- TypeScript strict – keine `any` ohne Begründung

## Zusammenarbeit Claude ↔ Codex

Beim parallelen Arbeiten:
- Claude (via Claude Code + Superpowers): Architektur, komplexe Features, Reviews
- Codex: Routineaufgaben, Tests, Bugfixes, Refactoring

Aufgaben werden als GitHub Issues verwaltet. Feature-Branches folgen dem Schema:
- `claude/<feature-name>` für Claude-geführte Arbeiten
- `codex/<feature-name>` für Codex-geführte Arbeiten
