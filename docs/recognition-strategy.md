# Erkennungsstrategie fuer Vinotheque Aid

## Entscheid

Vinotheque Aid verfolgt fuer Bilderkennung eine kostenlose, browserbasierte Assistenz-Strategie
mit einem optionalen manuellen Claude-Vision-Fallback.

Das bedeutet:

- Standardpfad: Foto → Browser-OCR → Feldvorschlaege → manuelle Bestaetigung.
- Die Erkennung laeuft ohne laufende API-Kosten.
- Die Erkennung speichert nie automatisch.
- Claude Vision ist ein optionaler Fallback pro Scan, nie der Standard.
- Claude Vision ist eine Uebergangsloesung, kein langfristiges Ziel fuer einen scan-lastigen Flow.
- Wenn Claude zu oft benoetigt wird, ist das ein Signal fuer den Wechsel auf einen nativen Scanner-Pfad.

## Warum dieser Weg

Im aktuellen Produkt ist die groesste Chance nicht Vollautomatisierung, sondern weniger
Tipparbeit bei moeglichst wenig Komplexitaet.

Die Strategie passt zu den bereits vorhandenen Bausteinen:

- In `src/components/WineLabelScanner.tsx` existiert bereits Browser-OCR mit `tesseract.js`.
- In `src/pages/AddWine.tsx` gibt es bereits einen Scan-Einstieg fuer das Erfassen.
- In `src/pages/Tasting.tsx` existiert ein schneller Degu-Flow, der spaeter von Erkennung profitieren kann.
- In `src/lib/invoiceParse.ts` existiert bereits ein separater KI-Pfad fuer Rechnungen, der aber
  nicht auf den Etiketten-Flow uebertragen werden soll.

## Problem heute

Der aktuelle Web-Scanner funktioniert technisch, ist aber strategisch noch zu flach:

- OCR und Parsing sitzen gemeinsam in der UI-Komponente.
- Die Heuristik beschraenkt sich auf `producer`, `name` und `vintage`.
- Es gibt keine klaren Confidence-Regeln.
- Es gibt keine gemeinsame, wiederverwendbare Erkennungslogik in `packages/core`.

## Zielbild

Die Erkennung soll als Assistenzsystem funktionieren:

1. Der Benutzer fotografiert Etikett, Ruecketikett oder Liste.
2. Die App liest moeglichst viel lokal aus dem Bild.
3. Die App schlaegt nur die Felder vor, die mit vertretbarer Sicherheit erkannt wurden.
4. Der Benutzer uebernimmt, korrigiert oder verwirft den Vorschlag.
5. Erst danach wird gespeichert.

Erfolg bedeutet nicht "perfekte automatische Weinerkennung", sondern spuerbar weniger
manuelle Eingabe.

## Leitprinzipien

### 1. OCR ist nur ein Zwischenschritt

OCR allein erkennt Text, aber noch keinen Wein. Die Produktlogik besteht immer aus
zwei Schritten: Text aus Bild holen, dann Text in Weinfelder uebersetzen.

### 2. Nur Assistenz, keine Automatik

Die App darf durch Erkennung nie still falsche Datensaetze erzeugen. Darum gilt:

- keine Auto-Saves
- keine stillen Ueberschreibungen
- nur bewusste Uebernahme durch den Benutzer

### 3. Kostenfrei zuerst, teuer spaeter optional

Der Standardweg bleibt lokal und kostenlos. Claude Vision ist erst sinnvoll, wenn echte
Nutzung zeigt, dass Browser-OCR zu oft unbrauchbar ist.

Wichtig fuer die Schluesselverwaltung: Ein Anthropic-Key fuer den manuellen Claude-Fallback
lebt im Browser und kann damit auch in DevTools sichtbar sein. Es darf hier deshalb nur
ein benutzerseitiger Key hinterlegt werden, niemals ein Server- oder Team-Secret.

### 4. Gemeinsame Logik in `packages/core`

Die Interpretations- und Normalisierungslogik gehoert in wiederverwendbare Funktionen,
damit spaeter mehrere Einstiege denselben Kern nutzen koennen.

## Erkennungsumfang

### Phase A — Etikett-Assistenz fuer Wein erfassen

Erkannte Felder im MVP:

- `vintage` (vierstellige Jahreszahl — hohe Zuverlaessigkeit)
- `producer` (aus Zeilen-Position heuristisch — mittlere Zuverlaessigkeit)
- `name` (aus Zeilen-Position heuristisch — mittlere Zuverlaessigkeit)

Moegliche spaetere Felder:

- `region`, `country`, `type`, `grape`

### Phase B — Erkennung fuer Degu-Flow

Moegliche Inputs: Flaschenfoto, Etikett, Standliste, Ruecketikett.
Nutzen: schneller Vorfuellwert fuer Weinname waehrend Messen.

### Phase C — Dokumente und Listen

Lieferantenlisten, Preislisten, Rechnungen, Lieferscheine. Dieser Bereich ist absichtlich
getrennt vom Etiketten-Flow. Fuer strukturierte Dokumente kann ein KI-Pfad sinnvoll sein,
ohne dass der Standard-Scanner teuer wird.

## Empfohlene Datenform

```ts
type RecognizedWineDraft = {
  rawText: string;
  fields: {
    producer?: { value: string; confidence: "high" | "medium" | "low" };
    name?:     { value: string; confidence: "high" | "medium" | "low" };
    vintage?:  { value: number; confidence: "high" | "medium" | "low" };
    region?:   { value: string; confidence: "high" | "medium" | "low" };
    country?:  { value: string; confidence: "high" | "medium" | "low" };
    type?:     { value: "rot" | "weiss" | "rosé" | "schaumwein" | "dessert"; confidence: "high" | "medium" | "low" };
    grape?:    { value: string; confidence: "high" | "medium" | "low" };
  };
  warnings: string[];
};
```

