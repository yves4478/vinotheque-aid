# Versionierungskonzept

Vinotheque Aid verwendet [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH).

## Schema

- **MAJOR** (`1.x.x`): Breaking Changes am Datenmodell, an APIs oder grosse UX-Umbauten, die eine Migration erfordern.
- **MINOR** (`0.x.0`): Neue Features (z. B. Wein-Degu, KI-Insights, Mehrere Bilder) ohne Bruch bestehender Daten.
- **PATCH** (`0.0.x`): Bugfixes, kleinere UI-Verbesserungen, Performance, Doku.

## Single Source of Truth

Die Versionsnummer steht ausschliesslich in `package.json` (`version`-Feld).

Beim Build injiziert Vite zwei Konstanten via `define`:

- `__APP_VERSION__` — Wert aus `package.json`
- `__BUILD_DATE__` — ISO-Timestamp des Builds

Diese werden in `src/lib/version.ts` als `APP_VERSION` und `BUILD_DATE` exportiert.

## Anzeige

Die aktuelle Version wird unten links in der Sidebar (`AppSidebar.tsx`) angezeigt im Format:

```
v0.5.0 · 26.04.2026
```

Beim Hover wird der vollstaendige Build-Timestamp als Tooltip eingeblendet.

## Release-Flow

1. Vor dem Merge auf `main` Version in `package.json` gemaess Schema bumpen.
2. Eintrag in `CHANGELOG.md` ergaenzen (sobald eingefuehrt).
3. `git tag v<version>` setzen, sobald der Release ausgeliefert wird.

## Aktueller Stand

- **0.5.0** — MVPs fuer Mehrere Bilder, Wein-Degu, KI-Zusatzinfos; einheitliche Waehrungsformatierung; Versionierung eingefuehrt.
- 0.0.0 — Initialer Stand vor MVP-Welle.

## Mobile-App

Die Expo-App pflegt ihre Version separat in `apps/mobile/package.json` und `app.json`. Empfehlung: Mobile-Version synchron zur Web-Version halten, sofern keine Plattform-spezifischen Releases noetig sind.
