import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Wine, Save, Gift, Link, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";
import { fetchWineDataFromUrl } from "@/lib/wineUrlParser";
import type { Wine as WineType } from "@/data/wines";

const currentYear = new Date().getFullYear();

const AddWine = () => {
  const { addWine } = useWineStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [purchaseLink, setPurchaseLink] = useState("");
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

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
  });

  const set = (field: string, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFetchUrl = async () => {
    const trimmed = purchaseLink.trim();
    if (!trimmed) {
      toast({ title: "Fehler", description: "Bitte einen Link eingeben.", variant: "destructive" });
      return;
    }
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      toast({ title: "Fehler", description: "Bitte einen gültigen Link eingeben.", variant: "destructive" });
      return;
    }

    setIsLoadingUrl(true);
    try {
      const data = await fetchWineDataFromUrl(url.href);
      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        producer: data.producer || prev.producer,
        vintage: data.vintage || prev.vintage,
        region: data.region || prev.region,
        country: data.country || prev.country,
        type: data.type || prev.type,
        grape: data.grape || prev.grape,
        purchasePrice: data.purchasePrice || prev.purchasePrice,
        notes: data.notes || prev.notes,
      }));
      const filled = Object.values(data).filter(v => v !== undefined && v !== "").length;
      toast({
        title: "Daten übernommen",
        description: filled > 0
          ? `${filled} Feld${filled > 1 ? "er" : ""} wurde${filled > 1 ? "n" : ""} automatisch ausgefüllt.`
          : "Es konnten leider keine Weindaten erkannt werden.",
      });
    } catch {
      toast({ title: "Fehler", description: "Die Webseite konnte nicht geladen werden. Bitte prüfe den Link.", variant: "destructive" });
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.producer.trim()) {
      toast({ title: "Fehler", description: "Name und Produzent sind Pflichtfelder.", variant: "destructive" });
      return;
    }
    if (form.isGift && !form.giftFrom.trim()) {
      toast({ title: "Fehler", description: "Bei einem Geschenk muss der Schenkende angegeben werden.", variant: "destructive" });
      return;
    }
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
      purchaseLink: purchaseLink.trim() || undefined,
      isGift: form.isGift || undefined,
      giftFrom: form.isGift ? form.giftFrom.trim() : undefined,
    });
    toast({ title: "Wein hinzugefügt", description: `${form.name} wurde erfolgreich erfasst.` });
    navigate("/cellar");
  };

  return (
    <AppLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">Wein hinzufügen</h1>
        <p className="text-muted-foreground font-body mt-1">
          Erfasse einen neuen Wein für deinen Keller
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {/* Purchase Link autofill */}
        <div className="glass-card p-6 border border-primary/20">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Link className="w-5 h-5 text-primary" />
            Link zum Weinkauf
          </h2>
          <p className="text-muted-foreground text-sm mb-3 font-body">
            Füge einen Link zur Kaufseite ein und die Weindaten werden automatisch übernommen.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.weinshop.ch/wein/..."
              value={purchaseLink}
              onChange={(e) => setPurchaseLink(e.target.value)}
              className="bg-card border-border font-body flex-1"
              type="url"
            />
            <Button type="button" variant="wine" onClick={handleFetchUrl} disabled={isLoadingUrl}>
              {isLoadingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : "Daten abrufen"}
            </Button>
          </div>
        </div>

        {/* Basic info */}
        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Wine className="w-5 h-5 text-primary" />
            Weindetails
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-body text-sm">Name *</Label>
              <Input id="name" placeholder="z.B. Barolo Riserva" value={form.name} onChange={(e) => set("name", e.target.value)} className="bg-card border-border font-body" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="producer" className="font-body text-sm">Produzent *</Label>
              <Input id="producer" placeholder="z.B. Giacomo Conterno" value={form.producer} onChange={(e) => set("producer", e.target.value)} className="bg-card border-border font-body" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="font-body text-sm">Typ</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger className="bg-card border-border font-body">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="grape" className="font-body text-sm">Rebsorte</Label>
              <Input id="grape" placeholder="z.B. Nebbiolo" value={form.grape} onChange={(e) => set("grape", e.target.value)} className="bg-card border-border font-body" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vintage" className="font-body text-sm">Jahrgang</Label>
              <Input id="vintage" type="number" min={1900} max={currentYear} value={form.vintage} onChange={(e) => set("vintage", parseInt(e.target.value) || currentYear)} className="bg-card border-border font-body" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="font-body text-sm">Anzahl Flaschen</Label>
              <Input id="quantity" type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", parseInt(e.target.value) || 1)} className="bg-card border-border font-body" />
            </div>
          </div>
        </div>

        {/* Origin */}
        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Herkunft</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region" className="font-body text-sm">Region</Label>
              <Input id="region" placeholder="z.B. Piemont" value={form.region} onChange={(e) => set("region", e.target.value)} className="bg-card border-border font-body" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="font-body text-sm">Land</Label>
              <Input id="country" placeholder="z.B. Italien" value={form.country} onChange={(e) => set("country", e.target.value)} className="bg-card border-border font-body" />
            </div>
          </div>
        </div>

        {/* Purchase & drinking */}
        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Einkauf & Trinkreife</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice" className="font-body text-sm">Preis pro Flasche (CHF)</Label>
              <Input id="purchasePrice" type="number" min={0} step={0.5} value={form.purchasePrice} onChange={(e) => set("purchasePrice", parseFloat(e.target.value) || 0)} className="bg-card border-border font-body" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate" className="font-body text-sm">Kaufdatum</Label>
              <Input id="purchaseDate" type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} className="bg-card border-border font-body" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseLocation" className="font-body text-sm">Bezugsquelle</Label>
              <Input id="purchaseLocation" placeholder="z.B. Weinhandlung Kreis" value={form.purchaseLocation} onChange={(e) => set("purchaseLocation", e.target.value)} className="bg-card border-border font-body" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating" className="font-body text-sm">Kritiker-Rating (0-100)</Label>
              <Input id="rating" type="number" min={0} max={100} placeholder="z.B. 95" value={form.rating ?? ""} onChange={(e) => set("rating", e.target.value ? parseInt(e.target.value) : undefined)} className="bg-card border-border font-body" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drinkFrom" className="font-body text-sm">Trinkreif ab</Label>
              <Input id="drinkFrom" type="number" min={1900} max={2100} value={form.drinkFrom} onChange={(e) => set("drinkFrom", parseInt(e.target.value) || currentYear)} className="bg-card border-border font-body" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drinkUntil" className="font-body text-sm">Trinkreif bis</Label>
              <Input id="drinkUntil" type="number" min={1900} max={2100} value={form.drinkUntil} onChange={(e) => set("drinkUntil", parseInt(e.target.value) || currentYear + 10)} className="bg-card border-border font-body" />
            </div>
          </div>
        </div>

        {/* Gift */}
        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-wine-gold" />
            Geschenk
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="isGift" className="font-body text-sm">Dieser Wein ist ein Geschenk</Label>
              <Switch id="isGift" checked={form.isGift} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isGift: checked, giftFrom: checked ? prev.giftFrom : "" }))} />
            </div>
            {form.isGift && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="giftFrom" className="font-body text-sm">Geschenk von *</Label>
                <Input id="giftFrom" placeholder="z.B. Max Mustermann" value={form.giftFrom} onChange={(e) => set("giftFrom", e.target.value)} className="bg-card border-border font-body" />
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Notizen</h2>
          <Textarea placeholder="Degunotizen, Aromen, Eindruck..." value={form.notes} onChange={(e) => set("notes", e.target.value)} className="bg-card border-border font-body min-h-[100px]" />
        </div>

        <div className="flex gap-3">
          <Button type="submit" variant="wine" size="lg">
            <Save className="w-4 h-4" />
            Wein speichern
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate("/cellar")}>
            Abbrechen
          </Button>
        </div>
      </form>
    </AppLayout>
  );
};

export default AddWine;
