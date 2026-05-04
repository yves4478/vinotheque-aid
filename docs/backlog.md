# Produkt-Backlog und Feature-Beschreibungen

Dieses Dokument beschreibt groessere Produktideen fuer Vinotheque Aid und ihren aktuellen Umsetzungsstand. Die Reihenfolge bildet die aktuelle Roadmap ab: Bilder, Degu und Zusatzinfos zuerst; CSV-Import und Mandantenfaehigkeit spaeter.

## Aktueller Umsetzungsentscheid

Plattformstrategie:

- Kurzfristig: PWA-first. Web-App ist primaerer Produktpfad.
- Mittelfristig: Native iOS-App. Apple Vision Framework loest OCR on-device.
- Android: dauerhaft PWA, kein separater nativer Pfad noetig.

Umgesetzt:

- PWA-Fundament: Manifest, Service Worker, App-Icons, Install-Hinweis.
- Erkennung Option 2: Lokale OCR als Standard, Claude Vision nur manueller Fallback pro Scan.
- Scanner in `AddWine.tsx` und `Tasting.tsx` integriert.
- Mehrere Bilder pro Wein: MVP umgesetzt mit gemeinsamen Komprimierungsregeln.
- Wein-Degustation fuer Messen: Web- und Mobile-MVP umgesetzt.
- KI-gestuetzte Zusatzinformationen: MVP als strukturierte Briefing-Ansicht mit Websuch-Link.

Offen:

- Native iOS-App (mittelfristig): Apple Vision Framework fuer Etikett-Erkennung.
- CSV-Upload mit KI-Feldmatching: spaeter.
- Mandantenfaehigkeit: spaeter.

Ergaenzende Strategie:

- Siehe [PWA-first Strategie](./pwa-first-strategy.md) fuer Entscheid, PWA-vs-native Vergleich, Plattformstrategie und Phasen.
- Siehe [Erkennungsstrategie](./recognition-strategy.md) fuer OCR, Assistenz, Confidence-Regeln und nativen Eskalationspfad.

Signal fuer frueheren nativen Start:

- Claude Vision wird bei mehr als einem Drittel der Scans benoetigt.
- Browser-OCR ist im Alltag zu unbrauchbar fuer sinnvolles Vorfuellen.

## 1. Mehrere Bilder pro Wein

### Ziel

Zu einem Wein koennen mehrere Bilder gespeichert werden, damit Flasche, Vorderetikett, Ruecketikett oder Messekontext gemeinsam dokumentiert sind.

### Nutzerwert

Ein einzelnes Bild reicht oft nicht aus. Ruecketiketten enthalten wichtige Informationen, Messefotos helfen bei der Erinnerung, und ein Hauptbild sorgt fuer eine gute Darstellung in Listen.

### Umgesetzter MVP

- Pro Wein koennen bis zu 3 Bilder gespeichert werden.
- Bilder koennen beim Erfassen hinzugefuegt werden.
- Bilder koennen in der Keller-Bearbeitung ergaenzt oder entfernt werden.
- Ein Bild kann als Hauptbild markiert werden.
- Web und Mobile zeigen das Hauptbild in Listen/Karten.
- Bestehende Einzelbilder bleiben ueber Legacy-Fallbacks weiterhin sichtbar.

### Naechste Ausbaustufen

- Bildkomprimierung und Speicherlimits final definieren.
- Cloud Storage oder bestehende Medienablage verbindlich festlegen.
- Etikettenerkennung fuer Bilder gemaess [Erkennungsstrategie](./recognition-strategy.md) vorbereiten.

## 2. Wein-Degustation fuer Messen

### Ziel

Die App bietet einen einfachen Degustationsmodus fuer Messen, Lieferantentermine und Veranstaltungen. Benutzer koennen Weine sehr schnell erfassen, bewerten und spaeter nachbearbeiten.

### Nutzerwert

An Messen bleibt wenig Zeit fuer saubere Datenerfassung. Das Feature haelt den Moment fest: Standliste fotografieren, Flasche fotografieren, Sterne vergeben, optional einen kurzen Kommentar notieren. Die Details koennen spaeter aus Bildern, Notizen oder KI-Unterstuetzung ergaenzt werden.

### Umgesetzter MVP

- Neuer Mobile-Tab "Degu".
- Neue Web-Seite "Wein-Degu" unter `/tasting`.
- Kontextfelder fuer Messe/Event, Lieferant und Stand.
- Optionaler Weinname.
- Bis zu 3 Fotos pro Degu-Eintrag.
- Schnelles 1-5 Sterne-Rating.
- Optionaler Kommentar.
- Speicherung als Merkliste-Eintrag mit Quelle `tasting`.

### Naechste Ausbaustufen

- Offline-Flow explizit testen und absichern.
- Degu-Eintraege spaeter in vollstaendige Weinprofile ueberfuehren.
- Scanner-Erkennung ist umgesetzt (Weinname + Produzent aus Etikett).

## 3. KI-gestuetzte Zusatzinformationen zum Wein

