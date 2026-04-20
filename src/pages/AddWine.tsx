import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { WineLabelScanner } from "@/components/WineLabelScanner";
import { Save, Gift, Gem, ChevronDown, ChevronUp, Package, BookOpen, Wine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GrapeSelector } from "@/components/GrapeSelector";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";
import { BOTTLE_SIZES } from "@/data/wines";
import type { Wine as WineType, WishlistItem } from "@/data/wines";
import { countries, getRegionsForCountry } from "@/data/countryRegions";
import { cn } from "@/lib/utils";

const currentYear = new Date().getFullYear();
type StorageMode = "cellar" | "tasted";

// ─── Breakpoints used ──────────────────────────────────────────────────────
// sm  (640px)  → iPhone landscape / small tablet
// md  (768px)  → iPad 10" portrait
// lg  (1024px) → iPad 13" portrait / PC small
// xl  (1280px) → PC 13–16"

const AddWine = () => {
  const { addWine, addWishlistItem } = useWineStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [storageMode, setStorageMode] = useState<StorageMode>("cellar");
  const [showOptional, setShowOptional] = useState(false);
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
    notes: "",
    isGift: false,
    giftFrom: "",
    isRarity: false,
    bottleSize: "standard",
    purchaseLink: "",
    tastedDate: new Date().toISOString().split("T")[0],
    tastedLocation: "",
  });

  const set = (field: string, value: string | number | boolean | undefined) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleScanResult = (result: { name?: string; producer?: string; vintage?: number }) => {
    setForm((prev) => ({
      ...prev,
      name: result.name || prev.name,
      producer: result.producer || prev.producer,
      vintage: result.vintage || prev.vintage,
    }));
    toast({ title: "Etikett erkannt", description: "Felder wurden vorausgefüllt – bitte prüfen." });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Pflichtfeld fehlt", description: "Bitte Weinname eingeben.", variant: "destructive" });
      return;
    }
    if (!form.producer.trim()) {
      toast({ title: "Pflichtfeld fehlt", description: "Bitte Produzent eingeben.", variant: "destructive" });
      return;
    }
    if (form.isGift && !form.giftFrom.trim()) {
      toast({ title: "Pflichtfeld fehlt", description: "Bitte angeben, von wem das Geschenk ist.", variant: "destructive" });
      return;
    }

    if (storageMode === "cellar") {
      addWine({
        name: form.name.trim(), producer: form.producer.trim(), vintage: form.vintage,
        region: form.region.trim(), country: form.country.trim(), type: form.type,
        grape: form.grape.trim(), quantity: form.quantity, purchasePrice: form.purchasePrice,
        purchaseDate: form.purchaseDate, purchaseLocation: form.purchaseLocation.trim(),
        drinkFrom: form.drinkFrom, drinkUntil: form.drinkUntil,
        rating: form.rating || undefined, notes: form.notes.trim() || undefined,
        purchaseLink: form.purchaseLink.trim() || undefined,
        isGift: form.isGift || undefined,
        giftFrom: form.isGift ? form.giftFrom.trim() : undefined,
        isRarity: form.isRarity || undefined,
        bottleSize: form.bottleSize !== "standard" ? form.bottleSize : undefined,
      });
      toast({ title: "Ins Lager aufgenommen ✓", description: `${form.name} ist jetzt im Keller.` });
      navigate("/cellar");
    } else {
      addWishlistItem({
        name: form.name.trim(), producer: form.producer.trim() || undefined,
        vintage: form.vintage, type: form.type,
        region: form.region.trim() || undefined, country: form.country.trim() || undefined,
        grape: form.grape.trim() || undefined, rating: form.rating || undefined,
        notes: form.notes.trim() || undefined, tastedDate: form.tastedDate,
        tastedLocation: form.tastedLocation.trim() || undefined,
        price: form.purchasePrice || undefined,
        location: form.tastedLocation.trim() || "", occasion: "", companions: "",
        source: "add-wine",
      } as Omit<WishlistItem, "id" | "createdAt">);
      toast({ title: "Auf Merkliste ✓", description: `${form.name} wurde registriert.` });
      navigate("/wishlist");
    }
  };

  const isCellar = storageMode === "cellar";

  return (
    <AppLayout>
      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="mb-6 animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Keller</p>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Wein erfassen</h1>
      </div>

      {/* ── TWO-PANEL LAYOUT: left (scanner) + right (form) on lg+ ── */}
      <div className="lg:grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] lg:gap-8 lg:items-start animate-fade-in" style={{ animationDelay: "60ms" }}>

        {/* ═══════════════════════════════════════════════════════
            LEFT PANEL — Mode switcher + Scanner
            Sticky on desktop, inline on mobile
        ═══════════════════════════════════════════════════════ */}
        <div className="lg:sticky lg:top-6 space-y-4 mb-6 lg:mb-0">

          {/* Mode switcher */}
          <div className="apple-card p-1.5 flex">
            <ModeButton
              active={isCellar}
              onClick={() => setStorageMode("cellar")}
              icon={<Package className="w-4 h-4" />}
              label="Ans Lager"
              sub="Flaschen im Keller"
            />
            <ModeButton
              active={!isCellar}
              onClick={() => setStorageMode("tasted")}
              icon={<BookOpen className="w-4 h-4" />}
              label="Nur Registrieren"
              sub="Getrunken, gesehen…"
            />
          </div>

          {/* Scanner — visible on ALL devices */}
          <WineLabelScanner onResult={handleScanResult} compact />

          {/* Desktop-only: save button in left panel */}
          <div className="hidden lg:block">
            <SaveBar isCellar={isCellar} onCancel={() => navigate("/cellar")} formRef={formRef} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            RIGHT PANEL — Form
        ═══════════════════════════════════════════════════════ */}
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* ── BASISDATEN (required) ─────────────────────────── */}
          <Section title="Basisdaten" icon={<Wine className="w-4 h-4 text-primary" />} badge="Pflichtfelder" badgeColor="text-red-500">
            {/* On md+: 2-column grid for name + producer */}
            <div className="md:grid md:grid-cols-2 md:divide-x md:divide-y-0 divide-y divide-gray-100">
              <FormRow label="Weinname *">
                <Input placeholder="z.B. Barolo Riserva" value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 w-full" />
              </FormRow>
              <FormRow label="Produzent *">
                <Input placeholder="z.B. Conterno" value={form.producer}
                  onChange={(e) => set("producer", e.target.value)}
                  className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 w-full" />
              </FormRow>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="md:grid md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-gray-100">
                <FormRow label="Jahrgang">
                  <Input type="number" min={1900} max={currentYear} value={form.vintage}
                    onChange={(e) => set("vintage", parseInt(e.target.value) || currentYear)}
                    className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24" />
                </FormRow>
                <FormRow label="Typ">
                  <Select value={form.type} onValueChange={(v) => set("type", v)}>
                    <SelectTrigger className="border-0 shadow-none bg-transparent focus:ring-0 w-36 pr-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rot">Rotwein</SelectItem>
                      <SelectItem value="weiss">Weisswein</SelectItem>
                      <SelectItem value="rosé">Rosé</SelectItem>
                      <SelectItem value="schaumwein">Schaumwein</SelectItem>
                      <SelectItem value="dessert">Dessertwein</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
              </div>

              <div className="md:grid md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-gray-100">
                <FormRow label="Land">
                  <Select value={form.country} onValueChange={(v) => { set("country", v); set("region", ""); }}>
                    <SelectTrigger className="border-0 shadow-none bg-transparent focus:ring-0 w-40 pr-0">
                      <SelectValue placeholder="Wählen…" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormRow>
                <FormRow label="Region">
                  <Select value={form.region} onValueChange={(v) => set("region", v)} disabled={!form.country}>
                    <SelectTrigger className="border-0 shadow-none bg-transparent focus:ring-0 w-40 pr-0 disabled:opacity-40">
                      <SelectValue placeholder={form.country ? "Wählen…" : "–"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getRegionsForCountry(form.country).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormRow>
              </div>

              <div className="px-4 py-3">
                <Label className="text-sm font-normal text-foreground mb-2 block">Rebsorte</Label>
                <GrapeSelector value={form.grape} onChange={(v) => set("grape", v)} />
              </div>
            </div>
          </Section>

          {/* ── ANS LAGER: Keller-Felder ──────────────────────── */}
          {isCellar && (
            <Section title="Kauf & Keller">
              <div className="md:grid md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-gray-100">
                <FormRow label="Anzahl Flaschen">
                  <Input type="number" min={1} value={form.quantity}
                    onChange={(e) => set("quantity", parseInt(e.target.value) || 1)}
                    className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-20" />
                </FormRow>
                <FormRow label="Preis / Flasche (CHF)">
                  <Input type="number" min={0} step={0.5} value={form.purchasePrice}
                    onChange={(e) => set("purchasePrice", parseFloat(e.target.value) || 0)}
                    className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24" />
                </FormRow>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="md:grid md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-gray-100">
                  <FormRow label="Kaufdatum">
                    <Input type="date" value={form.purchaseDate}
                      onChange={(e) => set("purchaseDate", e.target.value)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-36" />
                  </FormRow>
                  <FormRow label="Bezugsquelle">
                    <Input placeholder="z.B. Weinhandlung Kreis" value={form.purchaseLocation}
                      onChange={(e) => set("purchaseLocation", e.target.value)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 w-full max-w-[180px]" />
                  </FormRow>
                </div>
                <div className="md:grid md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-gray-100">
                  <FormRow label="Trinkreif ab">
                    <Input type="number" min={1900} max={2100} value={form.drinkFrom}
                      onChange={(e) => set("drinkFrom", parseInt(e.target.value) || currentYear)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24" />
                  </FormRow>
                  <FormRow label="Trinkreif bis">
                    <Input type="number" min={1900} max={2100} value={form.drinkUntil}
                      onChange={(e) => set("drinkUntil", parseInt(e.target.value) || currentYear + 10)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24" />
                  </FormRow>
                </div>
                <FormRow label="Flaschengrösse">
                  <Select value={form.bottleSize} onValueChange={(v) => set("bottleSize", v)}>
                    <SelectTrigger className="border-0 shadow-none bg-transparent focus:ring-0 w-44 pr-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOTTLE_SIZES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormRow>
              </div>
            </Section>
          )}

          {/* ── NUR REGISTRIEREN: Erlebnis ────────────────────── */}
          {!isCellar && (
            <Section title="Erlebnis" icon={<BookOpen className="w-4 h-4 text-primary" />}>
              <div className="divide-y divide-gray-100">
                <div className="md:grid md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-gray-100">
                  <FormRow label="Datum">
                    <Input type="date" value={form.tastedDate}
                      onChange={(e) => set("tastedDate", e.target.value)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-36" />
                  </FormRow>
                  <FormRow label="Preis (CHF)">
                    <Input type="number" min={0} step={0.5} value={form.purchasePrice}
                      onChange={(e) => set("purchasePrice", parseFloat(e.target.value) || 0)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24" />
                  </FormRow>
                </div>
                <FormRow label="Ort / Anlass">
                  <Input placeholder="z.B. Restaurant Kronenhalle" value={form.tastedLocation}
                    onChange={(e) => set("tastedLocation", e.target.value)}
                    className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/40" />
                </FormRow>
              </div>
            </Section>
          )}

          {/* ── OPTIONAL TOGGLE ──────────────────────────────── */}
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
                    <Input type="number" min={0} max={100} placeholder="z.B. 95" value={form.rating ?? ""}
                      onChange={(e) => set("rating", e.target.value ? parseInt(e.target.value) : undefined)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-20 placeholder:text-muted-foreground/40" />
                  </FormRow>
                  <div className="px-4 py-3">
                    <Label className="text-sm font-normal text-foreground mb-2 block">Degustationsnotiz</Label>
                    <Textarea placeholder="Aromen, Eindruck, Empfehlung…" value={form.notes}
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
                    <FormRow label="Geschenk von *">
                      <Input placeholder="z.B. Max Muster" value={form.giftFrom}
                        onChange={(e) => set("giftFrom", e.target.value)}
                        className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/40" />
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

          {/* ── SAVE BUTTON (mobile + tablet) ────────────────── */}
          <div className="lg:hidden pt-2 pb-8">
            <SaveBar isCellar={isCellar} onCancel={() => navigate("/cellar")} formRef={formRef} />
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function Section({
  title, icon, badge, badgeColor = "text-muted-foreground", children,
}: {
  title: string; icon?: React.ReactNode;
  badge?: string; badgeColor?: string; children: React.ReactNode;
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

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 min-h-[48px]">
      <span className="text-sm text-foreground flex-shrink-0 leading-tight">{label}</span>
      <div className="flex-1 flex justify-end min-w-0">{children}</div>
    </div>
  );
}

function ModeButton({ active, onClick, icon, label, sub }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string; sub: string;
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
      <span className={cn("text-sm font-semibold leading-none", active ? "text-primary" : "text-foreground/70")}>
        {label}
      </span>
      <span className="text-xs text-muted-foreground leading-none">{sub}</span>
    </button>
  );
}

function SaveBar({ isCellar, onCancel, formRef }: {
  isCellar: boolean; onCancel: () => void; formRef: React.RefObject<HTMLFormElement | null>;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => formRef.current?.requestSubmit()}
        className="w-full py-3.5 lg:py-3 rounded-2xl lg:rounded-xl font-semibold text-white text-base lg:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform bg-primary"
        style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}
      >
        <Save className="w-4 h-4" />
        {isCellar ? "Ins Lager aufnehmen" : "Registrieren"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="w-full py-2.5 text-sm text-muted-foreground text-center hover:text-foreground transition-colors"
      >
        Abbrechen
      </button>
    </div>
  );
}

export default AddWine;
