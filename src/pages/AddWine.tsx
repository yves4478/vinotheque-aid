import { useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { WineLabelScanner } from "@/components/WineLabelScanner";
import { Save, Gift, Gem, ChevronDown, ChevronUp, Package, BookOpen, Wine, Minus, Plus, ShoppingCart, Image as ImageIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GrapeSelector } from "@/components/GrapeSelector";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";
import { BOTTLE_SIZES, createWineImage, getWineImages } from "@/data/wines";
import type { Wine as WineType, WishlistItem } from "@/data/wines";
import { countries, getRegionsForCountry } from "@/data/countryRegions";
import { cn } from "@/lib/utils";

const currentYear = new Date().getFullYear();
type StorageMode = "cellar" | "tasted" | "shopping";

// Breakpoints:
// sm  640px  — iPhone landscape
// md  768px  — iPad 10" portrait
// lg  1024px — iPad 13" / small PC
// xl  1280px — PC 13–16"

function resolveMode(param: string | null): StorageMode {
  if (param === "shopping") return "shopping";
  if (param === "tasted" || param === "merkliste") return "tasted";
  return "cellar";
}

const AddWine = () => {
  const { addWine, addWishlistItem, addShoppingItem } = useWineStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const formId = useId();

  const returnTo = searchParams.get("return") ?? "/cellar";
  const [storageMode, setStorageMode] = useState<StorageMode>(() => resolveMode(searchParams.get("mode")));
  const [showOptional, setShowOptional] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);
  // Track which required fields have errors
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({
    name: "",
    producer: "",
    vintage: currentYear,
    region: "",
    country: "",
    type: "rot" as WineType["type"],
    grape: "",
    quantity: 1,
    purchasePrice: 0,
    purchaseDate: new Date().toISOString().split("T")[0],
    purchaseLocation: "",
    drinkFrom: currentYear,
    drinkUntil: currentYear + 10,
    rating: undefined as number | undefined,
    ratingSource: "",
    notes: "",
    isGift: false,
    giftFrom: "",
    isRarity: false,
    bottleSize: "standard",
    purchaseLink: "",
    tastedDate: new Date().toISOString().split("T")[0],
    tastedLocation: "",
    reason: "",
    images: [] as WineType["images"],
  });

  const set = (field: string, value: string | number | boolean | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: false }));
  };

  const handleScanResult = (result: { name?: string; producer?: string; vintage?: number }) => {
    setForm((prev) => ({
      ...prev,
      name: result.name || prev.name,
      producer: result.producer || prev.producer,
      vintage: result.vintage || prev.vintage,
    }));
    if (result.name) setErrors((e) => ({ ...e, name: false }));
    if (result.producer) setErrors((e) => ({ ...e, producer: false }));
    toast({ title: "Etikett erkannt", description: "Felder wurden vorausgefüllt – bitte prüfen." });
  };

  const syncImages = (images: WineType["images"]) => {
    const normalized = (images ?? []).slice(0, 3).map((image, index) => ({
      ...image,
      isPrimary: images?.some((candidate) => candidate.isPrimary) ? image.isPrimary : index === 0,
    }));
    setForm((prev) => ({ ...prev, images: normalized }));
  };

  const handleImageFile = (file: File) => {
    if ((form.images?.length ?? 0) >= 3) {
      toast({ title: "Maximal 3 Bilder", description: "Pro Wein koennen bis zu drei Bilder gespeichert werden." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Bild ist zu gross", description: "Bitte ein kleineres Bild waehlen (max. 2 MB).", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.72);
        const currentImages = form.images ?? [];
        syncImages([
          ...currentImages,
          createWineImage(compressed, currentImages.length === 0 ? "Flasche" : "Etikett", currentImages.length === 0),
        ]);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleImageFile(file);
    event.target.value = "";
  };

  const removeImage = (imageId: string) => {
    const next = (form.images ?? []).filter((image) => image.id !== imageId);
    syncImages(next.map((image, index) => ({ ...image, isPrimary: index === 0 })));
  };

  const makePrimaryImage = (imageId: string) => {
    syncImages((form.images ?? []).map((image) => ({ ...image, isPrimary: image.id === imageId })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim()) newErrors.name = true;
    if (!form.producer.trim()) newErrors.producer = true;
    if (form.isGift && !form.giftFrom.trim()) newErrors.giftFrom = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Pflichtfelder ausfüllen",
        description: "Bitte alle rot markierten Felder ausfüllen.",
        variant: "destructive",
      });
      // Scroll to first error
      const firstError = document.querySelector("[data-error='true']");
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (storageMode === "shopping") {
        addShoppingItem({
          name: form.name.trim(),
          producer: form.producer.trim(),
          quantity: form.quantity,
          estimatedPrice: form.purchasePrice,
          reason: form.reason.trim(),
        });
        toast({ title: "Auf Einkaufsliste ✓", description: `${form.name} wurde hinzugefügt.` });
        navigate(returnTo);
        return;
      }

      if (storageMode === "cellar") {
        const images = getWineImages({ images: form.images, imageData: undefined, imageUri: undefined, imageUrl: undefined });
        const primaryImage = images.find((image) => image.isPrimary) ?? images[0];
        addWine({
          name: form.name.trim(), producer: form.producer.trim(), vintage: form.vintage,
          region: form.region.trim(), country: form.country.trim(), type: form.type,
          grape: form.grape.trim(), quantity: form.quantity, purchasePrice: form.purchasePrice,
          purchaseDate: form.purchaseDate, purchaseLocation: form.purchaseLocation.trim(),
          drinkFrom: form.drinkFrom, drinkUntil: form.drinkUntil,
          rating: form.rating || undefined,
          ratingSource: form.ratingSource.trim() || undefined,
          notes: form.notes.trim() || undefined,
          imageData: primaryImage?.uri,
          images,
          purchaseLink: form.purchaseLink.trim() || undefined,
          isGift: form.isGift || undefined,
          giftFrom: form.isGift ? form.giftFrom.trim() : undefined,
          isRarity: form.isRarity || undefined,
          bottleSize: form.bottleSize !== "standard" ? form.bottleSize : undefined,
        });
        toast({ title: "Ins Lager aufgenommen ✓", description: `${form.name} ist jetzt im Keller.` });
        navigate(returnTo);
        return;
      }

      const images = getWineImages({ images: form.images, imageData: undefined, imageUri: undefined });
      const primaryImage = images.find((image) => image.isPrimary) ?? images[0];
      addWishlistItem({
        name: form.name.trim(), producer: form.producer.trim() || undefined,
        vintage: form.vintage, type: form.type,
        region: form.region.trim() || undefined, country: form.country.trim() || undefined,
        grape: form.grape.trim() || undefined, rating: form.rating || undefined,
        notes: form.notes.trim() || undefined, tastedDate: form.tastedDate,
        tastedLocation: form.tastedLocation.trim() || undefined,
        price: form.purchasePrice || undefined,
        imageData: primaryImage?.uri,
        images,
        location: form.tastedLocation.trim() || "", occasion: "", companions: "",
        source: "add-wine",
      } as Omit<WishlistItem, "id" | "createdAt">);
      toast({ title: "Auf Merkliste ✓", description: `${form.name} wurde registriert.` });
      navigate(returnTo);
      return;
    } catch (error) {
      const description = error instanceof Error && error.message
        ? error.message
        : "Bitte versuche es erneut. Falls das Problem bleibt, prüfe den Browser-Speicher.";

      toast({
        title: "Speichern fehlgeschlagen",
        description,
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  const isCellar = storageMode === "cellar";
  const isShopping = storageMode === "shopping";

  return (
    <AppLayout>
      <div className="mb-6 animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Keller</p>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Wein erfassen</h1>
      </div>

      <div className="lg:grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] lg:gap-8 lg:items-start animate-fade-in" style={{ animationDelay: "60ms" }}>

        {/* ═══════════════════════════════════
            LEFT PANEL — Mode + Scanner (sticky on desktop)
        ═══════════════════════════════════ */}
        <div className="lg:sticky lg:top-6 space-y-4 mb-6 lg:mb-0">

          {/* Mode switcher */}
          <div className="apple-card p-1.5 flex">
            <ModeButton active={isCellar} onClick={() => setStorageMode("cellar")}
              icon={<Package className="w-4 h-4" />} label="Weinkeller" sub="Flaschen einlagern" />
            <ModeButton active={storageMode === "tasted"} onClick={() => setStorageMode("tasted")}
              icon={<BookOpen className="w-4 h-4" />} label="Merkliste" sub="Getrunken, gesehen…" />
            <ModeButton active={isShopping} onClick={() => setStorageMode("shopping")}
              icon={<ShoppingCart className="w-4 h-4" />} label="Einkaufsliste" sub="Für den Einkauf" />
          </div>

          {/* Scanner — all devices */}
          <WineLabelScanner onResult={handleScanResult} compact />

          {/* Desktop save button */}
          <div className="hidden lg:block">
            <SaveBar
              storageMode={storageMode}
              isSubmitting={isSubmitting}
              onCancel={() => navigate(returnTo)}
              formId={formId}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════
            RIGHT PANEL — Form
        ═══════════════════════════════════ */}
        <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* ── BASISDATEN ─────────────────────────────────── */}
          <Section title="Basisdaten" icon={<Wine className="w-4 h-4 text-primary" />} badge="Pflichtfelder" badgeColor="text-red-500">
            <div className="divide-y divide-gray-100">
              {/* Name + Producer: side-by-side on md+ */}
              <div className="md:grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <FormRow label="Weinname *" error={errors.name}>
                  <Input
                    placeholder="z.B. Barolo Riserva"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    data-error={errors.name}
                    className={cn(
                      "border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 w-full",
                      errors.name && "text-red-500 placeholder:text-red-300"
                    )}
                  />
                </FormRow>
                <FormRow label="Produzent *" error={errors.producer}>
                  <Input
                    placeholder="z.B. Conterno"
                    value={form.producer}
                    onChange={(e) => set("producer", e.target.value)}
                    data-error={errors.producer}
                    className={cn(
                      "border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 w-full",
                      errors.producer && "text-red-500 placeholder:text-red-300"
                    )}
                  />
                </FormRow>
              </div>

              {/* Jahrgang + Typ */}
              <div className="md:grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <FormRow label="Jahrgang">
                  <Input type="number" min={1900} max={currentYear}
                    value={form.vintage}
                    onChange={(e) => set("vintage", parseInt(e.target.value) || currentYear)}
                    className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24" />
                </FormRow>
                <FormRow label="Typ">
                  <NativeSelect
                    value={form.type}
                    onChange={(v) => set("type", v)}
                    options={[
                      { value: "rot", label: "Rotwein" },
                      { value: "weiss", label: "Weisswein" },
                      { value: "rosé", label: "Rosé" },
                      { value: "schaumwein", label: "Schaumwein" },
                      { value: "dessert", label: "Dessertwein" },
                    ]}
                  />
                </FormRow>
              </div>

              {/* Land + Region */}
              <div className="md:grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <FormRow label="Land">
                  <NativeSelect
                    value={form.country}
                    onChange={(v) => { set("country", v); set("region", ""); }}
                    placeholder="Wählen…"
                    options={countries.map((c) => ({ value: c, label: c }))}
                  />
                </FormRow>
                <FormRow label="Region">
                  <NativeSelect
                    value={form.region}
                    onChange={(v) => set("region", v)}
                    placeholder={form.country ? "Wählen…" : "–"}
                    disabled={!form.country}
                    options={getRegionsForCountry(form.country).map((r) => ({ value: r, label: r }))}
                  />
                </FormRow>
              </div>

              {/* Grape selector */}
              <div className="px-4 py-3">
                <Label className="text-sm font-normal text-foreground mb-2 block">Rebsorte</Label>
                <GrapeSelector value={form.grape} onChange={(v) => set("grape", v)} />
              </div>
            </div>
          </Section>

          {/* ── ANS LAGER ──────────────────────────────────── */}
          {isCellar && (
            <Section title="Kauf & Keller">
              <div className="divide-y divide-gray-100">
                {/* Quantity stepper + price */}
                <div className="md:grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  <FormRow label="Flaschen">
                    <Stepper
                      value={form.quantity}
                      min={1}
                      onChange={(v) => set("quantity", v)}
                    />
                  </FormRow>
                  <FormRow label="Preis / Flasche (CHF)">
                    <Input type="number" min={0} step={0.01}
                      value={form.purchasePrice}
                      onChange={(e) => set("purchasePrice", parseFloat(e.target.value) || 0)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24" />
                  </FormRow>
                </div>

                {/* Date + Location */}
                <div className="md:grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  <FormRow label="Kaufdatum">
                    <Input type="date" value={form.purchaseDate}
                      onChange={(e) => set("purchaseDate", e.target.value)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-36" />
                  </FormRow>
                  <FormRow label="Bezugsquelle">
                    <Input placeholder="z.B. Weinhandlung Kreis"
                      value={form.purchaseLocation}
                      onChange={(e) => set("purchaseLocation", e.target.value)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 min-w-0 w-full max-w-[180px]" />
                  </FormRow>
                </div>

                {/* Drink window */}
                <div className="md:grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  <FormRow label="Trinkreif ab">
                    <Input type="number" min={1900} max={2100}
                      value={form.drinkFrom}
                      onChange={(e) => set("drinkFrom", parseInt(e.target.value) || currentYear)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24" />
                  </FormRow>
                  <FormRow label="Trinkreif bis">
                    <Input type="number" min={1900} max={2100}
                      value={form.drinkUntil}
                      onChange={(e) => set("drinkUntil", parseInt(e.target.value) || currentYear + 10)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24" />
                  </FormRow>
                </div>

                {/* Bottle size */}
                <FormRow label="Flaschengrösse">
                  <NativeSelect
                    value={form.bottleSize}
                    onChange={(v) => set("bottleSize", v)}
                    options={BOTTLE_SIZES.map((s) => ({ value: s.value, label: s.label }))}
                  />
                </FormRow>
              </div>
            </Section>
          )}

          {/* ── NUR REGISTRIEREN ───────────────────────────── */}
          {storageMode === "tasted" && (
            <Section title="Erlebnis" icon={<BookOpen className="w-4 h-4 text-primary" />}>
              <div className="divide-y divide-gray-100">
                <div className="md:grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  <FormRow label="Datum">
                    <Input type="date" value={form.tastedDate}
                      onChange={(e) => set("tastedDate", e.target.value)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-36" />
                  </FormRow>
                  <FormRow label="Preis (CHF)">
                    <Input type="number" min={0} step={0.01}
                      value={form.purchasePrice}
                      onChange={(e) => set("purchasePrice", parseFloat(e.target.value) || 0)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24" />
                  </FormRow>
                </div>
                <FormRow label="Ort / Anlass">
                  <Input placeholder="z.B. Restaurant Kronenhalle"
                    value={form.tastedLocation}
                    onChange={(e) => set("tastedLocation", e.target.value)}
                    className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/40" />
                </FormRow>
              </div>
            </Section>
          )}

          {/* ── EINKAUFSLISTE ──────────────────────────────── */}
          {isShopping && (
            <Section title="Einkauf" icon={<ShoppingCart className="w-4 h-4 text-primary" />}>
              <div className="divide-y divide-gray-100">
                <div className="md:grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  <FormRow label="Anzahl">
                    <Stepper value={form.quantity} min={1} onChange={(v) => set("quantity", v)} />
                  </FormRow>
                  <FormRow label="Geschätzter Preis (CHF)">
                    <Input type="number" min={0} step={0.5}
                      value={form.purchasePrice}
                      onChange={(e) => set("purchasePrice", parseFloat(e.target.value) || 0)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24" />
                  </FormRow>
                </div>
                <FormRow label="Grund / Notiz">
                  <Input placeholder="z.B. Liebling auffüllen"
                    value={form.reason}
                    onChange={(e) => set("reason", e.target.value)}
                    className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 w-full" />
                </FormRow>
              </div>
            </Section>
          )}

          {!isShopping && (
            <Section title="Bilder" icon={<ImageIcon className="w-4 h-4 text-primary" />} badge={`${form.images?.length ?? 0}/3`}>
              <div className="p-4 space-y-3">
                {(form.images?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {form.images?.map((image) => (
                      <div key={image.id} className="relative h-28 rounded-lg overflow-hidden border border-border bg-black/10">
                        <img src={image.uri} alt={image.label ?? "Weinbild"} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-background/85 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          title="Bild entfernen"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => makePrimaryImage(image.id)}
                          className={cn(
                            "absolute left-1.5 bottom-1.5 rounded-md px-2 py-1 text-[11px] font-semibold",
                            image.isPrimary ? "bg-primary text-primary-foreground" : "bg-background/85 text-foreground"
                          )}
                        >
                          {image.isPrimary ? "Hauptbild" : "Als Hauptbild"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {(form.images?.length ?? 0) < 3 && (
                  <label
                    onDragEnter={(e) => { e.preventDefault(); setIsPhotoDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); setIsPhotoDragging(true); }}
                    onDragLeave={() => setIsPhotoDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsPhotoDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file?.type.startsWith("image/")) handleImageFile(file);
                    }}
                    className={cn(
                      "relative rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 px-4 py-6 text-center transition-colors cursor-pointer overflow-hidden",
                      isPhotoDragging ? "border-primary/60 bg-primary/8" : "border-border hover:border-primary/50"
                    )}
                  >
                    <ImageIcon className={cn("w-7 h-7", isPhotoDragging ? "text-primary/70" : "text-muted-foreground/60")} />
                    <span className="text-sm font-medium text-foreground">
                      {isPhotoDragging ? "Loslassen" : "Bild hochladen"}
                    </span>
                    <span className="text-xs text-muted-foreground">Flasche, Etikett oder Ruecketikett</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageInput}
                    />
                  </label>
                )}
              </div>
            </Section>
          )}

          {/* ── OPTIONAL TOGGLE ────────────────────────────── */}
          {!isShopping && <>
            <button
              type="button"
              onClick={() => setShowOptional((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 apple-card text-sm text-muted-foreground font-medium hover:bg-gray-50 transition-colors"
            >
              <span>Weitere Angaben (Bewertung, Notiz, Geschenk…)</span>
              {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showOptional && (
              <div className="space-y-4 animate-fade-in">
                <Section title="Bewertung & Notizen">
                  <div className="divide-y divide-gray-100">
                    <FormRow label="Kritiker-Rating (0–100)">
                      <Input type="number" min={0} max={100} placeholder="z.B. 95"
                        value={form.rating ?? ""}
                        onChange={(e) => set("rating", e.target.value ? parseInt(e.target.value) : undefined)}
                        className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-20 placeholder:text-muted-foreground/40" />
                    </FormRow>
                    <FormRow label="Wein-Tester / Quelle">
                      <Input placeholder="z.B. Parker, Suckling, Falstaff"
                        value={form.ratingSource}
                        onChange={(e) => set("ratingSource", e.target.value)}
                        className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 w-full max-w-[230px]" />
                    </FormRow>
                    <div className="px-4 py-3">
                      <Label className="text-sm font-normal text-foreground mb-2 block">Degustationsnotiz</Label>
                      <Textarea placeholder="Aromen, Eindruck, Empfehlung…"
                        value={form.notes}
                        onChange={(e) => set("notes", e.target.value)}
                        className="min-h-[80px] bg-gray-50 border-gray-200 text-sm resize-none" />
                    </div>
                    <div className="px-4 py-3">
                      <Label className="text-sm font-normal text-foreground mb-2 block">Link</Label>
                      <Input placeholder="https://…" value={form.purchaseLink}
                        onChange={(e) => set("purchaseLink", e.target.value)}
                        type="url" className="bg-gray-50 border-gray-200 text-sm" />
                    </div>
                  </div>
                </Section>

                <Section title="Geschenk" icon={<Gift className="w-4 h-4 text-pink-500" />}>
                  <div className="divide-y divide-gray-100">
                    <FormRow label="Dieser Wein ist ein Geschenk">
                      <Switch checked={form.isGift}
                        onCheckedChange={(v) => setForm((p) => ({ ...p, isGift: v, giftFrom: v ? p.giftFrom : "" }))} />
                    </FormRow>
                    {form.isGift && (
                      <FormRow label="Geschenk von *" error={errors.giftFrom}>
                        <Input placeholder="z.B. Max Muster"
                          value={form.giftFrom}
                          onChange={(e) => set("giftFrom", e.target.value)}
                          data-error={errors.giftFrom}
                          className={cn(
                            "border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/40",
                            errors.giftFrom && "text-red-500 placeholder:text-red-300"
                          )} />
                      </FormRow>
                    )}
                  </div>
                </Section>

                <Section title="Rarität" icon={<Gem className="w-4 h-4 text-amber-500" />}>
                  <FormRow label="Dieser Wein ist ein Weinschatz / eine Rarität">
                    <Switch checked={form.isRarity}
                      onCheckedChange={(v) => setForm((p) => ({ ...p, isRarity: v }))} />
                  </FormRow>
                </Section>
              </div>
            )}
          </>}

          {/* ── SAVE (mobile + tablet only) ────────────────── */}
          <div className="lg:hidden pt-2 pb-10">
            <SaveBar
              storageMode={storageMode}
              isSubmitting={isSubmitting}
              onCancel={() => navigate(returnTo)}
              formId={formId}
            />
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, icon, badge, badgeColor = "text-muted-foreground", children }: {
  title: string; icon?: React.ReactNode; badge?: string; badgeColor?: string; children: React.ReactNode;
}) {
  return (
    <div className="apple-card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-sm">{title}</h2>
        {badge && <span className={cn("ml-auto text-xs font-medium", badgeColor)}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function FormRow({ label, error = false, children }: {
  label: string; error?: boolean; children: React.ReactNode;
}) {
  return (
    <div
      data-error={error || undefined}
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 min-h-[48px] transition-colors",
        error && "bg-red-50"
      )}
    >
      <span className={cn("text-sm flex-shrink-0 leading-tight", error ? "text-red-600 font-medium" : "text-foreground")}>
        {label}
      </span>
      <div className="flex-1 flex justify-end min-w-0">{children}</div>
    </div>
  );
}

/** Native <select> — works reliably on all mobile browsers */
function NativeSelect({ value, onChange, options, placeholder, disabled }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "text-sm text-right bg-transparent outline-none cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        !value && "text-muted-foreground"
      )}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/** Touch-friendly +/- stepper for quantities */
function Stepper({ value, min = 1, max = 999, onChange }: {
  value: number; min?: number; max?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-foreground hover:bg-gray-200 active:scale-90 transition-all disabled:opacity-30"
        disabled={value <= min}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-foreground hover:bg-gray-200 active:scale-90 transition-all disabled:opacity-30"
        disabled={value >= max}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ModeButton({ active, onClick, icon, label, sub }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all duration-200 text-center",
        active ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className={cn("transition-colors", active ? "text-primary" : "text-muted-foreground")}>{icon}</span>
      <span className={cn("text-sm font-semibold leading-none", active ? "text-primary" : "text-foreground/70")}>{label}</span>
      <span className="text-xs text-muted-foreground leading-none">{sub}</span>
    </button>
  );
}

function SaveBar({ storageMode, isSubmitting, onCancel, formId }: {
  storageMode: StorageMode; isSubmitting: boolean; onCancel: () => void; formId: string;
}) {
  const labels: Record<StorageMode, [string, string]> = {
    cellar:   ["Ins Lager aufnehmen", "Wird aufgenommen…"],
    tasted:   ["Registrieren",        "Wird registriert…"],
    shopping: ["Zur Kaufliste",       "Wird hinzugefügt…"],
  };
  const [label, loadingLabel] = labels[storageMode];
  return (
    <div className="space-y-2">
      <button
        type="submit"
        form={formId}
        disabled={isSubmitting}
        className="w-full py-3.5 lg:py-3 rounded-2xl lg:rounded-xl font-semibold text-white text-base lg:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform bg-primary disabled:cursor-not-allowed disabled:opacity-80"
        style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}
      >
        <Save className="w-4 h-4" />
        {isSubmitting ? loadingLabel : label}
      </button>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={onCancel}
        className="w-full py-2.5 text-sm text-muted-foreground text-center hover:text-foreground transition-colors disabled:opacity-50"
      >
        Abbrechen
      </button>
    </div>
  );
}

export default AddWine;
