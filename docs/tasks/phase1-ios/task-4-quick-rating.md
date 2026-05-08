# Task 4 — Schnelles Rating nach dem Trinken

## Auftrag

Wenn ein Wein via "Heute oeffnen" geoeffnet wurde, biete einen einfachen Rating-Flow: Sterne 1–5 + optionale Kurznotiz.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdateien:**
- `apps/mobile/app/wine/rate/[id].tsx` (NEU)
- `apps/mobile/app/(tabs)/index.tsx` (Anpassung — pending-Rating-Sektion)

**Abhaengigkeit:** Task 3 muss fertig sein.

## Hintergrund

Nach Task 3 stehen Eintraege in `AsyncStorage.pendingRatings`. Diese sollen prominent als "Offene Bewertungen" angezeigt werden, damit der Nutzer beim naechsten App-Aufruf einfach bewerten kann.

## Konkrete Schritte

1. **Pending-Ratings-Banner auf Keller-Tab**
   - In `apps/mobile/app/(tabs)/index.tsx` oben einen Banner einfuegen wenn `pendingRatings` nicht leer ist
   - Text: "X offene Bewertungen" — Tap fuehrt zur ersten

2. **Rating-Screen `apps/mobile/app/wine/rate/[id].tsx`**
   - Zeigt: Wein-Name, Produzent, Jahrgang, Anlass (aus pendingRating)
   - Sterne 1–5 (Tap-Auswahl)
   - Kurznotiz (optional, max 280 Zeichen)
   - Button "Speichern" / "Spaeter"

3. **Beim Speichern**
   - Update `Wine.personalRating` und `Wine.notes` (anhaengen mit Zeitstempel)
   - Entferne Eintrag aus `pendingRatings`
   - Navigation zurueck

4. **Beim "Spaeter"**
   - Eintrag bleibt in `pendingRatings`
   - Optional: nach 7 Tagen automatisch verfallen lassen

## Datenformat `pendingRatings` (AsyncStorage Key: `vinotheque.pendingRatings`)

```json
{
  "<wineId>": {
    "openedAt": "2026-05-08T18:00:00Z",
    "occasion": "Abendessen mit Freunden"
  }
}
```

## Akzeptanzkriterien

- [ ] Banner erscheint nur wenn pendingRatings nicht leer
- [ ] Rating-Screen rendert Wein-Daten korrekt
- [ ] Speichern updated Wein und entfernt pending-Eintrag
- [ ] "Spaeter" laesst Eintrag in pending
- [ ] Lint und Typescheck gruen

## Hinweise

- Verwende `expo-haptics` fuer Feedback bei Sterne-Auswahl (sanfter Haptic-Tap)
- Notiz wird an `Wine.notes` angehaengt mit Format: `\n\n[YYYY-MM-DD] <Anlass>: <Notiz>`
- Die personalRating ist single-value — bei mehrfachem Rating ueberschreiben oder Durchschnitt? **Entscheid: ueberschreiben mit dem letzten Rating, alte Notiz bleibt im Notes-Feld erhalten.**
