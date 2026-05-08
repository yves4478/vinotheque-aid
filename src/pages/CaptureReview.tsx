import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useAcceptCandidate,
  useCaptureSession,
  useFinalizeCaptureSession,
  useRejectCandidate,
  useUpdateCandidate,
  type Candidate,
  type SaveEntry,
} from "@/hooks/useCaptureSession";

export default function CaptureReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading } = useCaptureSession(id!);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [saves, setSaves] = useState<Map<string, SaveEntry>>(new Map());
  const updateCandidate = useUpdateCandidate(id!);
  const acceptCandidate = useAcceptCandidate(id!);
  const rejectCandidate = useRejectCandidate(id!);
  const finalize = useFinalizeCaptureSession(id!);

  if (isLoading || !session) return <div className="p-8">Lade Session...</div>;

  if (["submitted", "recognizing"].includes(session.status)) {
    return (
      <div className="space-y-3 p-8 text-center">
        <p className="animate-pulse text-xl font-semibold">Erkennung laeuft...</p>
        <p className="text-muted-foreground">Die Seite aktualisiert sich automatisch.</p>
      </div>
    );
  }

  const currentPhotoId = selectedPhotoId ?? session.photos[0]?.id;
  const currentPhoto = session.photos.find((photo) => photo.id === currentPhotoId);
  const candidatesForPhoto = session.candidates.filter(
    (candidate) => candidate.photoId === currentPhotoId && candidate.status !== "rejected",
  );
  const accepted = session.candidates.filter((candidate) => candidate.status === "accepted").length;
  const total = session.candidates.length;

  function handleAccept(candidate: Candidate, quantity: number) {
    acceptCandidate.mutate(candidate.id);
    setSaves((previous) => {
      const next = new Map(previous);
      next.set(candidate.id, {
        candidateId: candidate.id,
        action: "create",
        quantity,
        fields: {
          name: candidate.name ?? undefined,
          producer: candidate.producer ?? undefined,
          vintage: candidate.vintage ?? undefined,
          region: candidate.region ?? undefined,
          country: candidate.country ?? undefined,
          type: candidate.type ?? undefined,
        },
      });
      return next;
    });
  }

  async function handleFinalize() {
    if (saves.size === 0) return;
    try {
      const result = await finalize.mutateAsync(Array.from(saves.values())) as { created: number; merged: number };
      window.alert(`${result.created} Wein${result.created !== 1 ? "e" : ""} erstellt, ${result.merged} Menge${result.merged !== 1 ? "n" : ""} erhoeht.`);
      navigate("/cellar");
    } catch {
      window.alert("Fehler beim Speichern.");
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-3">
        <div>
          <h1 className="text-lg font-bold">Review</h1>
          <p className="text-sm text-muted-foreground">
            {accepted} akzeptiert · {total} Kandidaten · CHF {(session.costCents / 100).toFixed(2)}
          </p>
        </div>
        <Button onClick={handleFinalize} disabled={saves.size === 0 || finalize.isPending}>
          {finalize.isPending ? "Speichere..." : `${saves.size} Wein${saves.size !== 1 ? "e" : ""} in Keller`}
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex flex-col gap-3 overflow-y-auto border-r p-4 md:w-1/2">
          <div className="flex flex-wrap gap-2">
            {session.photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhotoId(photo.id)}
                className={`rounded border px-3 py-1 text-sm transition-colors ${
                  photo.id === currentPhotoId ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                Foto {index + 1}
              </button>
            ))}
          </div>
          {currentPhoto && (
            <div className="relative w-full">
              <img src={currentPhoto.url} alt="Regalfoto" className="w-full rounded-lg object-contain" />
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
              >
                {candidatesForPhoto.filter((candidate) => candidate.bbox).map((candidate) => (
                  <rect
                    key={candidate.id}
                    x={candidate.bbox!.x}
                    y={candidate.bbox!.y}
                    width={candidate.bbox!.w}
                    height={candidate.bbox!.h}
                    fill="transparent"
                    stroke="#e8d5b0"
                    strokeWidth="0.004"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto p-4 md:w-1/2">
          {candidatesForPhoto.length === 0 && (
            <p className="text-sm text-muted-foreground">Keine Kandidaten fuer dieses Foto.</p>
          )}
          {candidatesForPhoto.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              isQueued={saves.has(candidate.id)}
              onAccept={(quantity) => handleAccept(candidate, quantity)}
              onUpdate={(data) => updateCandidate.mutate({ id: candidate.id, data })}
              onReject={() => {
                rejectCandidate.mutate(candidate.id);
                setSaves((previous) => {
                  const next = new Map(previous);
                  next.delete(candidate.id);
                  return next;
                });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  isQueued,
  onAccept,
  onUpdate,
  onReject,
}: {
  candidate: Candidate;
  isQueued: boolean;
  onAccept: (quantity: number) => void;
  onUpdate: (data: Partial<Candidate>) => void;
  onReject: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [draft, setDraft] = useState({
    name: candidate.name ?? "",
    producer: candidate.producer ?? "",
    vintage: candidate.vintage?.toString() ?? "",
  });

  return (
    <Card className={isQueued ? "border-green-600 bg-green-950/10" : ""}>
      <CardContent className="flex flex-col gap-2 px-4 py-3">
        {editing ? (
          <>
            <Input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Weinname"
            />
            <Input
              value={draft.producer}
              onChange={(event) => setDraft((current) => ({ ...current, producer: event.target.value }))}
              placeholder="Produzent"
            />
            <Input
              value={draft.vintage}
              onChange={(event) => setDraft((current) => ({ ...current, vintage: event.target.value }))}
              placeholder="Jahrgang"
              type="number"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onUpdate({
                    name: draft.name,
                    producer: draft.producer,
                    vintage: parseInt(draft.vintage, 10) || undefined,
                  });
                  setEditing(false);
                }}
              >
                OK
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Abbrechen
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {candidate.name ?? <span className="text-muted-foreground italic">Unbekannt</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[candidate.producer, candidate.vintage].filter(Boolean).join(" · ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[candidate.region, candidate.country, candidate.type].filter(Boolean).join(" · ")}
                </p>
              </div>
              {candidate.confidence != null && (
                <Badge variant="outline" className="shrink-0 text-xs">
                  {Math.round(candidate.confidence * 100)}%
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isQueued && (
                <>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, parseInt(event.target.value, 10) || 1))}
                    className="w-14 rounded border bg-background px-2 py-1 text-sm"
                  />
                  <Button size="sm" className="bg-green-700 hover:bg-green-600" onClick={() => onAccept(quantity)}>
                    Akzeptieren
                  </Button>
                </>
              )}
              {isQueued && <Badge className="bg-green-700">Akzeptiert ({quantity}x)</Badge>}
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Bearbeiten
              </Button>
              <Button size="sm" variant="destructive" onClick={onReject}>
                Verwerfen
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
