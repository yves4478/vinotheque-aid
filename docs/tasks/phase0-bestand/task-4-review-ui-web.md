# Task 0.4 — Review-UI im Web

## Auftrag

Baue im Web eine Review-Oberflaeche fuer Capture Sessions. Nutzer sieht alle erkannten Flaschen pro Foto, kann sie korrigieren, akzeptieren oder verwerfen.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdateien:**
- `src/pages/CaptureReview.tsx` (NEU)
- `src/pages/CaptureSessions.tsx` (NEU — Liste)
- Routing-Eintrag in `src/features/webFeatures.tsx`

**Abhaengigkeit:** Task 0.3 (Backend) muss laufen.

## User Flow

1. Nutzer geht zu `/capture` → Liste seiner Sessions
2. Klickt auf Session mit Status `ready_for_review` → `/capture/:id`
3. Sieht zwei Spalten:
   - Links: Foto mit Bounding Boxes auf erkannten Flaschen
   - Rechts: Liste der Candidates aus diesem Foto
4. Pro Candidate:
   - Felder editierbar (name, producer, vintage, region, country, type, quantity)
   - Hinweis bei moeglichen Duplikaten im bestehenden Keller
   - Buttons: **Akzeptieren** (gruen), **Verwerfen** (rot), **An vorhandenen Wein binden** (Dropdown mit Suche)
5. Footer: "X von Y bearbeitet, Z akzeptiert" + **Bulk-Save** (siehe Task 0.5)

## Konkrete Schritte

### 1. Routing

```typescript
{ path: "/capture", element: <CaptureSessions /> }
{ path: "/capture/:id", element: <CaptureReview /> }
```

In `webFeatures.tsx` als neues Feature `bulkCapture` hinter Feature-Flag.

### 2. Sessions-Liste `src/pages/CaptureSessions.tsx`

- Tabelle mit Spalten: Datum, Status, Anzahl Photos, Anzahl Candidates, Kosten
- Filter "nur offene"
- Tap fuehrt zu Detail

### 3. Review-Page `src/pages/CaptureReview.tsx`

Layout zweispaltig (Desktop), gestapelt auf Mobile:
- Header: Session-Info + Fortschritt
- Foto-Selector (Tabs oder Dropdown): springt zwischen Photos der Session
- Aktuelles Foto mit Bounding-Box-Overlay (Tap auf Box → fokussiert Candidate rechts)
- Candidate-Liste rechts: Cards mit Edit-Feldern

### 4. Bounding-Box-Overlay

- SVG ueber Foto, position relative zu Container
- Box wird highlighted bei Hover/Selektion
- Verwende `bbox` aus Candidate (relative 0-1 Koordinaten)

### 5. Duplikatserkennung

Hook `useDuplicateCheck(candidate)`:
- Sucht im Wein-Cache nach Match auf normalisiertem `name + producer + vintage`
- Zeigt Hinweis: "Moeglicherweise vorhanden: X Y 2018 (3 Flaschen im Keller)"
- Option "An vorhandenen binden" → Bulk-Save erhoeht stattdessen die Menge

### 6. Optimistic UI

- Akzeptieren/Verwerfen sofort sichtbar, API-Aufruf im Hintergrund
- Bei Fehler: Toast + Revert

## Akzeptanzkriterien

- [ ] Sessions-Liste funktioniert
- [ ] Review-Page rendert Photos mit Bounding Boxes
- [ ] Felder editierbar
- [ ] Duplikatserkennung zeigt Treffer aus dem Keller
- [ ] Akzeptieren/Verwerfen aktualisiert UI sofort
- [ ] Mobile-responsive (vertikal gestapelt)
- [ ] Lint und Typescheck gruen

## Hinweise

- shadcn/ui Komponenten: Card, Input, Select, Badge, Button
- Bounding-Box-Overlay: einfach SVG mit `<rect>`-Elementen, kein Library noetig
- Performance: bei 100+ Candidates Virtualisierung nicht zwingend, aber Memoization der Cards
