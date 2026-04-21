# Agent Prompt — Task C: Maestro E2E Tests

## Auftrag

Schreibe Maestro-Flows für die kritischen User-Journeys der Vinotheque
iPhone App. Diese Tests laufen im iPhone Simulator ohne Deploy.

**Voraussetzung:** Task A und B müssen abgeschlossen sein, und der
Entwickler muss die App einmal via `npx expo run:ios` gestartet haben.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/mobile-framework-decision-FjfgL`
**Neues Verzeichnis:** `apps/mobile/.maestro/`

---

## Was ist Maestro?

Maestro ist ein Mobile-Test-Framework das YAML-Flows ausführt:
```bash
maestro test .maestro/flow_cellar.yaml
```
Es steuert den laufenden Simulator via Accessibility-Labels,
ohne Code-Änderungen in der App zu brauchen.

Docs: https://maestro.mobile.dev

---

## Installation (für den Entwickler, nicht du)

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Du schreibst nur die YAML-Flows. Kein Maestro-Install nötig zum Schreiben.

---

## Flow 1 — Wein erfassen und in Kellerliste sehen

Datei: `apps/mobile/.maestro/flow_add_wine.yaml`

```yaml
appId: ch.vinotheque.app
---
- launchApp:
    clearState: true

# Sicherstellen dass wir auf dem Keller-Tab sind
- assertVisible: "Mein Keller"

# Zum Erfassen-Tab wechseln
- tapOn: "Erfassen"
- assertVisible: "Wein erfassen"

# Weintyp wählen
- tapOn: "Rotwein"

# Pflichtfelder ausfüllen
- tapOn:
    placeholder: "z.B. Barolo Riserva"
- inputText: "Testino Rosso"

- tapOn:
    placeholder: "z.B. Giacomo Conterno"
- inputText: "Test Produzent"

# Speichern
- tapOn: "Wein speichern"

# Zurück auf Kellerliste
- assertVisible: "Mein Keller"
- assertVisible: "Testino Rosso"
- assertVisible: "Test Produzent"
```

---

## Flow 2 — Wein Detail öffnen und Flaschenzahl anpassen

Datei: `apps/mobile/.maestro/flow_wine_detail.yaml`

```yaml
appId: ch.vinotheque.app
---
- launchApp

# Ersten Wein in der Liste antippen
- tapOn: "Testino Rosso"

# Detail-Screen prüfen
- assertVisible: "Testino Rosso"
- assertVisible: "Test Produzent"
- assertVisible: "Rotwein"

# Flaschenzahl erhöhen
- tapOn: "+"
- assertVisible: "2"

# Flaschenzahl verringern
- tapOn: "−"
- assertVisible: "1"

# Zurück zur Liste
- tapOn:
    id: "back-button"
- assertVisible: "Mein Keller"
```

---

## Flow 3 — Suche in der Kellerliste

Datei: `apps/mobile/.maestro/flow_search.yaml`

```yaml
appId: ch.vinotheque.app
---
- launchApp

# Mindestens ein Wein muss vorhanden sein (State aus Flow 1)
- assertVisible: "Mein Keller"

# Suche nach vorhandenem Wein
- tapOn:
    placeholder: "Suchen…"
- inputText: "Testino"
- assertVisible: "Testino Rosso"

# Suche nach nicht vorhandenem Wein
- clearText
- inputText: "XYZ_NICHT_VORHANDEN"
- assertVisible: "Noch keine Weine im Keller."

# Suche leeren
- clearText
- assertVisible: "Testino Rosso"
```

---

## Flow 4 — Einstellungen: Kellername ändern

Datei: `apps/mobile/.maestro/flow_settings.yaml`

```yaml
appId: ch.vinotheque.app
---
- launchApp

# Zu Einstellungen navigieren
- tapOn: "Einstellungen"
- assertVisible: "Einstellungen"

# Kellernamen ändern
- tapOn:
    id: "cellar-name-input"
- clearText
- inputText: "Mein Testkeller"

# Tab wechseln (speichert)
- tapOn: "Keller"
- tapOn: "Einstellungen"

# Wert bleibt erhalten
- assertVisible: "Mein Testkeller"
```

---

## Flow 5 — Wein löschen

Datei: `apps/mobile/.maestro/flow_delete_wine.yaml`

```yaml
appId: ch.vinotheque.app
---
- launchApp

# Wein öffnen
- tapOn: "Testino Rosso"
- assertVisible: "Testino Rosso"

# Löschen-Button tippen
- tapOn: "Wein löschen"

# Bestätigungs-Alert
- assertVisible: "Testino Rosso"
- tapOn: "Löschen"

# Zurück in der Kellerliste, Wein weg
- assertVisible: "Noch keine Weine im Keller."
```

---

## Accessibility-Labels ergänzen (Anpassungen in den App-Screens)

Maestro findet Elemente via Text oder `accessibilityLabel`. Für zuverlässige
Tests ergänze diese Labels in den Screens:

**apps/mobile/app/(tabs)/index.tsx** — Suchfeld:
```typescript
<TextInput
  accessibilityLabel="Suchen…"
  placeholder="Suchen…"
  ...
/>
```

**apps/mobile/app/(tabs)/settings.tsx** — Kellername-Input:
```typescript
<TextInput
  accessibilityLabel="cellar-name-input"
  testID="cellar-name-input"
  ...
/>
```

**apps/mobile/app/wine/[id].tsx** — +/− Buttons:
```typescript
<TouchableOpacity accessibilityLabel="Flaschenzahl erhöhen" onPress={() => adjustQuantity(1)}>
  <Text>+</Text>
</TouchableOpacity>
<TouchableOpacity accessibilityLabel="Flaschenzahl verringern" onPress={() => adjustQuantity(-1)}>
  <Text>−</Text>
</TouchableOpacity>
```

---

## Maestro Config

Erstelle `apps/mobile/.maestro/config.yaml`:
```yaml
# Gemeinsame Einstellungen für alle Flows
---
flows:
  - flow_add_wine.yaml
  - flow_wine_detail.yaml
  - flow_search.yaml
  - flow_settings.yaml
  - flow_delete_wine.yaml
```

---

## Abschluss

- YAML-Flows erstellen (`.maestro/` Verzeichnis)
- Accessibility-Labels in den Screens ergänzen
- TypeScript-Check bestätigen
- Commit: `test(mobile): add Maestro E2E flows for core user journeys`
- Push auf Branch `claude/mobile-framework-decision-FjfgL`

**Hinweis:** Die Flows können erst ausgeführt werden wenn der Entwickler
die App im iPhone Simulator gestartet hat. Schreiben und committen kannst
du jetzt — testen muss der Entwickler selbst auf seinem Mac.
