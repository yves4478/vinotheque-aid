# Erkennungsstrategie fuer Vinotheque Aid

## Entscheid

Vinotheque Aid verfolgt fuer Bilderkennung kurzfristig eine browserbasierte Assistenz-Strategie nach `Option 2`.

Das bedeutet:

- Standardpfad: `Foto -> Browser-OCR -> Feldvorschlaege -> manuelle Bestaetigung`
- Die Erkennung laeuft ohne laufende API-Kosten.
- Die Erkennung speichert nie automatisch.
- Claude Vision ist ein optionaler Fallback pro Scan, nie der Standard.
- Claude Vision ist eine Uebergangsloesung, kein langfristiges Ziel fuer einen scan-lastigen Flow.
- Wenn Claude zu oft benoetigt wird, ist das ein Signal fuer den Wechsel auf einen nativen Scanner-Pfad.

## Warum dieser Weg

Im aktuellen Produkt ist die groesste Chance nicht Vollautomatisierung, sondern weniger Tipparbeit bei moeglichst wenig Komplexitaet.

Fuer das aktuelle Nutzungsprofil passt das:

- Scannen ist wichtig, aber nicht taeglich.
- Die App wird vor allem beim Erfassen und ansonsten mehrere Male pro Woche genutzt.
- Gute Erkennung ist nuetzlich, aber noch kein Grund fuer zwei getrennte Produktpfade.
- Ein manueller Claude-Fallback pro Einzelfall ist wirtschaftlich vertretbar.

Die Strategie passt zu den bereits vorhandenen Bausteinen:

- In [src/components/WineLabelScanner.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/components/WineLabelScanner.tsx) existiert bereits Browser-OCR mit `tesseract.js`.
- In [src/pages/AddWine.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/pages/AddWine.tsx) gibt es bereits einen Scan-Einstieg fuer das Erfassen.
- In [src/pages/Tasting.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/pages/Tasting.tsx) existiert ein schneller Degu-Flow, der spaeter von Erkennung profitieren kann.
- In [src/lib/invoiceParse.ts](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/lib/invoiceParse.ts) existiert bereits ein separater KI-Pfad fuer Rechnungen, der aber nicht auf den Etiketten-Flow uebertragen werden soll.

## Problem heute

Der aktuelle Web-Scanner funktioniert technisch, ist aber strategisch noch zu flach:

- OCR und Parsing sitzen gemeinsam in der UI-Komponente.
- Die Heuristik beschraenkt sich heute praktisch auf `producer`, `name` und `vintage`.
- Die Erkennung ist noch stark an den Web-Add-Wine-Flow gekoppelt.
- Es gibt keine klaren Confidence-Regeln.
- Es gibt keine gemeinsame, wiederverwendbare Erkennungslogik in `packages/core`.

## Zielbild

Die Erkennung soll als Assistenzsystem funktionieren:

1. Der Benutzer fotografiert Etikett, Ruecketikett oder Liste.
2. Die App liest moeglichst viel lokal aus dem Bild.
3. Die App schlaegt nur die Felder vor, die mit vertretbarer Sicherheit erkannt wurden.
4. Der Benutzer uebernimmt, korrigiert oder verwirft den Vorschlag.
5. Erst danach wird gespeichert.

Erfolg bedeutet nicht "perfekte automatische Weinerkennung", sondern spuerbar weniger manuelle Eingabe.

## Leitprinzipien

### 1. OCR ist nur ein Zwischenschritt

OCR allein erkennt Text, aber noch keinen Wein. Die Produktlogik besteht immer aus zwei Schritten:

- `Text aus Bild holen`
- `Text in Weinfelder uebersetzen`

### 2. Nur Assistenz, keine Automatik

Die App darf durch Erkennung nie still falsche Datensaetze erzeugen.

Darum gilt:

- keine Auto-Saves
- keine stillen Ueberschreibungen
- nur bewusste Uebernahme durch den Benutzer

### 3. Kostenfrei zuerst, teuer spaeter optional

Der Standardweg bleibt lokal und kostenlos.

Claude Vision ist erst sinnvoll, wenn echte Nutzung zeigt, dass:

- Browser-OCR zu oft unbrauchbar ist
- Etiketten sehr heterogen sind
- der Produktwert die laufenden Kosten rechtfertigt

Wenn dieser Punkt erreicht ist, ist Claude Vision nicht das strategische Endziel, sondern die Bruecke zu einem nativen Scanner-Pfad.

Wichtig fuer die Schluesselverwaltung: Ein Anthropic-Key fuer den manuellen Claude-Fallback
lebt im Browser und kann damit auch in DevTools sichtbar sein. Es darf hier deshalb nur
ein benutzerseitiger Key hinterlegt werden, niemals ein Server- oder Team-Secret.

