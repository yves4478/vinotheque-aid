# Vinotheque Mobile

Expo React Native App für den persönlichen Weinkeller.

---

## App auf dem iPhone installieren

Die App verwendet native Plugins (Kamera, Fotos), daher ist **Expo Go allein nicht
ausreichend** — du brauchst einen *Development Build* oder *Preview Build*.

### Option A: EAS Preview Build (empfohlen, kein Mac nötig)

Der einfachste Weg, die App auf einem echten iPhone zu testen. Expo baut die App
in der Cloud und du installierst sie per Link.

**Voraussetzungen:**
- [Apple Developer Account](https://developer.apple.com) (kostenlos reicht für interne Builds)
- EAS CLI: `npm install -g eas-cli`
- Einmalig einloggen: `eas login`

**Schritte:**

```bash
cd apps/mobile

# Einmalig: Apple-Zertifikate einrichten (EAS führt dich durch den Prozess)
eas credentials

# Preview-Build starten (real device, kein Simulator)
eas build --platform ios --profile preview
```

Nach dem Build erhältst du einen QR-Code / Link. Auf dem iPhone öffnen →
**Installieren** tippen → App starten.

> Die App kommuniziert mit dem Backend. Setze vor dem Build die API-URL:
> ```bash
> # .env erstellen (aus .env.example kopieren)
> cp .env.example .env
> # EXPO_PUBLIC_API_URL auf deine Server-URL setzen
> ```

---

### Option B: Development Build (lokal, für aktive Entwicklung)

Erlaubt Hot Reload und direktes Debuggen auf dem iPhone.

**Voraussetzungen:**
- macOS
- Xcode (aus dem App Store) mit aktuellen Command Line Tools
- Apple Developer Account
- Node.js 18+, npm

**Schritte:**

```bash
# 1. Abhängigkeiten installieren (im Root)
npm install

# 2. Lokale IP des Macs herausfinden
ipconfig getifaddr en0
# z.B. 192.168.1.42

# 3. .env anlegen
cd apps/mobile
cp .env.example .env
# EXPO_PUBLIC_API_URL=http://192.168.1.42:3000  ← echte IP eintragen

# 4. iPhone per USB verbinden, in Xcode als vertrauenswürdiges Gerät bestätigen

# 5. Build auf dem Gerät starten
npx expo run:ios --device
```

Danach startet Metro und du kannst mit `r` neu laden oder `m` das Dev-Menü öffnen.

---

### Option C: EAS Development Build (Gerät, Cloud-Build)

Wenn du keinen Mac hast, aber trotzdem Hot Reload willst:

```bash
# 1. Build in der Cloud erstellen
eas build --platform ios --profile development

# 2. Installierten Development Client öffnen, dann lokal starten:
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000 npx expo start
```

Auf dem iPhone den QR-Code mit der Vinotheque Dev-App scannen.

---

## Lokale Entwicklung (Simulator)

```bash
cd apps/mobile
npx expo run:ios          # nativer Build für Simulator
# oder
npx expo start            # Metro starten, dann 'i' drücken
```

Für einen frischen Simulator-Build via EAS:

```bash
eas build --platform ios --profile simulator
```

---

## Wichtige Umgebungsvariablen

| Variable | Beschreibung | Beispiel |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | URL des Backends | `http://192.168.1.42:3000` |
| `EXPO_PUBLIC_APP_ENV` | Umgebung (`dev`/`prod`) | `dev` |

Erstelle `apps/mobile/.env` aus `.env.example` und passe die Werte an.

---

## EAS Build Profile

| Profil | Simulator | Gerät | Verwendung |
|---|---|---|---|
| `simulator` | ✓ | — | Lokaler Simulator-Build (Development Client) |
| `development` | — | ✓ | Gerät + Hot Reload via `expo start` |
| `preview` | — | ✓ | Testen auf echtem Gerät, interner Download-Link |
| `production` | — | ✓ | App Store Release |

---

## Projektstruktur

```text
apps/mobile/
  app/              Expo Router Screens
    (tabs)/         Tab-Navigation
      index.tsx     Kellerliste
      add.tsx       Wein erfassen
      tasting.tsx   Degu-Flow
      wishlist.tsx  Merkliste
      shopping.tsx  Einkaufsliste
      map.tsx       Weinweltkarte
      settings.tsx  Einstellungen
    wine/[id].tsx   Weindetail
    capture/        Etiketten-Scan Flow
  components/       Wiederverwendbare Komponenten
  lib/              API-Client, Feature-Flags, Runtime-Config
  store/            AsyncStorage-basierter State
  plugins/          Native Expo Plugins
  assets/           Icons, Splash Screen
```
