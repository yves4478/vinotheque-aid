# Task 2 — Drink-Window-Badge auf der Weinkarte

## Auftrag

Zeige auf jeder Weinkarte (iOS und Web) einen visuellen Indikator zur Trinkreife: "Jetzt ideal", "Noch X Jahre", "Zu frueh", "Bald trinken", "Ueber Hoehepunkt".

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdateien:**
- `packages/core/src/lib/drinkWindow.ts` (NEU)
- `apps/mobile/components/WineCard.tsx` (Anpassung)
- `src/components/cellar/` (Web-Anpassung)

## Hintergrund

Das Datenmodell `Wine` enthaelt bereits `drinkFrom` und `drinkUntil`. Diese Information ist heute nur im Detail-Screen sichtbar. In der Liste gibt es keinen visuellen Hinweis darauf, ob ein Wein trinkbereit ist.

## Konkrete Schritte

1. **Neue Utility in `packages/core/src/lib/drinkWindow.ts`**

   ```typescript
   export type DrinkWindowStatus =
     | { kind: "tooEarly"; yearsUntilReady: number }
     | { kind: "ready" }
     | { kind: "drinkSoon"; yearsLeft: number }
     | { kind: "pastPeak" }
     | { kind: "unknown" };

   export function getDrinkWindowStatus(
     drinkFrom: number | null | undefined,
     drinkUntil: number | null | undefined,
     now: Date = new Date(),
   ): DrinkWindowStatus;
   ```

   Logik:
   - `unknown` wenn beide Werte fehlen
   - `tooEarly` wenn `currentYear < drinkFrom`
   - `pastPeak` wenn `currentYear > drinkUntil`
   - `drinkSoon` wenn `drinkUntil - currentYear <= 1`
   - `ready` sonst

2. **Tests fuer die Utility**
   - `packages/core/src/lib/drinkWindow.test.ts`
   - Faelle: alle 5 Status, fehlende Werte, Grenzfaelle (genau drinkFrom/drinkUntil)

3. **iOS — Badge-Komponente**
   - `apps/mobile/components/DrinkWindowBadge.tsx`
   - Props: `drinkFrom`, `drinkUntil`
   - Rendert farbigen Badge mit Icon und Text:
     - `ready` → gruen, "Jetzt ideal"
     - `drinkSoon` → orange, "Bald trinken"
     - `tooEarly` → grau, "Noch X Jahre"
     - `pastPeak` → rot, "Ueber Hoehepunkt"
     - `unknown` → kein Badge rendern (return null)
   - In `apps/mobile/components/WineCard.tsx` einbinden, gut sichtbar

4. **Web — Badge-Komponente**
   - `src/components/wine/DrinkWindowBadge.tsx`
   - Gleiche Logik, mit shadcn/ui `Badge` und Tailwind-Farben
   - In Keller-Liste (`src/pages/Cellar.tsx`) einbinden

## Akzeptanzkriterien

- [ ] Utility hat 100% Test-Coverage fuer die Status-Logik
- [ ] Badge erscheint sichtbar auf iOS-Weinkarten
- [ ] Badge erscheint sichtbar in Web-Keller-Liste
- [ ] Wenn beide drink-Werte fehlen, kein Badge (kein leerer Platzhalter)
- [ ] Konsistente Farbpalette zwischen iOS und Web
- [ ] Lint und Typescheck gruen

## Hinweise

- Die Utility lebt in `packages/core`, damit beide Plattformen sie nutzen
- Keine Datenmodell-Aenderungen noetig — nur UI
- Achte auf Performance bei langen Listen (kein teurer Computation pro Render)