### 4. Gemeinsame Logik in `packages/core`

Die Interpretations- und Normalisierungslogik gehoert in wiederverwendbare Funktionen, damit spaeter mehrere Einstiege denselben Kern nutzen koennen.

## Erkennungsumfang

### Phase A - Etikett-Assistenz fuer Wein erfassen

Erkannte Felder im MVP:

- `vintage` als vierstellige Jahreszahl mit relativ hoher Zuverlaessigkeit
- `producer` als heuristischer Vorschlag mit mittlerer Zuverlaessigkeit
- `name` als heuristischer Vorschlag mit mittlerer Zuverlaessigkeit

Moegliche spaetere Felder:

- `region`
- `country`
- `type`
- `grape`

Diese Phase ist der wichtigste erste Schritt, weil sie direkt in den Kernflow `Wein erfassen` einzahlt.

### Phase B - Erkennung fuer Degu-Flow

Moegliche Inputs:

- Flaschenfoto
- Etikett
- Standliste
- Ruecketikett

Nutzen:

- schneller Vorfuellwert fuer Weinname
- spaeter moeglicher Vorschlag fuer Produzent
- weniger manuelle Eingabe waehrend Messen

### Phase C - Dokumente und Listen

Anwendungsfaelle:

- Lieferantenlisten
- Preislisten
- Rechnungen
- Lieferscheine

Dieser Bereich ist absichtlich getrennt vom Etiketten-Flow. Fuer strukturierte Dokumente kann ein KI-Pfad sinnvoll sein, ohne dass der Standard-Scanner teuer wird.

## Zielarchitektur

Die Erkennung soll in vier Schichten organisiert werden.

### 1. Capture

Verantwortung:

- Bild aufnehmen oder auswaehlen
- Bild komprimieren
- Bild lokal vorverarbeiten

Typische Orte:

- [src/components/WineLabelScanner.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/components/WineLabelScanner.tsx)
- [src/pages/AddWine.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/pages/AddWine.tsx)
- spaeter [src/pages/Tasting.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/pages/Tasting.tsx)

### 2. OCR

Verantwortung:

- Text lokal aus dem Bild extrahieren
- Rohtext plus optional Strukturinformationen liefern

Standardtechnologie:

- `tesseract.js` im Browser

### 3. Interpretation

Verantwortung:

- irrelevante Textzeilen entfernen
- Jahrgang, Produzent und Weinname heuristisch ableiten
- spaeter weitere Felder vorschlagen
- Confidence pro Feld bestimmen

Diese Logik gehoert in `packages/core`.

### 4. Review

Verantwortung:

- Vorschlaege anzeigen
- Benutzer uebernimmt oder verwirft
- nur bestaetigte Werte ins Formular schreiben

## Empfohlene Datenform

```ts
type RecognizedWineDraft = {
  rawText: string;
  fields: {
    producer?: { value: string; confidence: "high" | "medium" | "low" };
    name?: { value: string; confidence: "high" | "medium" | "low" };
    vintage?: { value: number; confidence: "high" | "medium" | "low" };
    region?: { value: string; confidence: "high" | "medium" | "low" };
    country?: { value: string; confidence: "high" | "medium" | "low" };
    type?: { value: "rot" | "weiss" | "rosé" | "schaumwein" | "dessert"; confidence: "high" | "medium" | "low" };
    grape?: { value: string; confidence: "high" | "medium" | "low" };
  };
  warnings: string[];
};
```

Das ist noch kein Implementierungszwang, aber die strategische Richtung.

## Confidence-Regeln

### Hoch

- vierstelliger Jahrgang klar erkannt
- Verhalten: Feld darf prominent vorgeschlagen werden

### Mittel

- plausibler Kandidat aus Zeilenposition oder bekanntem Muster, aber nicht eindeutig
- Verhalten: Feld als Vorschlag markieren, Nutzer muss bestaetigen

### Tief

- unsicher, verrauscht oder mehrdeutig
- Verhalten: nicht automatisch ins Formular schreiben, optional in "weitere Hinweise" anzeigen

Wichtig: `vintage` ist der einzige Feldtyp, der im MVP regelmaessig `high confidence` erreichen wird. `producer` und `name` starten bewusst konservativ bei `medium`, bis die Heuristik mit echten Labels kalibriert ist.

## Null-Kosten-Roadmap

### Schritt 1 - Parsing aus der UI loesen

Ziel:

- `parseWineLabel` aus `WineLabelScanner.tsx` in `packages/core` verschieben