## Confidence-Regeln

### Hoch

- Vierstelliger Jahrgang klar erkannt.
- Verhalten: Feld darf prominent vorgeschlagen werden.

### Mittel

- Plausibler Kandidat aus Zeilenposition oder bekanntem Muster, aber nicht eindeutig.
- Verhalten: Feld als Vorschlag markieren, Nutzer muss bestaetigen.

### Tief

- Unsicher, verrauscht oder mehrdeutig.
- Verhalten: nicht automatisch ins Formular schreiben, optional in "weitere Hinweise" anzeigen.

Wichtig: Vintage ist der einzige Feldtyp, der regelmaessig "high confidence" erreicht.
Producer und name starten konservativ bei "medium" bis die Heuristik durch echte Labels
kalibriert ist.

## Null-Kosten-Roadmap

### Schritt 1 — Parsing aus der UI loesen

Ziel: `parseWineLabel` aus `WineLabelScanner.tsx` in `packages/core` verschieben.
Nutzen: gemeinsame Logik, testbarer Kern, wiederverwendbar fuer mehrere Scanner-Einstiege.

### Schritt 2 — Bildvorverarbeitung verbessern

Ziel: zentrale Bildkomprimierung, Ausrichtung und Kontrast fuer OCR optimieren.
Nutzen: bessere OCR-Eingabe ohne externe Kosten.
Reihenfolge: parallel zu Schritt 1, nicht danach — ein besseres Bild bringt mehr als
besseres Parsing auf schlechtem Text.

### Schritt 3 — Erkennung konservativer machen

Ziel: nur sichere Felder automatisch vorfuellen, Rohtext und Warnungen sichtbar machen.
Nutzen: weniger stille Fehlbefuellungen.

### Schritt 4 — Degu-Flow anbinden

Ziel: Erkennung auch im Degu-Kontext nutzbar machen.
Nutzen: derselbe Kern bedient mehrere Nutzerfluesse.

### Schritt 5 — Erst danach ueber Fallbacks entscheiden

Erst wenn echte Nutzungsdaten vorliegen, entscheiden ob und wie Claude Vision oder
ein nativer Scanner-Pfad ergaenzt werden soll.

## Umgang mit Claude Vision als Fallback

Claude Vision ist eine temporaere Uebergangsloesung — kein langfristiges Ziel fuer einen
scan-lastigen Kernflow.

Sinnvoll als Fallback, wenn:

- Browser-OCR-Ergebnis ist schwach oder leer
- Benutzer loest den Fallback bewusst aus

Wenn aktiviert, gilt:

- `disabled by default`
- keine automatische Aktivierung
- Aktivierung nur per bewusster Benutzeraktion: "Mit Claude Vision erneut versuchen"
- gilt nur fuer den aktuellen Scan, kein globaler Automatismus
- weiterhin manuelle Bestaetigung vor Speicherung
- Kosten pro Scan sichtbar machen

Empfohlene Produkt-CTAs:

- Standard: "Etikett scannen" (Browser-OCR, kostenlos)
- Nur bei schwachem Ergebnis: "Mit Claude Vision erneut versuchen" (pro Scan, optional)

## Eskalations-Trigger fuer nativen Scanner-Pfad

Wenn Claude Vision zu oft benoetigt wird, ist das kein Zeichen dass Claude besser
konfiguriert werden muss. Es ist ein Signal, dass der Produktwert einen nativen
Scanner-Pfad rechtfertigt.

Konkrete Trigger:

- Browser-OCR liefert bei mehr als der Haelfte der Scans kein brauchbares Ergebnis
- Claude Vision wird regelmaessig und nicht nur als Ausnahme eingesetzt
- Die Scan-UX wird als frustrierend wahrgenommen

Naechster Schritt in diesem Fall:

- iPhone: Apple Vision Framework (on-device, kostenlos, sehr gute Qualitaet)
- Android: Google ML Kit (on-device, kostenlos, sehr gute Qualitaet)

Dieser Schritt erfordert eine native App oder zumindest eine native Kapsel (z.B. Capacitor
mit nativem Scanner-Plugin). Die PWA-Basis bleibt bestehen; der Scanner wird als nativer
Einstiegspunkt ergaenzt.

Claude Vision ist dann abgeloest, nicht ergaenzt. Das Ziel ist kostenlose, starke
On-Device-Erkennung — nicht dauerhaft pro Scan zu bezahlen.

## Was bewusst nicht Teil des MVP ist

- Perfekte Extraktion von Region, Land, Rebsorte und Stil aus jedem Etikett
- Echtzeit-Kamera-Erkennung
- Automatische Duplikaterkennung aus Scanresultaten
- Zwingende Integration externer Modelle
- Kostenpflichtige Erkennung im Standardpfad

## Erfolgskriterien

Die Strategie ist erfolgreich, wenn:

- der Scan bei einem sinnvollen Anteil der Bilder `name`, `producer` oder `vintage` brauchbar vorfuellt
- Benutzer sichtbar weniger tippen muessen
- die Erkennung keine versteckten Fehlimporte erzeugt
- der Standardpfad ohne laufende API-Kosten funktioniert
- Claude Vision selten gebraucht wird

## Beziehung zur PWA-Strategie

Diese Erkennungsstrategie ist eine Vertiefung der Plattformentscheidung in
[docs/pwa-first-strategy.md](./pwa-first-strategy.md).

Reihenfolge:

1. PWA-Fundament
2. Mobile Erfassung in der PWA
3. Erkennung als Assistenz (dieser Scope)
4. Strategische Neubewertung nach echter Nutzung
