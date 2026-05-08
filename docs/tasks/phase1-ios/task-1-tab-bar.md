# Task 1 — iOS Tab-Bar reduzieren

## Auftrag

Reduziere die Tab-Bar der iOS-App auf 4 fokussierte Tabs. Verstecke nebensaechliche Features in einem "Mehr"-Bereich oder entferne sie aus der Hauptnavigation.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Zielordner:** `apps/mobile/app/(tabs)/`

## Hintergrund

Heute hat die iOS-App 7 Tabs: Keller, Erfassen, Map, Settings, Shopping, Tasting, Wishlist. Das ist zu viel und verwaessert den Fokus. Laut [Plattform-Strategie](../../platform-strategy.md) soll iOS nur die mobilen Kernflows abdecken.

## Soll-Zustand: 4 Tabs

| Tab | Datei | Inhalt |
|---|---|---|
| **Keller** | `(tabs)/index.tsx` | Bestand, Suche, Tap → Detail/"Heute oeffnen" |
| **Erfassen** | `(tabs)/add.tsx` | Wein hinzufuegen mit Scanner |
| **Degu** | `(tabs)/tasting.tsx` | Messen-/Tastingmodus |
| **Mehr** | `(tabs)/more.tsx` (NEU) | Settings, Map, Shopping (Quick-Add), Wishlist (Read-only), App-Info |

## Konkrete Schritte

1. **`(tabs)/_layout.tsx` aktualisieren**
   - Nur noch 4 Tabs in `<Tabs>` definieren: `index`, `add`, `tasting`, `more`
   - Andere Tabs als `href: null` markieren, damit sie weiterhin als Routen erreichbar sind, aber nicht in der Tab-Bar erscheinen
   - Beispiel: `<Tabs.Screen name="map" options={{ href: null }} />`

2. **`(tabs)/more.tsx` neu anlegen**
   - Liste mit Eintraegen: Einstellungen, Weinregionen, Einkaufsliste, Merkliste, Kellerbuch (falls vorhanden), App-Version
   - Jeder Eintrag navigiert via `router.push("/settings")` etc.
   - Verwende `Pressable` und das bestehende Styling (siehe `settings.tsx` als Referenz)

3. **Wishlist-Tab umbauen**
   - Aus der Tab-Bar entfernen
   - Auf der Seite einen Hinweis: "Merkliste-Verwaltung erfolgt in der Web-App. Hier kannst du Eintraege ansehen und schnell hinzufuegen."
   - Bearbeiten/Loeschen-Funktionen ausgrauen oder entfernen

4. **Shopping-Tab umbauen** (siehe Task 6 fuer Details)
   - Aus Tab-Bar entfernen, ueber "Mehr" erreichbar
   - Reduzieren auf "Schnell hinzufuegen" (Task 6 macht das im Detail)

5. **Map-Tab**
   - Aus Tab-Bar entfernen, ueber "Mehr" erreichbar
   - Sonst keine Aenderung

## Akzeptanzkriterien

- [ ] iOS-App zeigt genau 4 Tabs am unteren Bildschirmrand
- [ ] "Mehr"-Tab listet alle versteckten Features
- [ ] Alle bisherigen Routen funktionieren weiterhin (Deep-Links nicht brechen)
- [ ] Lint und Typescheck gruen
- [ ] Smoke-Test: Jeder der 4 Haupttabs oeffnet sich, "Mehr" navigiert zu Settings/Map/Shopping/Wishlist

## Hinweise

- `expo-router` Doku zu Tab-Optionen: `href: null` versteckt aus Tab-Bar
- Bestehende Icons aus `lucide-react-native` weiterverwenden
- Das bestehende `_layout.tsx` als Vorlage nehmen — nicht komplett neu schreiben
