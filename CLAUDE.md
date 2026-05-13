# Vinotheque – Claude Code Guide

## Projekt-Überblick

Vinotheque ist eine Weinkellar-Verwaltungs-App (PWA + iOS/Android).

**Stack:** React 18 · TypeScript · Vite · shadcn/ui · Tailwind CSS  
**Monorepo:** Bun Workspaces  
**Testing:** Vitest + Testing Library  
**Linting:** ESLint (TypeScript-aware)

## Monorepo-Struktur

```
/                        # Web-App (Vite + React)
  src/
    pages/               # Route-Komponenten (React Router)
    components/          # Gemeinsame UI-Komponenten
    hooks/               # useWineStore (Hauptzustand), useFeedbackStore
    lib/                 # apiClient, runtime, utils
    features/            # Feature-Flags (webFeatures)
    providers/           # AppRuntimeProvider
packages/
  core/                  # @vinotheque/core – geteilte Typen, Logik, Helpers
    src/types/           # Wine, WishlistItem, Merchant, CellarMovement …
    src/data/            # countryRegions, grapes, wineRegions, testWines
    src/lib/             # wineHelpers, imagePolicy, labelParser, utils …
    src/features/        # claudeVision, recognitionEnrichment …
apps/
  mobile/                # Expo React Native (iOS + Android)
```

## Entwicklungs-Befehle

```bash
npm run dev          # Web-Dev-Server starten
npm run build        # Produktions-Build
npm run test         # Vitest (alle Tests)
npm run lint         # ESLint
```

## Wichtige Konventionen

- **Pfad-Alias:** `@/` zeigt auf `src/`
- **Shared-Paket:** Typen und Business-Logik gehören in `packages/core` (`@vinotheque/core`), nicht in `src/`
- **State:** Alles läuft durch `useWineStore` (React Context + localStorage-Persistenz)
- **API:** `src/lib/apiClient.ts` – wraps `fetch`, wirft bei non-ok
- **Umgebungen:** `dev` / `prod` / `test` – gesteuert via `AppEnvironment` aus Core
- **Styling:** Tailwind + shadcn/ui Komponenten aus `src/components/ui/`
- **Tests:** Neben der Datei oder in `src/test/`, Dateiname `*.test.tsx`

## Architektur-Entscheidungen

- Keine Server-Side-Rendering – reine SPA/PWA
- localStorage als primärer Datenspeicher; optionaler Backend-Sync via API
- `@vinotheque/core` ist plattform-neutral – kein Browser/RN-spezifischer Code darin
- Mobile-App (`apps/mobile`) ist eine separate Expo-App, die Core shared

## Superpowers-Workflow

Dieses Projekt nutzt [Superpowers](https://github.com/obra/superpowers) als Entwicklungs-Framework.

**Installation (einmalig):**
```
/plugin install superpowers@claude-plugins-official
```

**Workflow für neue Features:**
1. `/brainstorm` – Idee ausarbeiten, bevor Code geschrieben wird
2. `/plan` – Implementierungsplan mit Tasks erstellen
3. `/tdd` – Tests zuerst, dann Implementierung
4. `/review` – Code-Review nach Abschluss

**Für parallele Arbeit mit Codex:** Aufgaben in `AGENTS.md` dokumentieren.
