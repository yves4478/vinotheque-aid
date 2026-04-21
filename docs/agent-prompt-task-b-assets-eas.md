# Agent Prompt — Task B: App Assets + EAS Build Setup

## Auftrag

Erstelle Platzhalter-Assets (Icon, Splash) und konfiguriere EAS Build,
damit der Entwickler die App im iPhone Simulator starten kann
ohne jedes Mal von Grund auf bauen zu müssen.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/mobile-framework-decision-FjfgL`
**Arbeitsverzeichnis:** `apps/mobile/`

---

## Teil 1 — Platzhalter-Assets erstellen

Die App braucht diese Dateien (Expo erwartet sie gemäss app.json):

```
apps/mobile/assets/
  icon.png          (1024x1024px)
  splash.png        (1284x2778px oder 2048x2048px)
  adaptive-icon.png (1024x1024px, nur Vordergrund)
```

Da kein Design-Tool verfügbar ist, erstelle SVG-basierte Platzhalter mit Node.js
und konvertiere sie zu PNG via `sharp` oder `@resvg/resvg-js`.

**Farben:**
- Hintergrund: `#1a0500` (sehr dunkles Weinrot)
- Icon-Vordergrund: `#c8956c` (Goldton) — grosses "V" oder Weinglas-Symbol

**Methode (ohne externe Design-Tools):**

```bash
cd apps/mobile
npm install --save-dev sharp
```

Erstelle `scripts/generate-assets.mjs`:

```javascript
import sharp from "sharp";
import { mkdir } from "fs/promises";

await mkdir("assets", { recursive: true });

// Icon: 1024x1024, weinroter Hintergrund, goldenes V
const iconSvg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="220" fill="#1a0500"/>
  <text x="512" y="680" font-family="Georgia,serif" font-size="600"
        font-weight="bold" fill="#c8956c" text-anchor="middle">V</text>
</svg>`;

await sharp(Buffer.from(iconSvg)).png().toFile("assets/icon.png");
await sharp(Buffer.from(iconSvg)).png().toFile("assets/adaptive-icon.png");

// Splash: 2048x2048
const splashSvg = `<svg width="2048" height="2048" xmlns="http://www.w3.org/2000/svg">
  <rect width="2048" height="2048" fill="#1a0500"/>
  <text x="1024" y="1100" font-family="Georgia,serif" font-size="800"
        font-weight="bold" fill="#c8956c" text-anchor="middle">V</text>
  <text x="1024" y="1280" font-family="Georgia,serif" font-size="120"
        fill="#c8956c88" text-anchor="middle" letter-spacing="20">VINOTHEQUE</text>
</svg>`;

await sharp(Buffer.from(splashSvg)).png().toFile("assets/splash.png");

console.log("Assets generated.");
```

Ausführen:
```bash
node scripts/generate-assets.mjs
```

Prüfen: `ls -la assets/` sollte die drei PNG-Dateien zeigen.

---

## Teil 2 — EAS Build konfigurieren

### 2a — EAS CLI installieren (falls nicht vorhanden)

```bash
npm install --save-dev eas-cli
```

### 2b — eas.json erstellen

Erstelle `apps/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "promptToConfigurePushNotifications": false
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Wichtig:** `"simulator": true` im development-Profil bedeutet, der Build
läuft im iPhone Simulator (kein echtes Device, kein Signing nötig).

### 2c — README für Simulator-Workflow

Erstelle `apps/mobile/README.md`:

```markdown
# Vinotheque Mobile

Expo React Native App für den persönlichen Weinkeller.

## Entwicklung — iPhone Simulator

### Voraussetzungen
- macOS
- Xcode (aus dem App Store)
- Node.js 18+
- npm

### Erster Start (einmalig, dauert ~5 Minuten)

```bash
# Abhängigkeiten installieren
cd vinotheque-aid
npm install
cd apps/mobile
npm install

# iOS Simulator Build (Xcode muss installiert sein)
npx expo run:ios
```

### Tägliche Entwicklung (nach dem ersten Build)

```bash
cd apps/mobile
npx expo start

# Im Terminal dann:
# i  → iPhone Simulator öffnen
# r  → App neu laden
# m  → Entwicklungsmenü
```

JS-Änderungen werden automatisch nachgeladen (Fast Refresh).
Neuer Native Build nötig nur wenn:
- Neue native Dependencies (z.B. expo install expo-camera)
- Änderungen in app.json (Permissions, Name, Icon)

## Projektstruktur

```
apps/mobile/
  app/              Expo Router Screens
    (tabs)/         Tab-Navigation
      index.tsx     Kellerliste
      add.tsx       Wein erfassen
      settings.tsx  Einstellungen
    wine/[id].tsx   Weindetail
  components/       Wiederverwendbare Komponenten
  store/            AsyncStorage-basierter State
  assets/           Icons, Splash Screen
```
```

---

## Abschluss

- TypeScript-Check bestätigen (sollte bereits sauber sein)
- `assets/` zu git hinzufügen (PNGs)
- `scripts/generate-assets.mjs` zu git hinzufügen
- `sharp` aus devDependencies wieder entfernen nach Ausführung (optional)
- Commit: `feat(mobile): add app assets and EAS build configuration`
- Push auf Branch `claude/mobile-framework-decision-FjfgL`

**Was du NICHT tun sollst:**
- Kein `eas build` ausführen (braucht Expo-Account)
- Kein `expo login` (braucht Credentials)
- Kein App Store Connect Setup
- Nicht nach echtem Device-Signing suchen
