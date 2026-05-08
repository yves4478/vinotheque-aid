# Codex Prompt — Phase 0 / Task 5: Bulk-Save in den Keller

## Auftrag

Baue den finalen Schritt der Capture Session: akzeptierte Kandidaten werden als echte Weine im Keller gespeichert. Mengen-Eingabe, Duplikaterkennung, Finalize-Endpoint und die Save-Schaltflaeche in der Review-UI.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Dateien:** `apps/api/src/routes/captureSessions.ts` (Erweiterung) + `src/pages/CaptureReview.tsx` (Erweiterung)

---

## Was bereits existiert (Voraussetzung: Tasks 0.1–0.4 muessen fertig sein)

- `apps/api/src/routes/captureSessions.ts` — CRUD fuer Sessions und Kandidaten
- `src/pages/CaptureReview.tsx` — Review-UI mit Kandidaten-Cards (ohne Finalize)
- `src/hooks/useCaptureSession.ts` — React Query Hooks
- `apps/api/prisma/schema.prisma` — Modelle `Wine`, `CellarMovement`, `WineImage`, `RecognizedCandidate`, `CapturePhoto`

---

## Was du baust

### Schritt 1 — Finalize-Endpoint im Backend

In `apps/api/src/routes/captureSessions.ts` ergaenzen (APPEND — bestehende Routen nicht entfernen):

```typescript
import { createId } from "@paralleldrive/cuid2";

// ── Session finalisieren ──────────────────────────────────────────────────────

captureSessionsRouter.post("/:id/finalize", async (c) => {
  const sessionId = c.req.param("id");
  const session = await prisma.captureSession.findUnique({
    where: { id: sessionId },
    include: { candidates: { include: { photo: true } } },
  });
  if (!session) return c.json({ error: "Nicht gefunden." }, 404);
  if (session.status === "completed") return c.json({ error: "Bereits abgeschlossen." }, 409);

  const body = await c.req.json() as {
    saves: Array<{
      candidateId: string;
      action: "create" | "addToExisting";
      wineId?: string;
      quantity: number;
      fields?: Partial<{
        name: string; producer: string; vintage: number;
        region: string; country: string; type: string; notes: string;
      }>;
    }>;
  };

  const now = new Date().toISOString();
  let created = 0;
  let merged = 0;

  // Transaktional: alles oder nichts
  await prisma.$transaction(async (tx) => {
    for (const save of body.saves) {
      const candidate = session.candidates.find((c) => c.id === save.candidateId);
      if (!candidate) continue;

      const qty = Math.max(1, save.quantity ?? 1);

      if (save.action === "create") {
        const wineId = createId();
        const fields = save.fields ?? {};
        await tx.wine.create({
          data: {
            id: wineId,
            name: fields.name ?? candidate.name ?? "Unbekannt",
            producer: fields.producer ?? candidate.producer ?? "",
            vintage: fields.vintage ?? candidate.vintage ?? 0,
            region: fields.region ?? candidate.region ?? "",
            country: fields.country ?? candidate.country ?? "",
            type: fields.type ?? candidate.type ?? "rot",
            grape: "",
            quantity: qty,
            notes: fields.notes ?? null,
          },
        });

        // Foto als WineImage verlinken
        await tx.wineImage.create({
          data: {
            id: createId(),
            wineId,
            storageKey: candidate.photo.storageKey,
            url: candidate.photo.url,
            label: "Erfassung",
            isPrimary: true,
          },
        });

        // CellarMovement
        await tx.cellarMovement.create({
          data: {
            id: createId(),
            type: "in",
            wineId,
            wineName: fields.name ?? candidate.name ?? "Unbekannt",
            wineProducer: fields.producer ?? candidate.producer ?? "",
            wineVintage: fields.vintage ?? candidate.vintage ?? 0,
            wineType: fields.type ?? candidate.type ?? "rot",
            quantity: qty,
            date: now,
            occasion: "Keller-Ersterfassung",
          },
        });

        await tx.recognizedCandidate.update({
          where: { id: candidate.id },
          data: { status: "accepted", linkedWineId: wineId },
        });
        created++;

      } else if (save.action === "addToExisting" && save.wineId) {
        const existing = await tx.wine.findUnique({ where: { id: save.wineId } });
        if (!existing) continue;

        await tx.wine.update({
          where: { id: save.wineId },
          data: { quantity: { increment: qty } },
        });

        await tx.cellarMovement.create({
          data: {
            id: createId(),
            type: "in",
            wineId: save.wineId,
            wineName: existing.name,
            wineProducer: existing.producer,
            wineVintage: existing.vintage,
            wineType: existing.type,
            quantity: qty,
            date: now,
            occasion: "Keller-Ersterfassung",
          },
        });

        await tx.recognizedCandidate.update({
          where: { id: candidate.id },
          data: { status: "merged", linkedWineId: save.wineId },
        });
        merged++;
      }
    }

    await tx.captureSession.update({
      where: { id: sessionId },
      data: { status: "completed" },
    });
  });

  return c.json({ created, merged, status: "completed" });
});
```

### Schritt 2 — Kandidaten akzeptieren (Flag setzen ohne Wein anlegen)

