import { useRef, useState } from "react";
import { Camera, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { createWorker } from "tesseract.js";

export interface ScanResult {
  name: string;
  producer: string;
  vintage: number | undefined;
  rawText: string;
}

interface WineLabelScannerProps {
  onResult: (result: Partial<ScanResult>) => void;
}

function parseWineLabel(text: string): Partial<ScanResult> {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  // Vintage: find a 4-digit year between 1950 and current year
  const currentYear = new Date().getFullYear();
  let vintage: number | undefined;
  for (const line of lines) {
    const match = line.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
    if (match) {
      const y = parseInt(match[1]);
      if (y <= currentYear) {
        vintage = y;
        break;
      }
    }
  }

  // Filter out noise: lines with only numbers, very short lines, % vol, cl, ml
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

  // Remove the vintage line from content lines
  const withoutVintage = contentLines.filter(
    (l) => !l.match(/\b(19[5-9]\d|20[0-2]\d)\b/) || l.replace(/\b(19[5-9]\d|20[0-2]\d)\b/, "").trim().length > 3
  );

  // Heuristic: first meaningful line = producer, second = wine name
  // (on most European wine labels)
  const producer = withoutVintage[0] ?? "";
  const name = withoutVintage[1] ?? "";

  return { name, producer, vintage, rawText: text };
}

type ScanState = "idle" | "scanning" | "done" | "error";

export function WineLabelScanner({ onResult }: WineLabelScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [progress, setProgress] = useState(0);
  const [parsed, setParsed] = useState<Partial<ScanResult> | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setState("scanning");
    setProgress(0);
    setParsed(null);

    try {
      const worker = await createWorker("eng+deu+fra+ita+spa", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data } = await worker.recognize(file);
      await worker.terminate();

      const result = parseWineLabel(data.text);
      setParsed(result);
      setState("done");
    } catch (err) {
      console.error(err);
      setErrorMsg("Texterkennung fehlgeschlagen. Bitte Felder manuell ausfüllen.");
      setState("error");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setState("idle");
    setPreview(null);
    setParsed(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const applyResult = () => {
    if (parsed) {
      onResult(parsed);
    }
    reset();
  };

  return (
    <div className="apple-card p-4 mb-6">
      {/* Hidden camera input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />

      {state === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-3 py-5 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Camera className="w-7 h-7" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm">Weinetikett fotografieren</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kamera öffnen → Felder werden automatisch ausgefüllt
            </p>
          </div>
        </button>
      )}

      {state === "scanning" && (
        <div className="flex flex-col items-center gap-4 py-4">
          {preview && (
            <img src={preview} className="w-32 h-40 object-cover rounded-xl shadow" alt="Etikett" />
          )}
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Texterkennung läuft… {progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {state === "done" && parsed && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-semibold">Etikett erkannt</span>
          </div>

          <div className="grid gap-2 text-sm">
            {parsed.producer && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-muted-foreground">Produzent</span>
                <span className="font-medium text-right max-w-[60%] truncate">{parsed.producer}</span>
              </div>
            )}
            {parsed.name && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-right max-w-[60%] truncate">{parsed.name}</span>
              </div>
            )}
            {parsed.vintage && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Jahrgang</span>
                <span className="font-medium">{parsed.vintage}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={applyResult}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              Übernehmen
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-sm text-primary underline"
          >
            Nochmal versuchen
          </button>
        </div>
      )}
    </div>
  );
}
