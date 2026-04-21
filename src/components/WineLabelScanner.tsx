import { useState } from "react";
import { Camera, Upload, Loader2, X, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { createWorker } from "tesseract.js";
import { cn } from "@/lib/utils";
import { CameraCapture } from "@/components/CameraCapture";

export interface ScanResult {
  name: string;
  producer: string;
  vintage: number | undefined;
  rawText: string;
}

interface WineLabelScannerProps {
  onResult: (result: Partial<ScanResult>) => void;
  /** Compact layout for sidebar/panel usage on desktop */
  compact?: boolean;
}

function parseWineLabel(text: string): Partial<ScanResult> {
  const currentYear = new Date().getFullYear();
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  let vintage: number | undefined;
  for (const line of lines) {
    const match = line.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
    if (match) {
      const y = parseInt(match[1]);
      if (y <= currentYear) { vintage = y; break; }
    }
  }

  const contentLines = lines.filter(
    (l) =>
      l.length >= 3 &&
      !/^\d+$/.test(l) &&
      !/^\d+[.,]\d+$/.test(l) &&
      !/%\s*vol/i.test(l) &&
      !/\d+\s*(cl|ml|l)\b/i.test(l) &&
      !/appellation/i.test(l) &&
      !/contrôlée/i.test(l) &&
      !/mis en bouteille/i.test(l) &&
      !/contains? sulfit/i.test(l) &&
      !/product of/i.test(l) &&
      !/enthält sulfite/i.test(l)
  );

  const withoutVintage = contentLines.filter(
    (l) => !l.match(/\b(19[5-9]\d|20[0-2]\d)\b/) || l.replace(/\b(19[5-9]\d|20[0-2]\d)\b/, "").trim().length > 3
  );

  const producer = withoutVintage[0] ?? "";
  const name = withoutVintage[1] ?? "";
  return { name, producer, vintage, rawText: text };
}

type ScanState = "idle" | "scanning" | "done" | "error";

export function WineLabelScanner({ onResult, compact = false }: WineLabelScannerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [progress, setProgress] = useState(0);
  const [parsed, setParsed] = useState<Partial<ScanResult> | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    setErrorMsg("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    setState("scanning");
    setProgress(0);
    setParsed(null);

    try {
      const worker = await createWorker("eng+deu+fra+ita+spa", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setParsed(parseWineLabel(data.text));
      setState("done");
    } catch {
      setErrorMsg("Texterkennung fehlgeschlagen – Felder manuell ausfüllen.");
      setState("error");
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const reset = () => {
    setState("idle");
    setPreview(null);
    setParsed(null);
    setProgress(0);
  };

  const applyResult = () => {
    if (parsed) onResult(parsed);
    reset();
  };

  return (
    <>
      <div className={cn("apple-card overflow-hidden", compact ? "" : "")}>
        {/* ── IDLE ─────────────────────────────────────────── */}
        {state === "idle" && (
          <div className={cn("flex flex-col gap-3", compact ? "p-4" : "p-5")}>
            <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
              Etikett scannen
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Foto aufnehmen oder Bild hochladen — Name, Produzent und Jahrgang werden automatisch erkannt.
            </p>

            <div className={cn("grid gap-2", "grid-cols-2")}>
              {/* Camera button — opens live camera via getUserMedia */}
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 border-dashed border-primary/25 text-primary hover:bg-primary/5 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-center leading-tight">Kamera</span>
              </button>

              {/* File upload button with drag-and-drop */}
              <label
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 border-dashed transition-all overflow-hidden cursor-pointer",
                  isDragging
                    ? "border-primary/60 bg-primary/8 text-primary"
                    : "border-gray-200 text-muted-foreground hover:bg-gray-50 hover:border-gray-300 active:scale-95"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDragging ? "bg-primary/10" : "bg-gray-100")}>
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-center leading-tight">
                  {isDragging ? "Loslassen" : "Hochladen"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={onChange}
                />
              </label>
            </div>
          </div>
        )}

        {/* ── SCANNING ─────────────────────────────────────── */}
        {state === "scanning" && (
          <div className="p-5 flex flex-col items-center gap-4">
            {preview && (
              <div className={cn("rounded-xl overflow-hidden shadow-sm border border-black/5", compact ? "h-36" : "h-48 w-full")}>
                <img src={preview} className="w-full h-full object-contain bg-gray-50" alt="Etikett" />
              </div>
            )}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Texterkennung läuft…
                </div>
                <span className="text-muted-foreground tabular-nums">{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── DONE ─────────────────────────────────────────── */}
        {state === "done" && parsed && (
          <div className="p-5 space-y-4">
            {/* Preview thumbnail */}
            {preview && (
              <div className={cn("rounded-xl overflow-hidden border border-black/5", compact ? "h-32" : "h-44")}>
                <img src={preview} className="w-full h-full object-contain bg-gray-50" alt="Etikett" />
              </div>
            )}

            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-green-700">Etikett erkannt</span>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100 text-sm">
              {parsed.producer && (
                <div className="flex justify-between items-center px-3 py-2.5">
                  <span className="text-muted-foreground">Produzent</span>
                  <span className="font-medium text-right max-w-[60%] truncate">{parsed.producer}</span>
                </div>
              )}
              {parsed.name && (
                <div className="flex justify-between items-center px-3 py-2.5">
                  <span className="text-muted-foreground">Weinname</span>
                  <span className="font-medium text-right max-w-[60%] truncate">{parsed.name}</span>
                </div>
              )}
              {parsed.vintage && (
                <div className="flex justify-between items-center px-3 py-2.5">
                  <span className="text-muted-foreground">Jahrgang</span>
                  <span className="font-medium">{parsed.vintage}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyResult}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold active:scale-[0.97] transition-transform"
              >
                Übernehmen
              </button>
              <button
                type="button"
                onClick={reset}
                className="w-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-[0.97] transition-all"
                title="Verwerfen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ─────────────────────────────────────────── */}
        {state === "error" && (
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-2 text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 text-sm text-primary font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Nochmal versuchen
            </button>
          </div>
        )}
      </div>

      <CameraCapture
        open={showCamera}
        onCapture={handleFile}
        onClose={() => setShowCamera(false)}
      />
    </>
  );
}
