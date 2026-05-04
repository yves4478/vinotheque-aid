import { useEffect, useId, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { WineLabelScanner, type ScanResult } from "@/components/WineLabelScanner";
import { Save, Gift, Gem, ChevronDown, ChevronUp, Package, BookOpen, Wine, Minus, Plus, ShoppingCart, Image as ImageIcon, X, Camera, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { GrapeSelector } from "@/components/GrapeSelector";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";
import { BOTTLE_SIZES, createWineImage, getWineImages } from "@/data/wines";
import type { Wine as WineType, WishlistItem } from "@/data/wines";
import { countries, getRegionsForCountry } from "@/data/countryRegions";
import {
  getCurrencyPlaceholder,
  normalizeCurrencyInput,
  normalizeCurrencyCode,
  parseLocaleNumber,
} from "@/lib/localeFormat";
import { compressImage } from "@/lib/imageCompression";
import { cn } from "@/lib/utils";
import {
  MAX_WINE_IMAGES,
  WEB_IMAGE_UPLOAD_MAX_BYTES,
  appendTastingContextToNotes,
} from "@vinotheque/core";

const currentYear = new Date().getFullYear();
const DRINK_YEAR_OPTIONS = Array.from({ length: 81 }, (_, index) => {
  const year = currentYear - 20 + index;
  return { value: String(year), label: String(year) };
});
type StorageMode = "cellar" | "tasted" | "shopping";
type FlowStep = 1 | 2 | 3;
type ScanDecision = "pending" | "scanned" | "skipped";

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
  const { addWine, addWishlistItem, addShoppingItem, wishlistItems, settings } = useWineStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const formId = useId();
  const prefilledWishlistIdRef = useRef<string | null>(null);

  const returnTo = searchParams.get("return") ?? "/cellar";
  const sourceWishlistId = searchParams.get("wishlistId");
  const sourceWishlistItem = sourceWishlistId
    ? wishlistItems.find((item) => item.id === sourceWishlistId)
    : undefined;
  const [storageMode, setStorageMode] = useState<StorageMode>(() => resolveMode(searchParams.get("mode")));
  const [currentStep, setCurrentStep] = useState<FlowStep>(1);
  const [scanDecision, setScanDecision] = useState<ScanDecision>("pending");
  const [showOptional, setShowOptional] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);
  // Track which required fields have errors
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const currency = normalizeCurrencyCode(settings.currency);
  const currencyPlaceholder = getCurrencyPlaceholder(currency);

  const [form, setForm] = useState({
    name: "",
    producer: "",
    vintage: currentYear,
    region: "",
    country: "",
    type: "rot" as WineType["type"],
    grape: "",
    quantity: 1,
    purchasePrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchaseLocation: "",
    drinkFrom: currentYear,
    drinkUntil: currentYear + 10,
    rating: undefined as number | undefined,
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

  useEffect(() => {
    if (!sourceWishlistItem) return;
    if (prefilledWishlistIdRef.current === sourceWishlistItem.id) return;

    const nextImages = getWineImages(sourceWishlistItem);
    const tastingNotes = appendTastingContextToNotes(sourceWishlistItem.notes, sourceWishlistItem);
    const ratingNote = typeof sourceWishlistItem.rating === "number"
      ? `Tasting-Bewertung: ${sourceWishlistItem.rating}/5`
      : undefined;
    const mergedNotes = ratingNote && tastingNotes?.includes(ratingNote)
      ? tastingNotes
      : [tastingNotes, ratingNote].filter(Boolean).join("\n\n") || undefined;

    prefilledWishlistIdRef.current = sourceWishlistItem.id;
    setStorageMode("cellar");
    setForm((prev) => ({
      ...prev,
      name: sourceWishlistItem.name || prev.name,
      producer: sourceWishlistItem.producer ?? prev.producer,
      vintage: sourceWishlistItem.vintage ?? prev.vintage,
      region: sourceWishlistItem.region ?? prev.region,
      country: sourceWishlistItem.country ?? prev.country,
      type: sourceWishlistItem.type ?? prev.type,
      grape: sourceWishlistItem.grape ?? prev.grape,
      purchasePrice: sourceWishlistItem.price ?? prev.purchasePrice,
      notes: mergedNotes ?? prev.notes,
      images: nextImages.length > 0 ? nextImages : prev.images,
    }));
  }, [sourceWishlistItem]);

  const handleScanResult = (result: ScanResult) => {
    if (result.imageFile) {
      void handleImageFile(result.imageFile, "Etikett");
    }

    setForm((prev) => ({
      ...prev,
      name: result.name || prev.name,
      producer: result.producer || prev.producer,
      vintage: result.vintage || prev.vintage,
      country: result.country || prev.country,
      region: result.region || prev.region,
      type: result.type || prev.type,
      grape: result.grape || prev.grape,
    }));
    if (result.name) setErrors((e) => ({ ...e, name: false }));
    if (result.producer) setErrors((e) => ({ ...e, producer: false }));
    setScanDecision("scanned");
    setCurrentStep(2);
    toast({ title: "Etikett erkannt", description: "Bild und Felder wurden vorausgefüllt – bitte prüfen." });
  };

  const skipScan = () => {
    setScanDecision("skipped");
    setCurrentStep(2);
  };

  const selectStorageMode = (mode: StorageMode) => {
    setStorageMode(mode);
    setCurrentStep(3);
  };

  const syncImages = (images: WineType["images"]) => {
    const normalized = (images ?? []).slice(0, MAX_WINE_IMAGES).map((image, index) => ({
      ...image,
      isPrimary: images?.some((candidate) => candidate.isPrimary) ? image.isPrimary : index === 0,
    }));
    setForm((prev) => ({ ...prev, images: normalized }));
  };

  const handleImageFile = async (file: File, label: "Flasche" | "Etikett" | "Ruecketikett" | "Liste" | "Stand" | "Notiz" = "Flasche") => {
    if ((form.images?.length ?? 0) >= MAX_WINE_IMAGES) {
      toast({ title: "Maximal 3 Bilder", description: "Pro Wein koennen bis zu drei Bilder gespeichert werden." });
      return;
    }
    if (!file.type.startsWith("image/")) return;
    if (file.size > WEB_IMAGE_UPLOAD_MAX_BYTES) {
      toast({ title: "Bild ist zu gross", description: "Bitte ein kleineres Bild waehlen (max. 2 MB).", variant: "destructive" });
      return;
    }

    try {
      const compressed = await compressImage(file);
      const currentImages = form.images ?? [];
      syncImages([
        ...currentImages,
        createWineImage(compressed, currentImages.length === 0 ? label : "Etikett", currentImages.length === 0),
      ]);
    } catch (error) {
      toast({
        title: "Bild konnte nicht verarbeitet werden",
        description: error instanceof Error ? error.message : "Bitte versuche es mit einem anderen Bild.",
        variant: "destructive",
      });
    }
  };

  const handleImageInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleImageFile(file);
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
    if (!form.country.trim()) newErrors.country = true;
    if (!form.region.trim()) newErrors.region = true;
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
      const parsedPrice = parseLocaleNumber(form.purchasePrice);

      if (storageMode === "shopping") {
        addShoppingItem({
          name: form.name.trim(),
          producer: form.producer.trim(),
          quantity: form.quantity,
          estimatedPrice: parsedPrice,
          reason: form.reason.trim(),
        });
        toast({ title: "Auf Einkaufsliste ✓", description: `${form.name} wurde hinzugefügt.` });
        navigate(returnTo);
        return;
      }

      if (storageMode === "cellar") {
        const images = getWineImages({ images: form.images, imageData: undefined, imageUri: undefined, imageUrl: undefined });
        addWine({
          name: form.name.trim(), producer: form.producer.trim(), vintage: form.vintage,
          region: form.region.trim(), country: form.country.trim(), type: form.type,
          grape: form.grape.trim(), quantity: form.quantity, purchasePrice: parsedPrice,
          purchaseDate: form.purchaseDate, purchaseLocation: form.purchaseLocation.trim(),
          drinkFrom: form.drinkFrom, drinkUntil: form.drinkUntil,
          rating: form.rating || undefined, notes: form.notes.trim() || undefined,
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
        price: parsedPrice || undefined,
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
  const isTasted = storageMode === "tasted";
  const flowSteps = [
    { id: 1 as FlowStep, title: "Wein scannen", subtitle: "Foto oder ohne Scan" },
    { id: 2 as FlowStep, title: "Ziel wählen", subtitle: "Keller zuerst" },
    { id: 3 as FlowStep, title: "Angaben prüfen", subtitle: "Ergänzen und speichern" },
  ];
  const targetSummary = {
    cellar: { label: "Weinkeller", detail: "Flaschen einlagern", icon: <Package className="w-4 h-4" /> },
    tasted: { label: "Merkliste", detail: "Getrunken oder gesehen", icon: <BookOpen className="w-4 h-4" /> },
    shopping: { label: "Einkaufsliste", detail: "Für später einkaufen", icon: <ShoppingCart className="w-4 h-4" /> },
  } satisfies Record<StorageMode, { label: string; detail: string; icon: React.ReactNode }>;

  return (
    <AppLayout>
      <div className="mb-6 animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Keller</p>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Wein erfassen</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Ein geführter Ablauf für sauberes Erfassen: erst optional scannen, dann das Ziel wählen, danach die Angaben prüfen.
        </p>
      </div>

      <div className="animate-fade-in space-y-6" style={{ animationDelay: "60ms" }}>
        <FlowStepper steps={flowSteps} currentStep={currentStep} />

        {currentStep === 1 && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="apple-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground">Schritt 1: Wein scannen</h2>
                  <p className="text-sm text-muted-foreground">
                    Wenn du ein Etikett fotografierst, fuellt die App Bild und moegliche Felder direkt vor.
                  </p>
                </div>
              </div>
              <div className="p-5">
                <WineLabelScanner onResult={handleScanResult} apiKey={settings.anthropicApiKey} />
              </div>
            </div>

            <div className="apple-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">Kein Foto zur Hand?</p>
                <p className="text-sm text-muted-foreground">
                  Du kannst den Scan ueberspringen und den Wein manuell erfassen.
                </p>
              </div>
              <button
                type="button"
                onClick={skipScan}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
              >
                Ohne Scan fortfahren
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="apple-card p-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary uppercase tracking-wide">Schritt 2</p>
                <h2 className="font-display text-xl font-semibold text-foreground mt-1">Wohin soll dieser Wein?</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                  Für euren Hauptfall ist <span className="font-semibold text-foreground">Weinkeller</span> die klare Standardwahl.
                  Merkliste und Einkaufsliste bleiben bewusst sekundär.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Scan ändern
              </button>
            </div>

            <button
              type="button"
              onClick={() => selectStorageMode("cellar")}
              className="w-full apple-card p-5 text-left border border-primary/20 bg-gradient-to-br from-white to-primary/[0.04] hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Priorität 1a
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">In den Keller</h3>
                      <p className="text-sm text-muted-foreground">Flaschen einlagern, Bestand pflegen und später trinken.</p>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary">Empfohlen</span>
              </div>
            </button>

            <div className="grid gap-4 md:grid-cols-2">
              <DestinationCard
                icon={<BookOpen className="w-5 h-5" />}
                title="Auf die Merkliste"
                subtitle="Für getrunkene, gesehene oder gemerkte Weine"
                priority="Priorität 2"
                onClick={() => selectStorageMode("tasted")}
              />
              <DestinationCard
                icon={<ShoppingCart className="w-5 h-5" />}
                title="Auf die Einkaufsliste"
                subtitle="Für spätere Einkäufe und Einkaufsnotizen"
                priority="Priorität 2"
                onClick={() => selectStorageMode("shopping")}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="lg:grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] lg:gap-8 lg:items-start">
            <div className="lg:sticky lg:top-6 space-y-4 mb-6 lg:mb-0">
              <div className="apple-card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-primary uppercase tracking-wide">Schritt 3</p>
                  <h2 className="font-display text-xl font-semibold text-foreground mt-1">Angaben prüfen</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Jetzt nur noch kontrollieren, ergänzen und speichern.
                  </p>
                </div>
                <div className="p-5 space-y-3">
                  <SummaryRow
                    label="Scan"
                    value={scanDecision === "scanned" ? "Etikett übernommen" : "Ohne Scan gestartet"}
                    actionLabel="Ändern"
                    onAction={() => setCurrentStep(1)}
                  />
                  <SummaryRow
                    label="Ziel"
                    value={targetSummary[storageMode].label}
                    actionLabel="Ändern"
                    onAction={() => setCurrentStep(2)}
                  />
                  <div className="rounded-2xl bg-muted/50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      {targetSummary[storageMode].icon}
                      {targetSummary[storageMode].label}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {targetSummary[storageMode].detail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block">
                <SaveBar
                  storageMode={storageMode}
                  isSubmitting={isSubmitting}
                  onCancel={() => navigate(returnTo)}
                  formId={formId}
                />
              </div>
            </div>

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
                    <FormRow label="Land *" error={errors.country}>
                      <NativeSelect
                        value={form.country}
                        onChange={(v) => { set("country", v); set("region", ""); }}
                        placeholder="Wählen…"
                        options={countries.map((c) => ({ value: c, label: c }))}
                      />
                    </FormRow>
                    <FormRow label="Region *" error={errors.region}>
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
                    <GrapeSelector value={form.grape} onChange={(v) => set("grape", v)} country={form.country} />
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
                      <FormRow label={`Preis / Flasche (${currency})`}>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={form.purchasePrice}
                          onChange={(e) => set("purchasePrice", e.target.value)}
                          onBlur={() => set("purchasePrice", normalizeCurrencyInput(form.purchasePrice, currency))}
                          placeholder={currencyPlaceholder}
                          className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-full max-w-[132px]" />
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
                        <NativeSelect
                          value={String(form.drinkFrom)}
                          onChange={(v) => set("drinkFrom", Number(v))}
                          options={DRINK_YEAR_OPTIONS}
                        />
                      </FormRow>
                      <FormRow label="Trinkreif bis">
                        <NativeSelect
                          value={String(form.drinkUntil)}
                          onChange={(v) => set("drinkUntil", Number(v))}
                          options={DRINK_YEAR_OPTIONS}
                        />
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
              {isTasted && (
                <Section title="Erlebnis" icon={<BookOpen className="w-4 h-4 text-primary" />}>
                  <div className="divide-y divide-gray-100">
                    <div className="md:grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                      <FormRow label="Datum">
                        <Input type="date" value={form.tastedDate}
                          onChange={(e) => set("tastedDate", e.target.value)}
                          className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-36" />
                      </FormRow>
                      <FormRow label={`Preis (${currency})`}>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={form.purchasePrice}
                          onChange={(e) => set("purchasePrice", e.target.value)}
                          onBlur={() => set("purchasePrice", normalizeCurrencyInput(form.purchasePrice, currency))}
                          placeholder={currencyPlaceholder}
                          className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-full max-w-[132px]" />
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
                      <FormRow label={`Geschätzter Preis (${currency})`}>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={form.purchasePrice}
                          onChange={(e) => set("purchasePrice", e.target.value)}
                          onBlur={() => set("purchasePrice", normalizeCurrencyInput(form.purchasePrice, currency))}
                          placeholder={currencyPlaceholder}
                          className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-full max-w-[132px]" />
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
                          if (file?.type.startsWith("image/")) void handleImageFile(file);
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
        )}
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

function FlowStepper({ steps, currentStep }: {
  steps: { id: FlowStep; title: string; subtitle: string }[];
  currentStep: FlowStep;
}) {
  return (
    <div className="apple-card p-4">
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => {
          const complete = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-semibold transition-colors",
                complete || active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}>
                {complete ? <CheckCircle2 className="w-4 h-4" /> : step.id}
              </div>
              <div className="min-w-0">
                <p className={cn("text-sm font-semibold", active ? "text-foreground" : "text-foreground/70")}>{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.subtitle}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block flex-1 h-px bg-border ml-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DestinationCard({ icon, title, subtitle, priority, onClick }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  priority: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="apple-card p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all"
    >
      <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
        {priority}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-muted text-foreground flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function SummaryRow({ label, value, actionLabel, onAction }: {
  label: string;
  value: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-1">{value}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        {actionLabel}
      </button>
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
