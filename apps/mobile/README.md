# Vinotheque Mobile

Expo React Native App fuer den persoenlichen Weinkeller.

## Entwicklung - iPhone Simulator

### Voraussetzungen

- macOS
- Xcode aus dem App Store
- Node.js 18+
- npm

### Erster Start

```bash
cd vinotheque-aid
npm install
cd apps/mobile
npm install
npx expo run:ios
```

### Taegliche Entwicklung

```bash
cd apps/mobile
npx expo start
```

Im Terminal:

- `i` oeffnet den iPhone Simulator
- `r` laedt die App neu
- `m` oeffnet das Entwicklungsmenue

JS-Aenderungen werden automatisch nachgeladen. Ein neuer Native Build ist nur
bei neuen nativen Dependencies oder Aenderungen in `app.json` noetig.

## Projektstruktur

```text
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
