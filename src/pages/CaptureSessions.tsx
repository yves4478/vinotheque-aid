import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCaptureSessions } from "@/hooks/useCaptureSession";

const STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  submitted: "Eingereicht",
  recognizing: "Wird analysiert...",
  ready_for_review: "Review bereit",
  completed: "Abgeschlossen",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  ready_for_review: "default",
  recognizing: "secondary",
  completed: "outline",
};

export default function CaptureSessions() {
  const { data: sessions = [], isLoading } = useCaptureSessions();

  if (isLoading) return <div className="p-8 text-muted-foreground">Lade Sessions...</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Keller erfassen</h1>
      <p className="mb-6 text-muted-foreground">
        Starte die Aufnahme in der iOS-App. Die Erkennung laeuft hier automatisch.
      </p>

      {sessions.length === 0 && (
        <p className="text-muted-foreground">Noch keine Sessions vorhanden.</p>
      )}

      <div className="flex flex-col gap-3">
        {sessions.map((session) => (
          <Link key={session.id} to={`/capture/${session.id}`}>
            <Card className="cursor-pointer transition-colors hover:bg-muted/40">
              <CardContent className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium">
                    {new Date(session.createdAt).toLocaleDateString("de-CH", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session._count.photos} Foto{session._count.photos !== 1 ? "s" : ""} ·{" "}
                    {session._count.candidates} Kandidat{session._count.candidates !== 1 ? "en" : ""} ·{" "}
                    CHF {(session.costCents / 100).toFixed(2)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[session.status] ?? "outline"}>
                  {STATUS_LABEL[session.status] ?? session.status}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
