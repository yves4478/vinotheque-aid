# Vinotheque Mobile

Expo React Native App für den persönlichen Weinkeller.

---

## iPhone – schnellster Weg (Expo Go + Produktion)

Keine nativen Build-Tools nötig. Die App läuft direkt via **Expo Go** gegen die
Produktion API.

### Schritt 1: Expo Go installieren

Auf dem iPhone im App Store **„Expo Go"** suchen und installieren.

### Schritt 2: .env anlegen

```bash
cd apps/mobile
cp .env.example .env
```

Die Datei ist bereits auf Prod vorkonfiguriert:
```
EXPO_PUBLIC_API_URL=https://api.vinotheque.ch
EXPO_PUBLIC_APP_ENV=prod
```

### Schritt 3: Expo mit Tunnel starten

```bash
cd apps/mobile
npx expo start --tunnel
```

> `--tunnel` ist nötig, damit das iPhone den Metro-Bundler in der UTM-VM
> erreichen kann. Die Prod-API ist bereits im Internet erreichbar.

### Schritt 4: QR-Code scannen

Im Terminal erscheint ein QR-Code. Auf dem iPhone:
- **iOS 16+**: Kamera-App öffnen → QR-Code scannen → Expo Go öffnet sich
- **alternativ**: In Expo Go oben rechts „Scan QR Code" tippen

Die App lädt und spricht direkt gegen `https://api.vinotheque.ch`.

---

## Entwicklung am Simulator (Mac)

```bash
cd apps/mobile
npx expo start
# → 'i' drücken für Simulator
```

Oder als nativer Build:
```bash
npx expo run:ios
```

---

## Gegen lokales Backend entwickeln (UTM-VM)

Das iPhone kann die VM nicht direkt erreichen. ngrok tunnelt den API-Port:

```bash
# In der VM (Terminal 1): Backend starten
cd apps/api && npm run dev

# In der VM (Terminal 2): ngrok-Tunnel öffnen
npx ngrok http 3000
# → gibt z.B. https://abc123.ngrok-free.app aus

# In apps/mobile/.env setzen:
# EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app
# EXPO_PUBLIC_APP_ENV=dev

# In der VM (Terminal 3): Expo starten
cd apps/mobile && npx expo start --tunnel
```

---

## Umgebungsvariablen

| Variable | Beschreibung | Standard |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Backend-URL | `https://api.vinotheque.ch` |
| `EXPO_PUBLIC_APP_ENV` | `prod` oder `dev` | `prod` |

---

## EAS Build Profile

Für Standalone-Builds (ohne Expo Go) – erfordert kostenpflichtigen Apple Developer Account:

| Profil | Simulator | Gerät | Verwendung |
|---|---|---|---|
| `simulator` | ✓ | — | Xcode Simulator |
| `development` | — | ✓ | Gerät + Hot Reload via `expo start` |
| `preview` | — | ✓ | Interner Download-Link (AdHoc) |
| `production` | — | ✓ | App Store Release |

```bash
# Beispiel Preview-Build (benötigt $99 Apple Developer Account):
eas build --platform ios --profile preview
```

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
