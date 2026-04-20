import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { WineLabelScanner } from "@/components/WineLabelScanner";
import { Wine, Save, Gift, Gem, ChevronDown, ChevronUp, Package, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GrapeSelector } from "@/components/GrapeSelector";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { BOTTLE_SIZES } from "@/data/wines";
import type { Wine as WineType, WishlistItem } from "@/data/wines";
import { countries, getRegionsForCountry } from "@/data/countryRegions";
import { cn } from "@/lib/utils";

const currentYear = new Date().getFullYear();
type StorageMode = "cellar" | "tasted";

const AddWine = () => {
  const { addWine, addWishlistItem } = useWineStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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

  const set = (field: string, value: string | number | boolean | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
        name: form.name.trim(),
        producer: form.producer.trim(),
        vintage: form.vintage,
        region: form.region.trim(),
        country: form.country.trim(),
        type: form.type,
        grape: form.grape.trim(),
        quantity: form.quantity,
        purchasePrice: form.purchasePrice,
        purchaseDate: form.purchaseDate,
        purchaseLocation: form.purchaseLocation.trim(),
        drinkFrom: form.drinkFrom,
        drinkUntil: form.drinkUntil,
        rating: form.rating || undefined,
        notes: form.notes.trim() || undefined,
        purchaseLink: form.purchaseLink.trim() || undefined,
        isGift: form.isGift || undefined,
        giftFrom: form.isGift ? form.giftFrom.trim() : undefined,
        isRarity: form.isRarity || undefined,
        bottleSize: form.bottleSize !== "standard" ? form.bottleSize : undefined,
      });
      toast({ title: "Ins Lager aufgenommen ✓", description: `${form.name} ist jetzt im Keller.` });
      navigate("/cellar");
    } else {
      // "Nur Erfassen" → Merkliste
      addWishlistItem({
        name: form.name.trim(),
        producer: form.producer.trim() || undefined,
        vintage: form.vintage,
        type: form.type,
        region: form.region.trim() || undefined,
        country: form.country.trim() || undefined,
        grape: form.grape.trim() || undefined,
        rating: form.rating || undefined,
        notes: form.notes.trim() || undefined,
        tastedDate: form.tastedDate,
        tastedLocation: form.tastedLocation.trim() || undefined,
        price: form.purchasePrice || undefined,
        location: form.tastedLocation.trim() || "",
        occasion: "",
        companions: "",
        source: "add-wine",
      } as Omit<WishlistItem, "id" | "createdAt">);
      toast({ title: "Auf Merkliste ✓", description: `${form.name} wurde registriert.` });
      navigate("/wishlist");
    }
  };

  const isCellar = storageMode === "cellar";

  return (
    <AppLayout>
      <div className="mb-5 animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Keller</p>
        <h1 className="text-2xl font-display font-bold tracking-tight">Wein erfassen</h1>
      </div>

      {/* ── MODE SWITCHER (Apple Segmented Control) ────────────── */}
      <div className="apple-card p-1.5 mb-5 flex animate-fade-in">
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

      {/* ── CAMERA SCANNER (mobile only) ──────────────────────── */}
      {isMobile && (
        <div className="animate-fade-in">
          <WineLabelScanner onResult={handleScanResult} />
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4 animate-fade-in" style={{ animationDelay: "80ms" }}>

        {/* ── BASISDATEN ────────────────────────────────────────── */}
        <div className="apple-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Wine className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Basisdaten</h2>
            <span className="ml-auto text-xs text-red-500 font-medium">Pflichtfelder</span>
          </div>
          <div className="divide-y divide-gray-100">
            <FormRow label="Weinname *">
              <Input
                placeholder="z.B. Barolo Riserva"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
              />
            </FormRow>
            <FormRow label="Produzent *">
              <Input
                placeholder="z.B. Giacomo Conterno"
                value={form.producer}
                onChange={(e) => set("producer", e.target.value)}
                className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
              />
            </FormRow>
            <FormRow label="Jahrgang">
              <Input
                type="number" min={1900} max={currentYear}
                value={form.vintage}
                onChange={(e) => set("vintage", parseInt(e.target.value) || currentYear)}
                className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24"
              />
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
            <div className="px-4 py-3">
              <Label className="text-sm font-normal text-foreground mb-2 block">Rebsorte</Label>
              <GrapeSelector value={form.grape} onChange={(v) => set("grape", v)} />
            </div>
          </div>
        </div>

        {/* ── ANS LAGER: Keller-Felder ─────────────────────────── */}
        {isCellar && (
          <div className="apple-card overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-sm">Kauf & Keller</h2>
            </div>
            <div className="divide-y divide-gray-100">
              <FormRow label="Anzahl Flaschen">
                <Input
                  type="number" min={1}
                  value={form.quantity}
                  onChange={(e) => set("quantity", parseInt(e.target.value) || 1)}
                  className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-20"
                />
              </FormRow>
              <FormRow label="Preis / Flasche (CHF)">
                <Input
                  type="number" min={0} step={0.5}
                  value={form.purchasePrice}
                  onChange={(e) => set("purchasePrice", parseFloat(e.target.value) || 0)}
                  className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24"
                />
              </FormRow>
              <FormRow label="Kaufdatum">
                <Input
                  type="date" value={form.purchaseDate}
                  onChange={(e) => set("purchaseDate", e.target.value)}
                  className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-36"
                />
              </FormRow>
              <FormRow label="Bezugsquelle">
                <Input
                  placeholder="z.B. Weinhandlung Kreis"
                  value={form.purchaseLocation}
                  onChange={(e) => set("purchaseLocation", e.target.value)}
                  className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                />
              </FormRow>
              <FormRow label="Trinkreif ab">
                <Input
                  type="number" min={1900} max={2100}
                  value={form.drinkFrom}
                  onChange={(e) => set("drinkFrom", parseInt(e.target.value) || currentYear)}
                  className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24"
                />
              </FormRow>
              <FormRow label="Trinkreif bis">
                <Input
                  type="number" min={1900} max={2100}
                  value={form.drinkUntil}
                  onChange={(e) => set("drinkUntil", parseInt(e.target.value) || currentYear + 10)}
                  className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24"
                />
              </FormRow>
              <FormRow label="Flaschengrösse">
                <Select value={form.bottleSize} onValueChange={(v) => set("bottleSize", v)}>
                  <SelectTrigger className="border-0 shadow-none bg-transparent focus:ring-0 w-36 pr-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOTTLE_SIZES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormRow>
            </div>
          </div>
        )}

        {/* ── NUR REGISTRIEREN: Erlebnis-Felder ────────────────── */}
        {!isCellar && (
          <div className="apple-card overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Erlebnis</h2>
            </div>
            <div className="divide-y divide-gray-100">
              <FormRow label="Datum">
                <Input
                  type="date" value={form.tastedDate}
                  onChange={(e) => set("tastedDate", e.target.value)}
                  className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-36"
                />
              </FormRow>
              <FormRow label="Ort / Anlass">
                <Input
                  placeholder="z.B. Restaurant Kronenhalle"
                  value={form.tastedLocation}
                  onChange={(e) => set("tastedLocation", e.target.value)}
                  className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                />
              </FormRow>
              <FormRow label="Preis (CHF)">
                <Input
                  type="number" min={0} step={0.5}
                  value={form.purchasePrice}
                  onChange={(e) => set("purchasePrice", parseFloat(e.target.value) || 0)}
                  className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-24"
                />
              </FormRow>
            </div>
          </div>
        )}

        {/* ── OPTIONAL ─────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 apple-card text-sm text-muted-foreground font-medium"
        >
          <span>Weitere Angaben (Bewertung, Notiz, Geschenk…)</span>
          {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showOptional && (
          <div className="space-y-4 animate-fade-in">
            <div className="apple-card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-sm">Bewertung & Notizen</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <FormRow label="Kritiker-Rating (0–100)">
                  <Input
                    type="number" min={0} max={100}
                    placeholder="z.B. 95"
                    value={form.rating ?? ""}
                    onChange={(e) => set("rating", e.target.value ? parseInt(e.target.value) : undefined)}
                    className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 w-20 placeholder:text-muted-foreground/50"
                  />
                </FormRow>
                <div className="px-4 py-3">
                  <Label className="text-sm font-normal text-foreground mb-2 block">Notizen / Degustationsnotiz</Label>
                  <Textarea
                    placeholder="Aromen, Eindruck, Empfehlung…"
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    className="min-h-[90px] bg-gray-50 border-gray-200 text-sm"
                  />
                </div>
                <div className="px-4 py-3">
                  <Label className="text-sm font-normal text-foreground mb-2 block">Link</Label>
                  <Input
                    placeholder="https://…"
                    value={form.purchaseLink}
                    onChange={(e) => set("purchaseLink", e.target.value)}
                    type="url"
                    className="bg-gray-50 border-gray-200 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="apple-card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Gift className="w-4 h-4 text-pink-500" />
                <h2 className="font-semibold text-sm">Geschenk</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <FormRow label="Dieser Wein ist ein Geschenk">
                  <Switch checked={form.isGift} onCheckedChange={(v) => setForm((p) => ({ ...p, isGift: v, giftFrom: v ? p.giftFrom : "" }))} />
                </FormRow>
                {form.isGift && (
                  <FormRow label="Geschenk von *">
                    <Input
                      placeholder="z.B. Max Muster"
                      value={form.giftFrom}
                      onChange={(e) => set("giftFrom", e.target.value)}
                      className="border-0 shadow-none bg-transparent text-right pr-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                    />
                  </FormRow>
                )}
              </div>
            </div>

            <div className="apple-card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Gem className="w-4 h-4 text-amber-500" />
                <h2 className="font-semibold text-sm">Rarität</h2>
              </div>
              <FormRow label="Dieser Wein ist ein Weinschatz / eine Rarität">
                <Switch checked={form.isRarity} onCheckedChange={(v) => setForm((p) => ({ ...p, isRarity: v }))} />
              </FormRow>
            </div>
          </div>
        )}

        {/* ── SAVE ─────────────────────────────────────────────── */}
        <div className="pt-2 pb-8">
          <button
            type="submit"
            className="w-full py-4 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform bg-primary"
            style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
          >
            <Save className="w-5 h-5" />
            {isCellar ? "Ins Lager aufnehmen" : "Registrieren"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/cellar")}
            className="w-full py-3 mt-2 text-sm text-muted-foreground text-center"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </AppLayout>
  );
};

// Apple segmented control button
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
        active
          ? "bg-white shadow-sm text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span className={cn("text-sm font-semibold leading-none", active ? "text-primary" : "text-foreground/70")}>{label}</span>
      <span className="text-xs text-muted-foreground leading-none">{sub}</span>
    </button>
  );
}

// iOS-style form row
function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 min-h-[48px]">
      <span className="text-sm text-foreground flex-shrink-0">{label}</span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  );
}

export default AddWine;
