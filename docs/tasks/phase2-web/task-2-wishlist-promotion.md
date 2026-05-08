# Task 2 — Merkliste-Promotion-Flow verbessern

## Auftrag

Mache die Uebernahme von Merkliste-Eintraegen in den Keller robuster. Inklusive Duplikatserkennung und Batch-Promotion.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdateien:**
- `src/pages/Wishlist.tsx`
- `src/pages/AddWine.tsx` (Promotion-Empfang)
- `packages/core/src/lib/wishlistPromotion.ts` (existiert teilweise als `tastingContext.ts`)

## Hintergrund

Heute existiert ein "In den Keller uebernehmen"-Pfad (Backlog 7.4), aber der Flow ist umstaendlich:
- Keine Duplikatserkennung
- Keine Batch-Auswahl
- Tasting-Kontext geht teilweise verloren

## Konkrete Schritte

1. **Duplikatserkennung in `packages/core/src/lib/wishlistPromotion.ts`**
   ```typescript
   export function findPossibleDuplicates(
     candidate: WishlistItem,
     existingWines: Wine[],
   ): Wine[];
   ```
   Heuristik: gleiche Kombination aus normalisierten `name` + `producer` + `vintage`. Levenshtein-Distanz <= 2 als Match.

2. **Wishlist-Page (`src/pages/Wishlist.tsx`)**
   - Checkboxen pro Eintrag
   - Bulk-Button "Ausgewaehlte in den Keller"
   - Pro Eintrag im Detail: Hinweis wenn Duplikate gefunden, Option "trotzdem hinzufuegen" oder "vorhandenen Wein erhoehen"

3. **Promotion-Flow**
   - Bei "vorhandenen Wein erhoehen": API-PUT auf `/api/wines/:id` mit `quantity += 1`
   - Bei "trotzdem hinzufuegen": Standard AddWine-Flow mit vorausgefuelltem Formular
   - Tasting-Kontext (Event, Stand, Lieferant) als Notiz uebernehmen (bestehende Logik)

4. **Wishlist-Eintrag nach Promotion**
   - Status `promoted` setzen + verlinkte `wineId`
   - In Liste sichtbar als "Im Keller" markiert
   - Filter "Nur offene" als Default

## Akzeptanzkriterien

- [ ] Duplikate werden erkannt und angezeigt
- [ ] Batch-Promotion funktioniert
- [ ] "Erhoehen" und "Neu anlegen" beide moeglich
- [ ] Promoted-Eintraege sind in Wishlist als solche markiert
- [ ] Tasting-Kontext landet als Notiz im Wein
- [ ] Lint und Typescheck gruen

## Hinweise

- Wenn Schema-Aenderung noetig (`promoted`, `linkedWineId` auf `WishlistItem`): Migration in `apps/api/prisma/migrations/`
- Fuzzy-Match mit Vorsicht — lieber zu wenig erkennen als false-positive Duplikate
