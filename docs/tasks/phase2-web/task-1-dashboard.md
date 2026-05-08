# Task 1 — Dashboard mit Trinkreife-Analyse

## Auftrag

Baue das Web-Dashboard (`/`) zu einem echten Uebersichts-Tool aus. Hauptelement ist eine Trinkreife-Analyse, ergaenzt um Bestand und Keller-Wert.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdatei:** `src/pages/Index.tsx`

**Abhaengigkeit:** `packages/core/src/lib/drinkWindow.ts` aus Phase 1 Task 2 muss existieren.

## Hintergrund

Heute ist `Index.tsx` ein generisches Dashboard ohne klaren Fokus. Der Mehrwert liegt in der Auswertung des Bestands.

## Soll-Zustand

Vier Sektionen, von oben nach unten:

### 1. Trinkreife-Karten (Hero-Sektion)

Vier Karten nebeneinander (responsive: auf Mobile gestapelt):

| Karte | Bedingung | Farbe |
|---|---|---|
| **Jetzt ideal** | drinkWindow.kind = "ready" | Gruen |
| **Bald trinken** | drinkWindow.kind = "drinkSoon" | Orange |
| **Noch reifen lassen** | drinkWindow.kind = "tooEarly" | Grau |
| **Achtung Hoehepunkt** | drinkWindow.kind = "pastPeak" | Rot |

Jede Karte zeigt: Anzahl Weine, Tap fuehrt zu gefilterter Keller-Liste.

### 2. Bestand nach Typ

Donut-Chart (Recharts) mit Anteilen Rot/Weiss/Rose/Schaumwein/Dessert.
Daneben: absolute Zahlen.

### 3. Keller-Wert

- Summe `quantity * purchasePrice` ueber alle Weine mit gesetztem Preis
- Hinweis wenn Preise fehlen: "X Weine ohne Preis erfasst"
- Optional: Wert nach Typ aufgeschluesselt

### 4. Letzte Bewegungen

- Liste der letzten 5 CellarMovements (in/out)
- Tap fuehrt zum Wein-Detail

## Konkrete Schritte

1. **Analytics-Hook `src/hooks/useCellarAnalytics.ts`**
   ```typescript
   export function useCellarAnalytics(): {
     drinkWindowCounts: Record<DrinkWindowStatus["kind"], number>;
     byType: Record<WineType, { count: number; bottles: number }>;
     totalValue: number;
     winesWithoutPrice: number;
     recentMovements: CellarMovement[];
   };
   ```
   Verwendet React Query Cache fuer Wines + Movements, berechnet via `useMemo`.

2. **Dashboard-Layout `src/pages/Index.tsx` neu schreiben**
   - Verwende vorhandene shadcn/ui Card-Komponenten
   - Recharts fuer Donut: Library ist bereits installiert (siehe package.json)
   - Filter-Links via `useNavigate("/cellar?filter=ready")` — Cellar-Page muss Query-Param interpretieren

3. **Keller-Filter ergaenzen `src/pages/Cellar.tsx`**
   - URL-Param `?filter=ready|drinkSoon|tooEarly|pastPeak` lesen
   - Liste entsprechend vorfiltern

## Akzeptanzkriterien

- [ ] Dashboard zeigt 4 Trinkreife-Karten mit korrekten Zahlen
- [ ] Tap auf Karte fuehrt zu gefilterter Keller-Liste
- [ ] Donut-Chart funktioniert mit echten Daten
- [ ] Keller-Wert wird korrekt berechnet (Sonderfall: leere Preise)
- [ ] Letzte 5 Bewegungen sichtbar
- [ ] Mobile-responsive
- [ ] Lint und Typescheck gruen

## Hinweise

- Recharts ist bereits installiert
- Bei sehr grossen Kellern (>1000 Weine): `useMemo` zwingend, sonst lagging UI
- Keine API-Aenderung noetig — nur Aggregation im Client
