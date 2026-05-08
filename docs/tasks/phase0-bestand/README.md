# Phase 0 — Bestand erfassen

**Ziel:** Den bestehenden physischen Weinkeller (~hunderte Flaschen) effizient in die App bringen. Das ist der wichtigste Pfad und blockiert alle anderen Mehrwerte.

## Strategie: Bulk-Capture statt Bottle-by-Bottle

Statt jede Flasche einzeln zu scannen, fotografiert der Nutzer Regalfaecher mit dem iPhone. Pro Foto sind 5–15 Flaschen sichtbar. Im Backend identifiziert Claude Vision alle Flaschen pro Foto. Der Nutzer reviewt und korrigiert das Ergebnis am Web (grosser Bildschirm, Tastatur).

**Wirtschaftlichkeit:**
- 30 Fotos x ~3 Cent Claude-Vision-Aufruf = ~1 USD einmalig
- ~30 Min Foto + 1–2 Std Review = ~2 Std fuer 300 Flaschen
- Vergleich Single-Scan: 3–5 Std konzentrierte Erfassung am Keller

## Reihenfolge

| # | Task | Datei | Abhaengigkeit |
|---|---|---|---|
| 0.1 | MinIO Cloud Storage in Coolify | [task-1-minio-storage.md](./task-1-minio-storage.md) | — |
| 0.2 | Bulk-Capture Aufnahme-Flow auf iOS | [task-2-bulk-capture-ios.md](./task-2-bulk-capture-ios.md) | 0.1 |
| 0.3 | Backend Claude Vision Batch-Erkennung | [task-3-batch-recognition-api.md](./task-3-batch-recognition-api.md) | 0.1 |
| 0.4 | Review-UI im Web | [task-4-review-ui-web.md](./task-4-review-ui-web.md) | 0.3 |
| 0.5 | Bulk-Save in den Keller | [task-5-bulk-save.md](./task-5-bulk-save.md) | 0.4 |

## Definition of Done der Phase

- Du kannst eine Foto-Session machen, hochladen, reviewen, bestaetigen — und 50+ Flaschen sind im Keller
- Erkennungsrate >70% bei guter Foto-Qualitaet (Hauptetiketten lesbar)
- Kosten pro Erfassung sind sichtbar in der UI
- Original-Fotos bleiben referenziert am Wein

## Konventionen

- Storage: MinIO (S3-API) auf eigenem Coolify-Server
- Vision: Claude Vision via Anthropic API (API-Key aus Settings)
- Branch: `claude/plan-app-architecture-6dUk6` oder Sub-Branches
- Tests wo sinnvoll (Mocks fuer Claude Vision)