### Ziel

Wenn ein Benutzer einen Wein auswaehlt, kann er zusaetzliche Informationen abrufen. Die Applikation bereitet vorhandene Weindaten strukturiert auf und fuehrt zur Websuche fuer aktuelle Quellen.

### Nutzerwert

Statt selbst nach Produzent, Region, Rebsorten, Stil, Trinkfenster oder Bewertungen zu suchen, bekommt der Benutzer eine kompakte Uebersicht direkt im Weinprofil.

### Umgesetzter MVP

- Web: Zusatzinfos-Dialog im Keller mit KI-Briefing, Fakten, Food-Pairing und Websuch-Link.
- Mobile: Zusatzinfos im Weindetail mit Kurzbriefing und Websuch-Link.
- Die Suche nutzt vorhandene Weindaten wie Name, Produzent, Jahrgang, Region und Land.
- Kostenintensive echte KI-/Webaufrufe werden noch nicht automatisch ausgefuehrt.

### Naechste Ausbaustufen

- Echte KI-Websuche anbinden.
- Quellen speichern und sichtbar zitieren.
- Unsichere oder widerspruechliche Informationen transparent kennzeichnen.
- Caching und Kostenkontrolle fuer externe Aufrufe umsetzen.

## 4. CSV-Upload mit KI-Feldmatching

### Ziel

Benutzer sollen bestehende Weinlisten als CSV-Datei hochladen koennen. Die Applikation erkennt die enthaltenen Spalten automatisch und matched sie mit den internen Feldern von Vinotheque Aid.

### Nutzerwert

Viele Weinlisten existieren bereits in Excel, CSV-Exporten oder Lieferantenlisten. Der Import reduziert manuelle Erfassung massiv und macht den Einstieg in die Applikation schneller.

### Geplanter Funktionsumfang

- CSV-Datei hochladen.
- Spaltennamen und Beispielwerte auslesen.
- KI-Mapping auf interne Felder vorschlagen.
- Vorschau und manuelle Korrektur vor dem Import.
- Fehlerhafte Zeilen markieren und Importzusammenfassung anzeigen.

### Status

Spaeter umsetzen. Dieses Feature bleibt wichtig fuer Onboarding und Datenmigration, hat aber mehr Validierungs- und Duplikatslogik als die aktuellen Foto-/Degu-Features.

## 5. PDF-Import fuer Lieferantenrechnungen und Lieferscheine

### Ziel

Benutzer koennen Rechnungen oder Lieferscheine von Weinlieferanten als PDF hochladen. Die Applikation liest die enthaltenen Weinpositionen aus, zeigt sie strukturiert an und fragt, welche davon in den Keller aufgenommen werden sollen.

### Nutzerwert

Nach einem Einkauf oder einer Lieferung entfaellt das manuelle Abtippen. Der Benutzer laedt einfach die Rechnung oder den Lieferschein hoch, prueft die erkannten Positionen und bestaetigt den Import mit einem Klick. Fehlende Angaben koennen direkt korrigiert werden.

### Geplanter Funktionsumfang

- PDF-Upload via Drag-and-drop oder Dateiauswahl (Web und Mobile).
- Textextraktion aus dem PDF (pdfjs oder KI-Vision bei schlechter Textqualitaet/Scans).
- KI-Parsing der Positionen: Weinname, Produzent, Jahrgang, Menge, Preis pro Flasche, Lieferant.
- Uebersichtstabelle der erkannten Weine mit Checkbox pro Position.
- Manuelle Korrektur einzelner Felder vor dem Import.
- Duplikatserkennung: Abgleich mit bestehenden Kellereintraegen.
- Direktimport der bestaetigten Positionen als neue Kellereintraege.
- Optionale Speicherung des Original-PDFs am Weineintrag.
- Importprotokoll: wieviele Positionen erkannt, importiert, uebersprungen.

### Offene Fragen

- KI-Provider fuer Parsing: Claude Vision API, OpenAI oder reines pdfjs?
- Kostenkontrolle bei vielen grossen PDF-Scans (OCR ist teuer).
- Umgang mit Rechnungsformaten verschiedener Lieferanten (grosse Formatvariation).
- Soll das Original-PDF gespeichert werden und wenn ja wo (Cloud Storage)?

### Status

Spaeter umsetzen. Abhaengig von KI-Websuche-Anbindung (Feature 3) und Cloud Storage (Technische Schuld 6.1). Empfehlung: nach CSV-Import (Feature 4) angehen, da aehnliche Importlogik wiederverwendet werden kann.

## 6. Mandantenfaehigkeit

### Ziel

Vinotheque Aid soll von mehreren Benutzerinnen und Benutzern sowie mehreren Organisationen genutzt werden koennen, ohne dass Daten versehentlich vermischt oder sichtbar werden.

### Nutzerwert

Haendler, Teams, Event-Organisationen oder mehrere Filialen koennen dieselbe Applikation verwenden und trotzdem getrennte Datenbestaende pflegen.

### Geplanter Funktionsumfang