Ergaenze in `apps/api/src/routes/captureSessions.ts`:

```typescript
captureSessionsRouter.post("/:id/candidates/:cId/accept", async (c) => {
  const candidate = await prisma.recognizedCandidate.update({
    where: { id: c.req.param("cId") },
    data: { status: "accepted" },
  });
  return c.json(candidate);
});
```

### Schritt 3 — React Query Hooks erweitern

In `src/hooks/useCaptureSession.ts` ergaenzen:

```typescript
export type SaveEntry = {
  candidateId: string;
  action: "create" | "addToExisting";
  wineId?: string;
  quantity: number;
  fields?: {
    name?: string; producer?: string; vintage?: number;
    region?: string; country?: string; type?: string; notes?: string;
  };
};

export function useFinalizeCaptureSession(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (saves: SaveEntry[]) =>
      fetch(`/api/capture-sessions/${sessionId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saves }),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["capture-session", sessionId] });
      qc.invalidateQueries({ queryKey: ["capture-sessions"] });
      qc.invalidateQueries({ queryKey: ["wines"] });
    },
  });
}

export function useAcceptCandidate(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (candidateId: string) =>
      fetch(`/api/capture-sessions/${sessionId}/candidates/${candidateId}/accept`, {
        method: "POST",
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capture-session", sessionId] }),
  });
}
```

### Schritt 4 — CaptureReview.tsx: Akzeptieren + Menge + Finalize

In `src/pages/CaptureReview.tsx` die folgenden Ergaenzungen vornehmen:

**4a — State fuer Saves:**

```typescript
// In CaptureReview-Komponente ergaenzen:
const [saves, setSaves] = useState<Map<string, SaveEntry>>(new Map());
const finalize = useFinalizeCaptureSession(id!);
const acceptCandidate = useAcceptCandidate(id!);

function handleAccept(c: Candidate, quantity: number) {
  acceptCandidate.mutate(c.id);
  setSaves((prev) => {
    const m = new Map(prev);
    m.set(c.id, {
      candidateId: c.id,
      action: "create",
      quantity,
      fields: {
        name: c.name ?? undefined,
        producer: c.producer ?? undefined,
        vintage: c.vintage ?? undefined,
        region: c.region ?? undefined,
        country: c.country ?? undefined,
        type: c.type ?? undefined,
      },
    });
    return m;
  });
}

async function handleFinalize() {
  if (saves.size === 0) return;
  try {
    const result = await finalize.mutateAsync(Array.from(saves.values()));
    // Toast oder Alert:
    alert(`${result.created} Weine erstellt, ${result.merged} Mengen erhoeht.`);
    // Optional: navigate to /cellar
  } catch (err) {
    alert("Fehler beim Speichern.");
  }
}
```

**4b — Finalize-Button im Header aktivieren:**

Ersetze den Placeholder-Button in der Review-Page:

```typescript
<Button
  onClick={handleFinalize}
  disabled={saves.size === 0 || finalize.isPending}
>
  {finalize.isPending
    ? "Speichere…"
    : `${saves.size} Wein${saves.size !== 1 ? "e" : ""} speichern`}
</Button>
```

**4c — CandidateCard: Akzeptieren-Button und Mengen-Input aktivieren:**

Ersetze den auskommentierten Akzeptieren-Bereich in `CandidateCard`:

```typescript
// Props ergaenzen:
onAccept: (quantity: number) => void;

// Im JSX (nicht-editing-Zustand):
const [qty, setQty] = useState(1);

<div className="flex items-center gap-2">
  <input
    type="number"
    min={1}
    max={99}
    value={qty}
    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
    className="w-16 border rounded px-2 py-1 text-sm"
  />
  <Button size="sm" variant="default" onClick={() => onAccept(qty)}
    className="bg-green-700 hover:bg-green-600">
    Akzeptieren
  </Button>
  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Bearbeiten</Button>
  <Button size="sm" variant="destructive" onClick={onReject}>Verwerfen</Button>
</div>
```

---

## Abschluss

**TypeScript-Check:**
```bash
cd apps/api && npx tsc --noEmit
npm run typecheck 2>/dev/null || npx tsc --noEmit  # Web
```

**Lint:**
```bash
npm run lint
```

**Commit:**
```
feat: phase 0 finalize — bulk save candidates to cellar

API: POST /api/capture-sessions/:id/finalize creates wines and
cellar movements in a single Prisma transaction. Photos linked
as WineImage. Accepted/merged counts returned.

Web: accept button with quantity input, finalize button in header,
useFinalizeCaptureSession / useAcceptCandidate hooks.

Phase 0 Task 5 — Bulk-Capture flow complete
```

**Push:**
```bash
git push -u origin claude/plan-app-architecture-6dUk6
```

---

## Was du NICHT tun sollst

- Keine Duplikat-Zusammenfuehrungs-UI in diesem Task (das ist eine Erweiterung, nicht der MVP)
- Kein Loeschen der CaptureSession oder ihrer Photos nach Finalize — bleibt als Audit-Trail
- Kein Migration-Script fuer Base64-Altdaten (kommt in Phase 2 Task 5)
- Keinen zweiten Finalize-Aufruf zulassen — der 409-Guard im Backend reicht
