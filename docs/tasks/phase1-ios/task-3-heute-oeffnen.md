# Task 3 — "Heute oeffnen"-Flow

## Auftrag

Implementiere auf iOS einen 3-Schritte-Flow: Wein auswaehlen → Menge buchen (Cellar Movement out) → spaeter Rating.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdateien:**
- `apps/mobile/app/wine/[id].tsx` (Anpassung)
- `apps/mobile/app/wine/open/[id].tsx` (NEU)

**Abhaengigkeit:** Task 2 (Drink-Window-Badge) sollte fertig sein, damit dieser Flow auch eine Auswahlhilfe bietet.

## Hintergrund

Heute fehlt ein direkter Pfad fuer "Ich oeffne diesen Wein jetzt". Der Nutzer muss manuell die Menge reduzieren. Das ist friktionsreich und wird umgangen — was bedeutet, dass der Bestand falsch wird.

## User Story

> Ich stehe im Keller und entscheide, welchen Wein ich heute trinke. Ich tippe auf den Wein, druecke "Heute oeffnen", bestaetige die Menge (1 Flasche), und der Bestand wird automatisch reduziert. Ein Cellar-Movement wird angelegt. Spaeter (Task 4) bekomme ich eine Push oder einen Hinweis: "Wie war der Wein?"

## Konkrete Schritte

1. **Im Wein-Detail-Screen (`apps/mobile/app/wine/[id].tsx`)**
   - Primary-Button "Heute oeffnen" prominent platzieren
   - Bei Tap → navigiert zu `/wine/open/[id]`

2. **Neuer Screen `apps/mobile/app/wine/open/[id].tsx`**
   - Anzeige: Wein-Name, Produzent, Jahrgang, aktueller Bestand
   - Eingabe: Anzahl Flaschen (Default 1, max = aktueller Bestand)
   - Optional: Anlass (TextInput, Beispiele "Abendessen", "Geburtstag")
   - Optional: Mit-Trinker (TextInput, freie Eingabe)
   - Button "Bestaetigen"

3. **Bei Bestaetigung**
   - `Wine.quantity` reduzieren (PUT auf API)
   - `CellarMovement` mit type `out` anlegen (POST auf API)
     - `wineId`, `wineName`, `wineProducer`, `wineVintage`, `wineType`
     - `quantity`, `date: now`, `occasion`
   - Bei Erfolg: Navigation zurueck zur Keller-Liste mit Toast "Wein geoeffnet — Rating folgt"
   - Lokal in AsyncStorage merken: `pendingRatings[wineId] = { openedAt, occasion }` (fuer Task 4)

4. **API-Anpassungen pruefen**
   - Pruefen ob Endpoint `POST /api/movements` existiert. Falls nicht: ergaenzen unter `apps/api/src/routes/movements.ts`
   - Schema in `apps/api/prisma/schema.prisma` checken — `CellarMovement`-Modell sollte existieren

5. **Offline-Verhalten**
   - Wenn API nicht erreichbar: lokale Aenderung speichern, in Sync-Queue ablegen (Task 5 macht die Queue, hier nur vorbereiten mit klarer Schnittstelle)

## Akzeptanzkriterien

- [ ] Detail-Screen hat sichtbaren "Heute oeffnen"-Button
- [ ] Open-Screen reduziert Bestand korrekt
- [ ] CellarMovement wird angelegt
- [ ] AsyncStorage `pendingRatings` enthaelt nach dem Flow den Wein
- [ ] Bei `quantity = 0` wird der Button nicht mehr angeboten oder ausgegraut
- [ ] Lint und Typescheck gruen
- [ ] Smoke-Test: Bestand vor und nach dem Flow sichtbar reduziert

## Hinweise

- Verwende vorhandene API-Hooks aus `apps/mobile/lib/` (oder wo Wine-Mutations heute liegen)
- Die `pendingRatings`-Struktur wird von Task 4 weiterverwendet — Format dokumentieren
- Achte auf Race-Conditions wenn Bestand parallel geaendert wird (optimistic update + revert bei Fehler)
