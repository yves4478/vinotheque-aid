# Task 5 — Offline-Erfassung und Sync-Queue

## Auftrag

Stelle sicher, dass Wein-Erfassung, Cellar-Movements und Ratings auch ohne Netzverbindung funktionieren. Mutations werden in einer lokalen Queue gespeichert und beim naechsten Online-Status synchronisiert.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdateien:**
- `apps/mobile/lib/syncQueue.ts` (NEU)
- `apps/mobile/lib/api.ts` oder bestehende API-Layer (Anpassung)

## Hintergrund

Im Keller ist die Verbindung oft schlecht. Heute scheitern Mutations bei fehlender Konnektivitaet — der Nutzer verliert Daten oder muss neu eingeben. Das ist der haeufigste Frust-Auswurf an der App.

## Konkrete Schritte

1. **Sync-Queue-Modul `apps/mobile/lib/syncQueue.ts`**

   ```typescript
   export type QueuedMutation = {
     id: string;            // uuid
     createdAt: string;     // iso
     endpoint: string;      // "/api/wines"
     method: "POST" | "PUT" | "DELETE";
     body: unknown;
     attempts: number;
     lastError?: string;
   };

   export const syncQueue = {
     enqueue(mutation: Omit<QueuedMutation, "id" | "createdAt" | "attempts">): Promise<void>;
     getAll(): Promise<QueuedMutation[]>;
     remove(id: string): Promise<void>;
     incrementAttempt(id: string, error?: string): Promise<void>;
     clear(): Promise<void>;
   };
   ```

   Persistenz via AsyncStorage Key `vinotheque.syncQueue`.

2. **API-Wrapper anpassen**
   - Bestehender API-Client (vermutlich `apps/mobile/lib/api.ts`) abfangen
   - Bei Netz-Fehler (TypeError fetch / status >= 500): Mutation in Queue legen, optimistic update lokal anwenden, Erfolg an UI melden
   - GETs nicht in Queue — die brechen einfach ab und UI zeigt Cache

3. **Sync-Worker**
   - Bei App-Start und bei NetInfo-Wechsel auf "online": `processQueue()` ausfuehren
   - Pro Mutation: senden, bei Erfolg `remove()`, bei Fehler `incrementAttempt`
   - Nach 5 Versuchen: Mutation als "failed" markieren, dem Nutzer in einer Settings-Sektion sichtbar machen
   - Verwende `@react-native-community/netinfo` (vermutlich schon installiert via Expo)

4. **UI-Indikator**
   - Im Header oder im "Mehr"-Tab: "X ausstehende Aenderungen" wenn Queue nicht leer
   - Tap → Liste der Queue-Eintraege mit Retry-Button und Loeschen-Option

5. **Lokaler Cache fuer GETs**
   - React Query mit `persistQueryClient` oder einfaches AsyncStorage-Caching der letzten Wein-Liste
   - So ist der Keller offline lesbar

## Akzeptanzkriterien

- [ ] Erfassen ohne Netz speichert lokal und legt Queue-Eintrag an
- [ ] Bei wiederhergestellter Verbindung wird Queue automatisch abgearbeitet
- [ ] Failed Mutations sichtbar und manuell retry-bar
- [ ] Keller-Liste offline lesbar
- [ ] Lint und Typescheck gruen
- [ ] Smoke-Test: Flugmodus an → Wein erfassen → Flugmodus aus → Wein landet in API

## Hinweise

- Optimistic Updates: lokal sofort anzeigen, Rollback bei finalem Fehler
- Konflikt-Strategie: bei 409/422 die Mutation als "failed" markieren, kein automatisches Re-Apply
- Idempotenz: Server sollte bei doppelter Submission nicht doppelte Eintraege erzeugen — pruefen ob `id` vom Client mitgegeben werden kann
- Diese Loesung ersetzt nicht die im Backlog genannte echte Cloud-Sync-Strategie, ist aber eine pragmatische Verbesserung