- Benutzer koennen einem Mandanten zugeordnet werden.
- Weinlisten, Bilder, Bewertungen, Merkerlisten und Importe gehoeren zu einem Mandanten.
- Benutzer sehen standardmaessig nur Daten ihres Mandanten.
- Rollen wie Admin, Bearbeiter und Leser werden geprueft.

### Status

Spaeter umsetzen. Mandantenfaehigkeit greift tief in Datenmodell, Berechtigungen, API und UI ein und sollte erst nach den produktnahen Kernflows geplant werden.

## 7. Technische Schulden aus dem MVP

Diese Punkte stammen aus dem Code Review der MVP-Umsetzungen und sind keine Produkt-Features, sondern architektonische Aufgaben. Sie blockieren die aktuelle Funktionalitaet nicht, sollten aber vor breiterem Rollout adressiert werden.

### 7.1 Bildspeicher-Strategie ueber Base64 hinaus

Heute werden Bilder im Web als Base64 in `localStorage` und auf Mobile als File-URIs im `FileSystem.documentDirectory` gespeichert. Bei 3 Bildern pro Wein und vielen Weinen wird das Speicher-Quota auf dem Web schnell knapp; auf Mobile waechst der lokale Speicherbedarf unbegrenzt.

Umgesetzt:
- Globale Speicherwarnung im Web, sobald lokales Bildvolumen kritisch wird.
- Klarere Fehlermeldung bei Quota-/`localStorage`-Fehlern.
- Neue und bearbeitete Web-Eintraege speichern Bilder primaer ueber `images` statt doppelt ueber `images` und `imageData`.

Offen:
- Cloud Storage anbinden (z. B. Supabase Storage, S3 oder vorhandene Medienablage).
- Migrationspfad fuer bestehende lokale Bilder definieren.
- Mobile Speicherstrategie spaeter an denselben Cloud-Pfad anbinden.

### 7.2 Konsistente Bildkomprimierung

Heute komprimiert `AddWine.tsx` auf 800px / 72 % Qualitaet, `Cellar.tsx` jedoch auf 600px / 70 %. Die Logik ist jeweils inline.

Umgesetzt:
- Zentrale `compressImage(file, options)` in [src/lib/imageCompression.ts](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/lib/imageCompression.ts).
- Gemeinsame Bildkonstanten in [packages/core/src/lib/imagePolicy.ts](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/packages/core/src/lib/imagePolicy.ts).
- Web-Flows `AddWine`, `Cellar`, `Tasting` und `Wishlist` nutzen jetzt dieselbe Komprimierungslogik und dieselben Upload-Limits.

Offen:
- Mobile kann spaeter auf dieselben Policy-Konstanten nachgezogen werden, sobald `apps/mobile` wieder Hauptpfad ist.

### 7.3 Datenbank-Constraints fuer `images`

Die Felder `images Json?` auf `Wine` und `WishlistItem` sind unbeschraenkt. Die App-Logik begrenzt auf 3 Bilder, aber die Datenbank tut das nicht.

Umgesetzt:
- API-Validierung fuer `images` in [apps/api/src/routes/wines.ts](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/apps/api/src/routes/wines.ts) und [apps/api/src/routes/wishlist.ts](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/apps/api/src/routes/wishlist.ts).
- Gemeinsame Bild-Payload-Pruefung in [apps/api/src/images.ts](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/apps/api/src/images.ts).
- Datenbank-`CHECK`-Constraints via Migration [apps/api/prisma/migrations/20260501093000_add_images_constraints/migration.sql](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/apps/api/prisma/migrations/20260501093000_add_images_constraints/migration.sql).

### 7.4 Tasting-Felder bei Promotion zu Wein

Wenn ein Degu-Eintrag spaeter zu einem vollstaendigen Wein-Eintrag wird (siehe 2 - Naechste Ausbaustufen), gehen `tastingEvent`, `tastingSupplier` und `tastingStand` heute verloren, weil das `Wine`-Modell diese Felder nicht hat.

Entscheid:
- Tasting-Kontextfelder bleiben auf `WishlistItem` und werden nicht auf das `Wine`-Modell gespiegelt.

Umgesetzt:
- Merkliste-Eintraege koennen jetzt per `In den Keller uebernehmen` in den Add-Wine-Flow uebergeben werden.
- Beim Uebernehmen wird der Tasting-Kontext als Notiz in den Keller-Entwurf uebernommen, damit `tastingEvent`, `tastingSupplier` und `tastingStand` nicht verloren gehen.
- Die Hilfslogik dafuer liegt in [packages/core/src/lib/tastingContext.ts](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/packages/core/src/lib/tastingContext.ts).

### Status

Status nach diesem Branch:

- `7.2` und `7.3` sind im Web/API umgesetzt.
- `7.4` ist funktional geloest ueber den Promotion-Flow in den Keller.
- `7.1` ist bewusst nur teilweise erledigt: Warnung und Duplikatsreduktion sind drin, echter Cloud-Storage bleibt offen.
