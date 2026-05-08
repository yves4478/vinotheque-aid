# Codex Prompt — Phase 0 / Task 4: Review-UI im Web

## Auftrag

Baue im Web eine Review-Oberflaeche fuer Capture Sessions. Der Nutzer sieht alle erkannten Wein-Kandidaten pro Foto, kann Felder korrigieren, Kandidaten akzeptieren oder verwerfen.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Arbeitsverzeichnis:** `src/` (Web-App)

---

## Was bereits existiert (Referenz)

- `src/pages/Cellar.tsx` — Muster fuer Listen-Seiten mit React Query
- `src/features/webFeatures.tsx` — Feature-Flag-basiertes Routing, hier neues Feature eintragen
- shadcn/ui Komponenten in `src/components/ui/` (Card, Badge, Button, Input, Select, Dialog)
- `src/App.tsx` — React Router, Routen werden via `webFeatures.tsx` geladen

**API-Basis-URL:** aus `import { apiBaseUrl } from "@/lib/apiUrl"` (oder aequivalentem Modul — schaue wie bestehende Pages die API-URL beziehen und verwende dasselbe Muster).

---

## Was du baust

### Schritt 1 — API-Hooks in `src/hooks/useCaptureSession.ts` (NEU)

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Typen
export type CaptureSessionStatus =
  | "open" | "submitted" | "recognizing" | "ready_for_review" | "completed";

export type CaptureSessionListItem = {
  id: string;
  status: CaptureSessionStatus;
  createdAt: string;
  costCents: number;
  _count: { photos: number; candidates: number };
};

export type CapturePhoto = {
  id: string;
  url: string;
  status: string;
};

export type Candidate = {
  id: string;
  photoId: string;
  name: string | null;
  producer: string | null;
  vintage: number | null;
  region: string | null;
  country: string | null;
  type: string | null;
  confidence: number | null;
  status: "pending" | "accepted" | "rejected" | "merged";
  bbox: { x: number; y: number; w: number; h: number } | null;
};

export type CaptureSessionDetail = {
  id: string;
  status: CaptureSessionStatus;
  costCents: number;
  createdAt: string;
  photos: CapturePhoto[];
  candidates: Candidate[];
};

// Hook-Implementierungen analog zu bestehenden React-Query-Hooks im Projekt.
// Schaue in src/hooks/ welches Muster verwendet wird und halte dich daran.
// Nutze dieselbe API-Basis-URL und denselben fetch-Wrapper.

export function useCaptureSessions() {
  return useQuery<CaptureSessionListItem[]>({
    queryKey: ["capture-sessions"],
    queryFn: () => fetch("/api/capture-sessions").then((r) => r.json()),
    refetchInterval: (q) => {
      // Polling wenn noch Erkennung laeuft
      const data = q.state.data ?? [];
      const hasActive = data.some((s: CaptureSessionListItem) =>
        ["submitted", "recognizing"].includes(s.status),
      );
      return hasActive ? 5000 : false;
    },
  });
}

export function useCaptureSession(id: string) {
  return useQuery<CaptureSessionDetail>({
    queryKey: ["capture-session", id],
    queryFn: () => fetch(`/api/capture-sessions/${id}`).then((r) => r.json()),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "recognizing" || status === "submitted" ? 3000 : false;
    },
  });
}

