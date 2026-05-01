import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, X, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseWineLabel,
  isDraftWeak,
  type RecognitionConfidence,
  type RecognizedWineDraft,
} from "@vinotheque/core";
import { compressImageForOcr, fileToBase64 } from "@/lib/imageUtils";
import { scanWithClaudeVision } from "@/lib/claudeVision";
import { createWorker } from "tesseract.js";

export interface ScanResult {
  name?: string;
  producer?: string;
  vintage?: number;
}

interface WineLabelScannerProps {
  onResult: (result: ScanResult) => void;
  compact?: boolean;
  apiKey?: string;
}

type ScanState = "idle" | "scanning" | "done" | "claude-scanning" | "error";

const CONFIDENCE_LABEL: Record<RecognitionConfidence, string> = {
  high: "sicher",
  medium: "Vorschlag",
  low: "unsicher",
};

const CONFIDENCE_CLASS: Record<RecognitionConfidence, string> = {
  high: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-gray-50 text-gray-500 border-gray-200",
};

function FieldRow({
  label,
  value,
  confidence,
}: {
  label: string;
  value: string | number;
  confidence: RecognitionConfidence;
}) {
  return (
    <div className="flex justify-between items-center px-3 py-2.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", CONFIDENCE_CLASS[confidence])}>
          {CONFIDENCE_LABEL[confidence]}
        </span>
        <span className="font-medium text-sm text-right max-w-[140px] truncate">{value}</span>
      </div>
    </div>
  );
}

function draftToResult(draft: RecognizedWineDraft): ScanResult {
  return {
    producer: draft.fields.producer?.value,
    name: draft.fields.name?.value,
    vintage: draft.fields.vintage?.value,
  };
}

export function WineLabelScanner({ onResult, compact = false, apiKey }: WineLabelScannerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [progress, setProgress] = useState(0);
  const [draft, setDraft] = useState<RecognizedWineDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const replacePreview = (nextUrl: string | null) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = nextUrl;
    setPreview(nextUrl);
  };

  useEffect(() => (
    () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    }
  ), []);

  const handleFile = async (file: File) => {
    setErrorMsg("");
    setDraft(null);
    setCompressedFile(null);
    setState("scanning");
    setProgress(0);

    const url = URL.createObjectURL(file);
    replacePreview(url);

    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
    try {
      const processed = await compressImageForOcr(file);
      setCompressedFile(processed);

      worker = await createWorker("eng+deu+fra+ita+spa", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(processed);

      const result = parseWineLabel(data.text);
      setDraft(result);
      setState("done");
    } catch {
      setErrorMsg("Texterkennung fehlgeschlagen – Felder manuell ausfüllen.");
      setState("error");
    } finally {
      if (worker) {
        await worker.terminate().catch(() => {});
      }
    }
  };

  const handleClaudeVision = async () => {
    if (!apiKey || !compressedFile) return;
    setState("claude-scanning");
    try {
      const base64 = await fileToBase64(compressedFile);
      const result = await scanWithClaudeVision(base64, apiKey, compressedFile.type || "image/jpeg");
      setDraft(result);
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Claude Vision fehlgeschlagen.");
      setState("error");
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) void handleFile(file);
  };

  const reset = () => {
    replacePreview(null);
    setState("idle");
    setDraft(null);
    setProgress(0);
    setCompressedFile(null);
  };

  const applyResult = () => {
    if (draft) onResult(draftToResult(draft));
    reset();
  };

  const hasFields = draft && Object.keys(draft.fields).length > 0;
  const weak = draft ? isDraftWeak(draft) : false;
  const canUseClaude = !!apiKey && !!compressedFile;

  return (
    <div className={cn("apple-card overflow-hidden", compact ? "" : "")}>

      {/* ── IDLE ────────────────────────────────────────────── */}
      {state === "idle" && (
        <div className={cn("flex flex-col gap-3", compact ? "p-4" : "p-5")}>
          <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
            Etikett scannen
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Foto aufnehmen oder Bild hochladen — Name, Produzent und Jahrgang werden automatisch erkannt.
          </p>
          <label
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={cn(
              "relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 border-dashed transition-all overflow-hidden cursor-pointer",
              isDragging
                ? "border-primary/60 bg-primary/8 text-primary"
                : "border-gray-200 text-muted-foreground hover:bg-gray-50 hover:border-gray-300 active:scale-95",
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDragging ? "bg-primary/10" : "bg-gray-100")}>
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-center leading-tight">
              {isDragging ? "Loslassen" : "Hochladen oder Kamera"}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={onChange}
            />
          </label>
        </div>
      )}

      {/* ── SCANNING (OCR) ──────────────────────────────────── */}
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
              <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── SCANNING (Claude Vision) ────────────────────────── */}
      {state === "claude-scanning" && (
        <div className="p-5 flex flex-col items-center gap-4">
          {preview && (
            <div className={cn("rounded-xl overflow-hidden shadow-sm border border-black/5", compact ? "h-36" : "h-48 w-full")}>
              <img src={preview} className="w-full h-full object-contain bg-gray-50" alt="Etikett" />
            </div>
          )}
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Claude Vision analysiert…
          </div>
        </div>
      )}

      {/* ── DONE ────────────────────────────────────────────── */}
      {state === "done" && draft && (
        <div className="p-5 space-y-4">
          {preview && (
            <div className={cn("rounded-xl overflow-hidden border border-black/5", compact ? "h-32" : "h-44")}>
              <img src={preview} className="w-full h-full object-contain bg-gray-50" alt="Etikett" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-700">
              {hasFields ? "Etikett erkannt" : "Scan abgeschlossen"}
            </span>
          </div>

          {hasFields ? (
            <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
              {draft.fields.producer && (
                <FieldRow label="Produzent" value={draft.fields.producer.value} confidence={draft.fields.producer.confidence} />
              )}
              {draft.fields.name && (
                <FieldRow label="Weinname" value={draft.fields.name.value} confidence={draft.fields.name.confidence} />
              )}
              {draft.fields.vintage && (
                <FieldRow label="Jahrgang" value={draft.fields.vintage.value} confidence={draft.fields.vintage.confidence} />
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Keine Felder erkannt — Felder manuell ausfüllen.
            </p>
          )}

          {draft.warnings.length > 0 && (
            <p className="text-xs text-muted-foreground">{draft.warnings[0]}</p>
          )}

          <div className="flex gap-2">
            {hasFields && (
              <button
                type="button"
                onClick={applyResult}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold active:scale-[0.97] transition-transform"
              >
                Übernehmen
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="w-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-[0.97] transition-all"
              title="Verwerfen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {weak && canUseClaude && (
            <button
              type="button"
              onClick={handleClaudeVision}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 active:scale-[0.97] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Mit Claude Vision erneut versuchen
              <span className="text-muted-foreground font-normal">~0.01 CHF</span>
            </button>
          )}
        </div>
      )}

      {/* ── ERROR ───────────────────────────────────────────── */}
      {state === "error" && (
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-2 text-red-600">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{errorMsg}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 text-sm text-primary font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Nochmal versuchen
            </button>
            {canUseClaude && (
              <button
                type="button"
                onClick={handleClaudeVision}
                className="flex items-center gap-1.5 text-sm text-primary font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Mit Claude Vision versuchen
                <span className="text-muted-foreground font-normal text-xs">~0.01 CHF</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
