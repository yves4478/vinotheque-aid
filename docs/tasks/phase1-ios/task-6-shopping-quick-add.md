# Task 6 — Einkaufsliste auf "Schnell hinzufuegen" reduzieren

## Auftrag

Reduziere die iOS-Einkaufsliste auf den Use-Case "Mir faellt im Keller ein, dass ich X nachbestellen muss". Die echte Pflege erfolgt im Web.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdatei:** `apps/mobile/app/(tabs)/shopping.tsx`

**Abhaengigkeit:** Task 1 (Tab-Bar) — der Tab ist bereits aus der Bar entfernt.

## Hintergrund

Heute hat die iOS-Einkaufsliste vollen Funktionsumfang (Bearbeiten, Loeschen, Pruefen, Preis schaetzen). Laut [Plattform-Strategie](../../platform-strategy.md) gehoert die Verwaltung ins Web.

## Konkrete Schritte

1. **Screen umbauen `apps/mobile/app/(tabs)/shopping.tsx`**
   - Oben: Eingabefeld "Wein, Produzent, Bemerkung" + Button "Hinzufuegen"
   - Darunter: Liste der **letzten 10** Eintraege (neueste zuerst)
   - Pro Eintrag: nur Loeschen-Swipe (kein Bearbeiten, keine Preise, keine Checkboxen)
   - Hinweis-Text unten: "Die vollstaendige Einkaufsliste verwaltest du in der Web-App."
   - Link/Button zur Web-App wenn moeglich (oeffnet Browser auf die Web-URL aus der Konfiguration)

2. **Datenmodell**
   - Bestehender `ShoppingItem` bleibt unveraendert
   - Quick-Add erstellt einen Eintrag mit: `name` (aus dem Eingabefeld), `quantity = 1`, andere Felder leer
   - Server-seitig keine Aenderung noetig

3. **Code-Cleanup**
   - Nicht mehr benoetigte Komponenten (PriceInput, BulkActions, EditDialog) entfernen
   - Imports aufraeumen

## Akzeptanzkriterien

- [ ] Screen zeigt nur Eingabefeld + Liste der letzten 10
- [ ] Hinzufuegen funktioniert in einem Tap
- [ ] Loeschen via Swipe funktioniert
- [ ] Hinweis-Text auf Web-App ist sichtbar
- [ ] Lint und Typescheck gruen
- [ ] Vorher: Screenshot Soll/Ist im Commit

## Hinweise

- Verwende `react-native-gesture-handler` Swipeable falls schon im Stack, sonst Long-Press + Confirm
- Die Web-URL kommt aus `Constants.expoConfig?.extra?.webUrl` — ergaenzen wenn nicht vorhanden
- Diese Reduktion ist bewusst — nicht "verbessern", sondern entfernen
