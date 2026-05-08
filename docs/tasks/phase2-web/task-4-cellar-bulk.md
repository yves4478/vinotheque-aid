# Task 4 — Keller-Bulk-Aktionen

## Auftrag

Ermoegliche im Web-Keller die Selektion mehrerer Weine und Bulk-Operationen: Loeschen, Lagerort aendern, Auf Einkaufsliste setzen, Notiz ergaenzen.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdatei:** `src/pages/Cellar.tsx`

## Konkrete Schritte

1. **Selektions-State**
   - `Set<WineId>` als lokaler State
   - Checkbox in jeder Zeile + "Alle auswaehlen" im Header
   - Persistiert NICHT ueber Reloads

2. **Bulk-Action-Bar**
   - Erscheint sticky am unteren Bildschirmrand wenn `selected.size > 0`
   - Aktionen:
     - **Loeschen** (mit Bestaetigungs-Dialog)
     - **Lagerort aendern** (Dialog mit Input)
     - **Auf Einkaufsliste** (legt fuer jeden ausgewaehlten Wein einen Shopping-Eintrag an)
     - **Notiz anhaengen** (Dialog mit Textfeld, Notiz wird mit Datum-Praefix angehaengt)

3. **API**
   - Pruefen ob Bulk-Endpoints sinnvoll sind
   - Pragmatisch: Promise.all ueber Einzelaufrufe, mit Progress-Toast bei > 5 Items
   - Bei Fehler in einzelnem: Rest weiter, am Ende Summary-Toast

4. **UX-Details**
   - Shift-Click fuer Range-Selektion (optional, nice-to-have)
   - Tastatur: ESC zum Leeren der Selektion
   - Counter "X ausgewaehlt" sichtbar

## Akzeptanzkriterien

- [ ] Selektion via Checkboxen funktioniert
- [ ] Alle 4 Bulk-Aktionen funktionieren auf 10+ Items
- [ ] Bei Fehlern in Einzelitems wird klar berichtet
- [ ] Selektion wird nach Aktion zurueckgesetzt
- [ ] Lint und Typescheck gruen

## Hinweise

- shadcn/ui hat Checkbox-Komponente — verwenden
- React Query: nach Bulk-Action `invalidateQueries(['wines'])`
- Toast via `sonner` (vermutlich bereits installiert)