export function useUpdateCandidate(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Candidate> }) =>
      fetch(`/api/capture-sessions/${sessionId}/candidates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capture-session", sessionId] }),
  });
}

export function useRejectCandidate(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (candidateId: string) =>
      fetch(`/api/capture-sessions/${sessionId}/candidates/${candidateId}/reject`, {
        method: "POST",
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capture-session", sessionId] }),
  });
}
```

### Schritt 2 — Sessions-Uebersicht `src/pages/CaptureSessions.tsx` (NEU)

```typescript
import { Link } from "react-router-dom";
import { useCaptureSessions } from "@/hooks/useCaptureSession";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const statusLabel: Record<string, string> = {
  open: "Offen",
  submitted: "Eingereicht",
  recognizing: "Wird analysiert…",
  ready_for_review: "Review bereit",
  completed: "Abgeschlossen",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ready_for_review: "default",
  recognizing: "secondary",
  completed: "outline",
};

export default function CaptureSessions() {
  const { data: sessions = [], isLoading } = useCaptureSessions();

  if (isLoading) return <div className="p-8 text-muted-foreground">Lade Sessions…</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Keller erfassen</h1>
      {sessions.length === 0 && (
        <p className="text-muted-foreground">
          Noch keine Sessions. Starte die Aufnahme in der iOS-App.
        </p>
      )}
      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <Link key={s.id} to={`/capture/${s.id}`}>
            <Card className="hover:bg-muted/40 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div>
                  <p className="font-medium">{new Date(s.createdAt).toLocaleDateString("de-CH")}</p>
                  <p className="text-sm text-muted-foreground">
                    {s._count.photos} Fotos · {s._count.candidates} Kandidaten ·{" "}
                    {(s.costCents / 100).toFixed(2)} CHF
                  </p>
                </div>
                <Badge variant={statusVariant[s.status] ?? "outline"}>
                  {statusLabel[s.status] ?? s.status}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### Schritt 3 — Review-Page `src/pages/CaptureReview.tsx` (NEU)

Hauptstruktur — baue dies aus:

```typescript
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCaptureSession, useUpdateCandidate, useRejectCandidate, type Candidate } from "@/hooks/useCaptureSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function CaptureReview() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useCaptureSession(id!);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const updateCandidate = useUpdateCandidate(id!);
  const rejectCandidate = useRejectCandidate(id!);

  if (isLoading || !session) return <div className="p-8">Lade Session…</div>;

  if (session.status === "recognizing") {
    return (
      <div className="p-8 text-center">
        <p className="text-lg font-medium animate-pulse">Erkennung laeuft…</p>
        <p className="text-muted-foreground mt-2">Die Seite aktualisiert sich automatisch.</p>
      </div>
    );
  }

  const currentPhotoId = selectedPhotoId ?? session.photos[0]?.id;
  const currentPhoto = session.photos.find((p) => p.id === currentPhotoId);
  const candidatesForPhoto = session.candidates.filter(
    (c) => c.photoId === currentPhotoId && c.status !== "rejected",
  );

  const total = session.candidates.length;
  const pending = session.candidates.filter((c) => c.status === "pending").length;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Review</h1>
          <p className="text-sm text-muted-foreground">
            {total - pending} / {total} bearbeitet · {(session.costCents / 100).toFixed(2)} CHF
          </p>
        </div>
        {pending === 0 && (
          // Bulk-Save-Button kommt in Task 0.5 — Placeholder:
          <Button disabled>Speichern (kommt in Task 5)</Button>
        )}
      </div>

      {/* Body zweispaltig */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* Linke Spalte: Foto + Bounding Boxes */}
        <div className="md:w-1/2 flex flex-col gap-3 p-4 overflow-y-auto">
          {/* Foto-Tabs */}
          <div className="flex gap-2 flex-wrap">
            {session.photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelectedPhotoId(p.id)}
                className={`px-3 py-1 rounded text-sm border ${
                  p.id === currentPhotoId ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                Foto {i + 1}
              </button>
            ))}
          </div>

          {/* Foto mit Bounding Boxes */}
          {currentPhoto && (
            <div className="relative w-full">
              <img
                src={currentPhoto.url}
                alt="Regalfoto"
                className="w-full rounded object-contain"
              />
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
              >
                {candidatesForPhoto
                  .filter((c) => c.bbox)
                  .map((c) => (
                    <rect
                      key={c.id}
                      x={c.bbox!.x}
                      y={c.bbox!.y}
                      width={c.bbox!.w}
                      height={c.bbox!.h}
                      fill="transparent"
                      stroke="#e8d5b0"
                      strokeWidth="0.005"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
              </svg>
            </div>
          )}
        </div>

        {/* Rechte Spalte: Kandidaten-Liste */}
        <div className="md:w-1/2 overflow-y-auto p-4 flex flex-col gap-3 border-t md:border-t-0 md:border-l">
          {candidatesForPhoto.length === 0 && (
            <p className="text-muted-foreground text-sm">Keine Kandidaten fuer dieses Foto.</p>
          )}
          {candidatesForPhoto.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              onUpdate={(data) => updateCandidate.mutate({ id: c.id, data })}
              onReject={() => rejectCandidate.mutate(c.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CandidateCard({
  candidate: c,
  onUpdate,
  onReject,
}: {
  candidate: Candidate;
  onUpdate: (data: Partial<Candidate>) => void;
  onReject: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: c.name ?? "", producer: c.producer ?? "", vintage: c.vintage?.toString() ?? "" });

  return (
    <Card className={c.status === "accepted" ? "border-green-600" : ""}>
      <CardContent className="py-3 px-4 flex flex-col gap-2">
        {editing ? (
          <>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Weinname"
            />
            <Input
              value={draft.producer}
              onChange={(e) => setDraft((d) => ({ ...d, producer: e.target.value }))}
              placeholder="Produzent"
            />
            <Input
              value={draft.vintage}
              onChange={(e) => setDraft((d) => ({ ...d, vintage: e.target.value }))}
              placeholder="Jahrgang"
              type="number"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { onUpdate({ name: draft.name, producer: draft.producer, vintage: parseInt(draft.vintage) || undefined }); setEditing(false); }}>Speichern</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Abbrechen</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{c.name ?? <span className="text-muted-foreground">Unbekannt</span>}</p>
                <p className="text-sm text-muted-foreground">{[c.producer, c.vintage].filter(Boolean).join(" · ")}</p>
                <p className="text-xs text-muted-foreground">{[c.region, c.country, c.type].filter(Boolean).join(" · ")}</p>
              </div>
              {c.confidence != null && (
                <Badge variant="outline" className="text-xs ml-2 shrink-0">
                  {Math.round(c.confidence * 100)}%
                </Badge>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Akzeptieren kommt in Task 0.5 */}
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Bearbeiten</Button>
              <Button size="sm" variant="destructive" onClick={onReject}>Verwerfen</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

### Schritt 4 — Routing in `src/features/webFeatures.tsx`

Schaue wie bestehende Features (z.B. `shopping`, `wishlist`) in `webFeatures.tsx` eingetragen werden und ergaenze analog:

```typescript
// Import ergaenzen:
import CaptureSessions from "@/pages/CaptureSessions";
import CaptureReview from "@/pages/CaptureReview";

// In der Features-Liste / Route-Konfiguration:
{
  key: "bulkCapture",
  path: "/capture",
  element: <CaptureSessions />,
  label: "Keller erfassen",
  icon: Camera,  // aus lucide-react
},
// Zusaetzliche Route fuer Detail (ohne Feature-Flag-Guard, nur via /capture/:id):
{ path: "/capture/:id", element: <CaptureReview /> }
```

Passe den Stil der Route-Eintragung genau dem bestehenden Muster an.

---

## Abschluss

**TypeScript-Check:**
```bash
npm run typecheck 2>/dev/null || npx tsc --noEmit
```

**Lint:**
```bash
npm run lint
```

**Commit:**
```
feat(web): capture session review UI

- useCaptureSession.ts: React Query hooks with polling for active sessions
- CaptureSessions.tsx: session list with status badges
- CaptureReview.tsx: two-column review with photo, bounding boxes,
  candidate cards (edit, reject)
- Route /capture and /capture/:id registered

Phase 0 Task 4
```

**Push:**
```bash
git push -u origin claude/plan-app-architecture-6dUk6
```

---

## Was du NICHT tun sollst

- Kein Finalize/Speichern-Button implementieren — kommt in Task 0.5
- Kein neues CSS-Framework oder Animation-Library hinzufuegen
- Keine Aenderungen an bestehenden Seiten (Cellar, Wishlist etc.)
- Das "Akzeptieren"-Feature in der CandidateCard bewusst auskommentiert lassen bis Task 0.5