Nutzen:

- gemeinsame Logik
- testbarer Kern
- spaeter nutzbar fuer weitere Scanner-Einstiege

### Schritt 2 - Bildvorverarbeitung verbessern

Ziel:

- zentrale Bildkomprimierung
- Ausrichtung, Groesse und Kontrast fuer OCR verbessern

Nutzen:

- bessere OCR-Eingabe ohne externe Kosten

### Schritt 3 - Erkennung konservativer machen

Ziel:

- nur sichere Felder automatisch vorfuellen
- Rohtext und Warnungen sichtbar machen

Nutzen:

- weniger stille Fehlbefuellungen

### Schritt 4 - Degu-Flow anbinden

Ziel:

- Erkennung auch im Degu-Kontext nutzbar machen

Nutzen:

- derselbe Kern bedient mehrere Nutzerfluesse

### Schritt 5 - Erst danach ueber Fallbacks entscheiden

Erst wenn echte Nutzungsdaten vorliegen, entscheiden ob und wie Claude Vision oder ein nativer Scanner-Pfad ergaenzt werden soll.

## Umgang mit Claude Vision als Fallback

Claude Vision ist eine temporaere Uebergangsloesung, kein langfristiges Ziel fuer einen scan-lastigen Kernflow.

Sinnvoll als Fallback, wenn:

- das Browser-OCR-Ergebnis schwach oder leer ist
- der Benutzer den Fallback bewusst ausloest

Wenn aktiviert, gilt:

- `disabled by default`
- keine automatische Aktivierung
- Aktivierung nur per bewusster Benutzeraktion: `Mit Claude Vision erneut versuchen`
- gilt nur fuer den aktuellen Scan, kein globaler Automatismus
- weiterhin manuelle Bestaetigung vor Speicherung
- Kosten pro Scan sichtbar machen

Empfohlene Produkt-CTAs:

- Standard: `Etikett scannen` fuer Browser-OCR
- Nur bei schwachem Ergebnis: `Mit Claude Vision erneut versuchen`

## Re-Evaluate-Trigger fuer nativen Scanner-Pfad

Wenn Claude Vision zu oft benoetigt wird, ist das kein Zeichen, dass Claude besser konfiguriert werden muss. Es ist ein Signal, dass der Produktwert einen nativen Scanner-Pfad rechtfertigt.

Konkrete Trigger:

- Claude Vision wird bei mehr als ungefaehr einem Drittel der Scans benoetigt
- Browser-OCR liefert regelmaessig kein brauchbares Ergebnis
- der Scan-Flow bremst das Erfassen trotz Fallback sichtbar
- gute Erkennung ohne Netz wird wichtig

Naechster Schritt in diesem Fall:

- iPhone: `Apple Vision` bzw. Apple Vision Framework
- Android: `Google ML Kit`

Dieser Schritt erfordert eine native App oder zumindest eine native Kapsel mit nativer Scanner-Integration. Die PWA-Basis kann bestehen bleiben; der Scanner wird als nativer Einstiegspunkt ergaenzt.

Claude Vision ist dann abgeloest, nicht weiter ausgebaut. Das Ziel ist kostenlose, starke On-Device-Erkennung, nicht dauerhaft pro Scan zu bezahlen.

## Was bewusst nicht Teil des MVP ist

- perfekte Extraktion von Region, Land, Rebsorte und Stil aus jedem Etikett
- Echtzeit-Kamera-Erkennung
- automatische Duplikaterkennung aus Scanresultaten
- zwingende Integration externer Modelle
- kostenpflichtige Erkennung im Standardpfad

## Erfolgskriterien

Die Strategie ist erfolgreich, wenn:

- der Scan bei einem sinnvollen Anteil der Bilder `name`, `producer` oder `vintage` brauchbar vorfuellt
- Benutzer sichtbar weniger tippen muessen
- die Erkennung keine versteckten Fehlimporte erzeugt
- der Standardpfad ohne laufende API-Kosten funktioniert
- Claude Vision selten gebraucht wird

## Beziehung zur PWA-Strategie

Diese Erkennungsstrategie ist eine Vertiefung der Plattformentscheidung in [docs/pwa-first-strategy.md](./pwa-first-strategy.md).

Reihenfolge:

1. PWA-Fundament
2. Mobile Erfassung in der PWA
3. Erkennung als Assistenz
4. Strategische Neubewertung nach echter Nutzung

Fuer die aktuelle Entscheidung heisst das konkret:

- `jetzt Option 2`
- `Claude Vision nur manuell pro Scan`
- `native On-Device-Erkennung erst bei real bewiesenem Bedarf`
