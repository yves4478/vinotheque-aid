import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useWineStore } from "@/hooks/useWineStore";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { extractTextFromPdf, parseInvoiceWithClaude } from "@/lib/invoiceParse";
import type { ParsedPosition } from "@/lib/invoiceParse";
import { getWineTypeLabel } from "@vinotheque/core";
import {
  FileText, Upload, Loader2, CheckSquare, Square, ArrowRight,
  AlertCircle, KeyRound, Sparkles, PackagePlus, RefreshCcw, X,
} from "lucide-react";

type Step = "upload" | "parsing" | "review" | "done";

export default function InvoiceImport() {
  const { settings, addWine } = useWineStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const dropRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseStatus, setParseStatus] = useState("");
  const [positions, setPositions] = useState<ParsedPosition[]>([]);
  const [error, setError] = useState<string | null>(null);

  const apiKey = settings.anthropicApiKey ?? "";
  const selectedCount = positions.filter((p) => p.selected).length;

  // ── File handling ──────────────────────────────────────────────────────────

  async function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Nur PDF-Dateien werden unterstützt.");
      return;
    }
    if (!apiKey) {
      setError("Kein Anthropic API-Key konfiguriert. Bitte unter Einstellungen hinterlegen.");
      return;
    }
    setError(null);
    setFileName(file.name);
    setStep("parsing");

    try {
      setParseStatus("PDF wird gelesen…");
      const text = await extractTextFromPdf(file);

      if (text.trim().length < 20) {
        throw new Error("Der PDF-Text ist zu kurz oder der Inhalt ist nicht lesbar (möglicherweise ein Scan ohne OCR).");
      }

      setParseStatus("KI analysiert die Positionen…");
      const parsed = await parseInvoiceWithClaude(text, apiKey);

      if (parsed.length === 0) {
        throw new Error("Keine Weinpositionen erkannt. Bitte prüfe, ob das PDF eine Rechnung oder einen Lieferschein enthält.");
      }

      setPositions(parsed);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setStep("upload");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  }

  // ── Table editing ──────────────────────────────────────────────────────────

  function updatePosition<K extends keyof ParsedPosition>(id: string, key: K, value: ParsedPosition[K]) {
    setPositions((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
  }

  function toggleAll(checked: boolean) {
    setPositions((prev) => prev.map((p) => ({ ...p, selected: checked })));
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  function handleImport() {
    const toImport = positions.filter((p) => p.selected);
    if (toImport.length === 0) return;

    const today = new Date().toISOString().split("T")[0];
    let imported = 0;

    for (const pos of toImport) {
      if (!pos.name.trim()) continue;
      addWine({
        name: pos.name.trim(),
        producer: pos.producer.trim(),
        vintage: pos.vintage ?? 0,
        quantity: pos.quantity,
        purchasePrice: pos.purchasePrice ?? 0,
        purchaseDate: today,
        purchaseLocation: "",
        region: pos.region.trim(),
        country: pos.country.trim(),
        type: pos.type ?? "rot",
        grape: pos.grape.trim(),
        drinkFrom: pos.vintage ? pos.vintage + 2 : 0,
        drinkUntil: pos.vintage ? pos.vintage + 10 : 0,
      });
      imported++;
    }

    toast({
      title: `${imported} Wein${imported !== 1 ? "e" : ""} importiert`,
      description: `Erfolgreich in den Weinkeller übernommen.`,
    });
    setStep("done");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="mb-6 animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Import</p>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Rechnung / Lieferschein</h1>
        <p className="text-sm text-muted-foreground mt-1">
          PDF hochladen — KI erkennt die Weinpositionen, du wählst was in den Keller kommt.
        </p>
      </div>

      {/* ── No API key warning ─────────────────────────────────── */}
      {!apiKey && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50 mb-6 animate-fade-in">
          <KeyRound className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Kein API-Key konfiguriert.</span>{" "}
            Hinterlege deinen Anthropic-Key in den{" "}
            <button onClick={() => navigate("/settings")} className="underline font-semibold">
              Einstellungen
            </button>
            , um den Import zu nutzen.
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/50 bg-destructive/8 mb-6 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1 text-sm text-destructive">{error}</div>
          <button onClick={() => setError(null)}><X className="w-4 h-4 text-destructive/60 hover:text-destructive" /></button>
        </div>
      )}

      {/* ── Step: Upload ──────────────────────────────────────── */}
      {step === "upload" && (
        <div className="max-w-xl animate-fade-in">
          <label
            ref={dropRef as React.RefObject<HTMLLabelElement>}
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "apple-card flex flex-col items-center justify-center gap-3 px-8 py-16 text-center cursor-pointer transition-colors",
              isDragging ? "border-primary/60 bg-primary/5" : "hover:border-primary/40 hover:bg-muted/30",
            )}
          >
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
              isDragging ? "bg-primary/15" : "bg-muted/60",
            )}>
              <Upload className={cn("w-7 h-7", isDragging ? "text-primary" : "text-muted-foreground/60")} />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {isDragging ? "PDF loslassen" : "PDF hier ablegen"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">oder klicken zum Auswählen</p>
            </div>
            <p className="text-xs text-muted-foreground/70">Rechnung, Lieferschein, Bestellbestätigung</p>
            <input type="file" accept=".pdf" className="sr-only" onChange={handleFileInput} />
          </label>

          <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
            <span>
              Claude liest Weinname, Produzent, Jahrgang, Menge und Preis aus. Du prüfst und korrigierst vor dem Import.
            </span>
          </div>
        </div>
      )}

      {/* ── Step: Parsing ─────────────────────────────────────── */}
      {step === "parsing" && (
        <div className="max-w-xl apple-card p-10 flex flex-col items-center gap-4 text-center animate-fade-in">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <div>
            <p className="font-semibold text-foreground">{parseStatus}</p>
            <p className="text-sm text-muted-foreground mt-1">{fileName}</p>
          </div>
        </div>
      )}

      {/* ── Step: Review ──────────────────────────────────────── */}
      {step === "review" && (
        <div className="animate-fade-in space-y-4">
          {/* Summary bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {positions.length} Position{positions.length !== 1 ? "en" : ""} erkannt
                  <span className="ml-2 text-muted-foreground font-normal">· {fileName}</span>
                </p>
                <p className="text-xs text-muted-foreground">{selectedCount} ausgewählt für Import</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStep("upload"); setPositions([]); }}
              >
                <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
                Neue Datei
              </Button>
              <Button
                variant="wine"
                size="sm"
                disabled={selectedCount === 0}
                onClick={handleImport}
              >
                <PackagePlus className="w-4 h-4 mr-1.5" />
                {selectedCount} Wein{selectedCount !== 1 ? "e"  : ""} importieren
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="apple-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 py-3 text-left w-10">
                    <button
                      onClick={() => toggleAll(selectedCount < positions.length)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {selectedCount === positions.length
                        ? <CheckSquare className="w-4 h-4 text-primary" />
                        : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Weinname</th>
                  <th className="px-3 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Produzent</th>
                  <th className="px-3 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Jg.</th>
                  <th className="px-3 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Typ</th>
                  <th className="px-3 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wide">Anz.</th>
                  <th className="px-3 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wide">Preis/Fl.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {positions.map((pos) => (
                  <tr
                    key={pos.id}
                    className={cn(
                      "transition-colors",
                      pos.selected ? "bg-white hover:bg-muted/20" : "bg-muted/10 opacity-50",
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <button onClick={() => updatePosition(pos.id, "selected", !pos.selected)}>
                        {pos.selected
                          ? <CheckSquare className="w-4 h-4 text-primary" />
                          : <Square className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </td>
                    <td className="px-3 py-2 min-w-[160px]">
                      <Input
                        value={pos.name}
                        onChange={(e) => updatePosition(pos.id, "name", e.target.value)}
                        className="h-7 text-sm font-medium border-transparent hover:border-border focus:border-primary bg-transparent px-1"
                      />
                    </td>
                    <td className="px-3 py-2 min-w-[130px]">
                      <Input
                        value={pos.producer}
                        onChange={(e) => updatePosition(pos.id, "producer", e.target.value)}
                        className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent px-1"
                      />
                    </td>
                    <td className="px-3 py-2 w-20">
                      <Input
                        value={pos.vintage ?? ""}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          updatePosition(pos.id, "vintage", Number.isNaN(v) ? null : v);
                        }}
                        placeholder="–"
                        className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent px-1 w-16"
                      />
                    </td>
                    <td className="px-3 py-2 w-28">
                      <select
                        value={pos.type ?? ""}
                        onChange={(e) => updatePosition(pos.id, "type", (e.target.value || null) as ParsedPosition["type"])}
                        className="h-7 text-sm bg-transparent border border-transparent hover:border-border focus:border-primary rounded-md px-1 w-full cursor-pointer"
                      >
                        <option value="">–</option>
                        {(["rot", "weiss", "rosé", "schaumwein", "dessert"] as const).map((t) => (
                          <option key={t} value={t}>{getWineTypeLabel(t)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 w-16">
                      <Input
                        type="number"
                        min={1}
                        value={pos.quantity}
                        onChange={(e) => updatePosition(pos.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent px-1 text-right w-14"
                      />
                    </td>
                    <td className="px-3 py-2 w-24 text-right">
                      <Input
                        type="number"
                        min={0}
                        step={0.05}
                        value={pos.purchasePrice ?? ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          updatePosition(pos.id, "purchasePrice", Number.isNaN(v) ? null : v);
                        }}
                        placeholder="–"
                        className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent px-1 text-right w-20"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals footer */}
              <tfoot>
                <tr className="border-t border-border bg-muted/20">
                  <td colSpan={5} className="px-3 py-2.5 text-xs text-muted-foreground">
                    {selectedCount} von {positions.length} Positionen
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm font-semibold">
                    {positions.filter((p) => p.selected).reduce((s, p) => s + p.quantity, 0)} Fl.
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm font-semibold">
                    {formatCurrency(
                      positions
                        .filter((p) => p.selected && p.purchasePrice !== null)
                        .reduce((s, p) => s + (p.purchasePrice ?? 0) * p.quantity, 0) || undefined
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom action bar */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setStep("upload"); setPositions([]); }}>
              Abbrechen
            </Button>
            <Button variant="wine" disabled={selectedCount === 0} onClick={handleImport}>
              <PackagePlus className="w-4 h-4 mr-1.5" />
              {selectedCount} Wein{selectedCount !== 1 ? "e" : ""} in Keller importieren
            </Button>
          </div>
        </div>
      )}

      {/* ── Step: Done ────────────────────────────────────────── */}
      {step === "done" && (
        <div className="max-w-md apple-card p-10 flex flex-col items-center gap-5 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <PackagePlus className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">Import abgeschlossen</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Die Weine sind jetzt im Weinkeller.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setStep("upload"); setPositions([]); setFileName(""); }}>
              <RefreshCcw className="w-4 h-4 mr-1.5" />
              Weitere Rechnung
            </Button>
            <Button variant="wine" onClick={() => navigate("/cellar")}>
              Zum Weinkeller
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
