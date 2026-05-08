# Task 3 — Einkaufsliste mit Priorisierung und Haendler-Verknuepfung

## Auftrag

Erweitere die Web-Einkaufsliste um Priorisierung und Verknuepfung mit Weinhaendlern. Ziel: aus der Einkaufsliste eine fertige Bestellliste pro Haendler generieren koennen.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdateien:**
- `src/pages/Shopping.tsx`
- `apps/api/prisma/schema.prisma` (Schema-Erweiterung)

## Hintergrund

Die Einkaufsliste ist heute eine flache Liste mit Checkboxen. Fuer echte Planung fehlen:
- Priorisierung (was zuerst kaufen)
- Haendler-Zuordnung (wo bestellen)
- Gruppierung pro Haendler beim Bestellen

## Konkrete Schritte

1. **Schema erweitern**

   `ShoppingItem` ergaenzen:
   ```prisma
   priority   Int?      // 1 = hoch, 2 = mittel, 3 = niedrig
   merchantId String?
   merchant   Merchant? @relation(fields: [merchantId], references: [id])
   ```
   Migration via `prisma migrate dev --name shopping_priority_merchant`.

2. **API anpassen** (`apps/api/src/routes/shopping.ts`)
   - PUT akzeptiert `priority` und `merchantId`
   - GET liefert `merchant`-Objekt mit (relation)

3. **UI in `src/pages/Shopping.tsx`**
   - Sortierung nach Priorisierung (Default), sekundaer nach `createdAt`
   - Pro Eintrag: Dropdown Priorisierung + Dropdown Haendler
   - Filter: Nur offene, Nach Haendler
   - **Bestellansicht**: Knopf "Pro Haendler gruppieren" → zeigt Items gruppiert nach Haendler, mit Summen und Druck/Export-Option (PDF oder einfach Druckansicht)

4. **Aus Wein nachbestellen**
   - Im Keller: Button "Nachbestellen" auf Weinkarten mit `quantity <= drinkSoonThreshold` (z.B. <= 1)
   - Erstellt Shopping-Eintrag vorbefuellt mit Wein-Daten und letztem Haendler

## Akzeptanzkriterien

- [ ] Schema-Migration laeuft sauber durch
- [ ] Priorisierung speicherbar und sichtbar
- [ ] Haendler-Verknuepfung funktioniert
- [ ] Gruppierung pro Haendler erzeugt brauchbare Liste
- [ ] "Nachbestellen"-Button im Keller funktioniert
- [ ] Lint und Typescheck gruen

## Hinweise

- Bei "Pro Haendler gruppieren": einfache Tailwind-Print-CSS reicht, kein PDF-Generator noetig
- Bestehende `Merchant`-Relations pruefen — Haendler-Modell sollte existieren
