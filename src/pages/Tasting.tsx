import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useWineStore } from "@/hooks/useWineStore";
import { compressImage } from "@/lib/imageCompression";
import { cn } from "@/lib/utils";
import { Camera, Image, Save, ScanLine, Star, Trash2, Trophy, X } from "lucide-react";
import { createWineImage, type WineImage, type WishlistItem } from "@/data/wines";
import { MAX_WINE_IMAGES, WEB_TASTING_IMAGE_UPLOAD_MAX_BYTES } from "@vinotheque/core";
import { WineLabelScanner, type ScanResult } from "@/components/WineLabelScanner";

interface TastingForm {
  eventName: string;
  supplier: string;
  stand: string;
  wineName: string;
  comment: string;
}

const emptyForm: TastingForm = {
  eventName: "",
  supplier: "",
  stand: "",
  wineName: "",
  comment: "",
};

export default function Tasting() {
  const { addWishlistItem, settings } = useWineStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<TastingForm>(emptyForm);
  const [showScanner, setShowScanner] = useState(false);
  const [rating, setRating] = useState<number | undefined>();
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [images, setImages] = useState<WineImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const set = (field: keyof TastingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleScanResult = (result: ScanResult) => {
    setForm((prev) => ({
      ...prev,
      ...(result.name && !prev.wineName ? { wineName: result.name } : {}),
      ...(result.producer && !prev.supplier ? { supplier: result.producer } : {}),
    }));
    setShowScanner(false);
  };

  const addImageFile = async (file: File, label: WineImage["label"] = "Flasche") => {
    if (images.length >= MAX_WINE_IMAGES) {
      toast({ title: "Maximal 3 Bilder", description: "Pro Degu-Eintrag koennen bis zu drei Bilder gespeichert werden." });
      return;
    }
    if (!file.type.startsWith("image/")) return;
    if (file.size > WEB_TASTING_IMAGE_UPLOAD_MAX_BYTES) {
      toast({ title: "Bild ist zu gross", description: "Bitte ein kleineres Bild waehlen (max. 4 MB).", variant: "destructive" });
      return;
    }

    try {
      const uri = await compressImage(file);
      setImages((current) => [
        ...current,
        createWineImage(uri, current.length === 0 ? label : "Etikett", current.length === 0),
      ]);
    } catch (error) {
      toast({
        title: "Bild konnte nicht verarbeitet werden",
        description: error instanceof Error ? error.message : "Bitte versuche es mit einem anderen Bild.",
        variant: "destructive",
      });
    }
  };

  const handleImageInput = async (event: React.ChangeEvent<HTMLInputElement>, label: WineImage["label"]) => {
    const file = event.target.files?.[0];
    if (file) await addImageFile(file, label);
    event.target.value = "";
  };

  const removeImage = (imageId: string) => {
    setImages((current) => current
      .filter((image) => image.id !== imageId)
      .map((image, index) => ({ ...image, isPrimary: index === 0 })));
  };

  const makePrimaryImage = (imageId: string) => {
    setImages((current) => current.map((image) => ({ ...image, isPrimary: image.id === imageId })));
  };

  const saveTasting = () => {
    if (isSaving) return;
    if (!rating && !form.comment.trim() && images.length === 0 && !form.wineName.trim()) {
      toast({
        title: "Noch leer",
        description: "Bitte erfasse mindestens Foto, Bewertung, Kommentar oder Weinname.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const fallbackName = `Degu-Eintrag ${new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })}`;
    const location = [form.eventName.trim(), form.supplier.trim(), form.stand.trim()].filter(Boolean).join(" · ");

    const item: Omit<WishlistItem, "id" | "createdAt"> = {
      name: form.wineName.trim() || fallbackName,
      producer: form.supplier.trim() || undefined,
      rating,
      notes: form.comment.trim() || undefined,
      images,
      tastedDate: new Date().toISOString().split("T")[0],
      tastedLocation: location || undefined,
      tastingEvent: form.eventName.trim() || undefined,
      tastingSupplier: form.supplier.trim() || undefined,
      tastingStand: form.stand.trim() || undefined,
      location,
      occasion: "Messe-Degustation",
      companions: "",
      source: "tasting",
    };

    try {
      addWishlistItem(item);
      toast({ title: "Degu gespeichert", description: `${item.name} wurde in die Merkliste uebernommen.` });
      navigate("/wishlist");
    } catch (error) {
      setIsSaving(false);
      toast({
        title: "Speichern fehlgeschlagen",
        description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Messe</p>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Wein-Degu</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Schnell erfassen am Stand, Details spaeter in der Merkliste nachziehen.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-4">
          <section className="apple-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Kontext</h2>
              <button
                type="button"
                onClick={() => setShowScanner((v) => !v)}
                className={cn(
                  "ml-auto flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors",
                  showScanner
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
                )}
              >
                <ScanLine className="w-3.5 h-3.5" />
                Etikett scannen
              </button>
            </div>
            {showScanner && (
              <div className="px-4 pt-3 pb-1">
                <WineLabelScanner
                  onResult={handleScanResult}
                  compact
                  apiKey={settings.anthropicApiKey}
                />
              </div>
            )}
            <div className="p-4 grid md:grid-cols-2 gap-4">
              <Field label="Messe / Event">
                <Input value={form.eventName} onChange={(event) => set("eventName", event.target.value)} placeholder="z.B. Expovina" />
              </Field>
              <Field label="Lieferant">
                <Input value={form.supplier} onChange={(event) => set("supplier", event.target.value)} placeholder="z.B. Domaine Muster" />
              </Field>
              <Field label="Stand / Halle">
                <Input value={form.stand} onChange={(event) => set("stand", event.target.value)} placeholder="z.B. Halle 3, Stand B12" />
              </Field>
              <Field label="Weinname optional">
                <Input value={form.wineName} onChange={(event) => set("wineName", event.target.value)} placeholder="Kann spaeter ergaenzt werden" />
              </Field>
            </div>
          </section>

          <section className="apple-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Fotos</h2>
              <span className="ml-auto text-xs text-muted-foreground">{images.length}/{MAX_WINE_IMAGES}</span>
            </div>
            <div className="p-4 space-y-4">
              {images.length > 0 && (
                <div className="grid sm:grid-cols-3 gap-3">
                  {images.map((image) => (
                    <div key={image.id} className="relative h-40 rounded-lg overflow-hidden border border-border bg-black/10">
                      <img src={image.uri} alt={image.label ?? "Degu-Foto"} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/85 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        title="Bild entfernen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => makePrimaryImage(image.id)}
                        className={cn(
                          "absolute left-2 bottom-2 rounded-md px-2 py-1 text-[11px] font-semibold",
                          image.isPrimary ? "bg-primary text-primary-foreground" : "bg-background/85 text-foreground"
                        )}
                      >
                        {image.isPrimary ? "Hauptbild" : "Als Hauptbild"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < MAX_WINE_IMAGES && (
                <label
                  onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                  onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) void addImageFile(file, images.length === 0 ? "Liste" : "Flasche");
                  }}
                  className={cn(
                    "relative rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 px-4 py-8 text-center transition-colors cursor-pointer overflow-hidden",
                    isDragging ? "border-primary/60 bg-primary/8" : "border-border hover:border-primary/50"
                  )}
                >
                  <Camera className={cn("w-8 h-8", isDragging ? "text-primary/70" : "text-muted-foreground/60")} />
                  <span className="text-sm font-medium text-foreground">
                    {isDragging ? "Loslassen" : "Foto hochladen oder hier ablegen"}
                  </span>
                  <span className="text-xs text-muted-foreground">Standliste, Flasche oder Etikett</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(event) => void handleImageInput(event, images.length === 0 ? "Liste" : "Flasche")}
                  />
                </label>
              )}
            </div>
          </section>

          <section className="apple-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Bewertung</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  const active = value <= (hoverRating ?? rating ?? 0);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-amber-50 transition-colors"
                      title={`${value} Sterne`}
                    >
                      <Star className={cn("w-6 h-6", active ? "text-wine-gold fill-wine-gold" : "text-muted-foreground/25")} />
                    </button>
                  );
                })}
                {rating && (
                  <button type="button" onClick={() => setRating(undefined)} className="ml-2 text-xs text-muted-foreground hover:text-foreground">
                    Zuruecksetzen
                  </button>
                )}
              </div>

              <Field label="Kommentar">
                <Textarea
                  value={form.comment}
                  onChange={(event) => set("comment", event.target.value)}
                  placeholder="Kurzer Eindruck, Kaufinteresse, Preisnotiz..."
                  className="min-h-[110px] resize-none"
                />
              </Field>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 apple-card p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Speichern</p>
            <h2 className="font-display font-semibold text-lg">Degu-Eintrag</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Der Eintrag landet in der Merkliste und kann dort spaeter verfeinert werden.
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
            <p><span className="text-muted-foreground">Fotos:</span> {images.length}/{MAX_WINE_IMAGES}</p>
            <p><span className="text-muted-foreground">Bewertung:</span> {rating ? `${rating}/5` : "offen"}</p>
            <p><span className="text-muted-foreground">Kontext:</span> {[form.eventName, form.supplier, form.stand].filter(Boolean).join(" · ") || "offen"}</p>
          </div>
          <Button variant="wine" className="w-full gap-1.5" onClick={saveTasting} disabled={isSaving}>
            <Save className="w-4 h-4" />
            In Merkliste speichern
          </Button>
          <Button variant="outline" className="w-full gap-1.5" onClick={() => {
            setForm(emptyForm);
            setRating(undefined);
            setImages([]);
          }}>
            <Trash2 className="w-4 h-4" />
            Zuruecksetzen
          </Button>
        </aside>
      </div>
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-body text-sm">{label}</Label>
      {children}
    </div>
  );
}
