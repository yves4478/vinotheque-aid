import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { WineCard } from "@/components/WineCard";
import { type Wine, createWineImage, getWineImages, getPrimaryWineImage, getWineTypeLabel, getWineTypeColor, getDrinkStatus, BOTTLE_SIZES, getBottleSizeLabel } from "@/data/wines";
import { Search, Wine as WineIcon, LayoutGrid, List, Star, Trash2, Pencil, Download, Gift, GlassWater, Gem, Image, X, Plus, Sparkles, ExternalLink } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { GrapeSelector } from "@/components/GrapeSelector";
import { countries, getRegionsForCountry } from "@/data/countryRegions";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";
import { buildWineInsight } from "@/lib/wineInsights";

const typeFilters = [
  { value: "all", label: "Alle" },
  { value: "rot", label: "Rot" },
  { value: "weiss", label: "Weiss" },
  { value: "rosé", label: "Rosé" },
  { value: "schaumwein", label: "Schaum" },
] as const;

type ViewMode = "grid" | "list";

const Cellar = () => {
  const { wines, deleteWine, updateWine, consumeWine, settings } = useWineStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("list");
  const [editWine, setEditWine] = useState<Wine | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Wine | null>(null);
  const [consumeConfirm, setConsumeConfirm] = useState<Wine | null>(null);
  const [insightWine, setInsightWine] = useState<Wine | null>(null);
  const [isCellarDragging, setIsCellarDragging] = useState(false);

  const handleCellarImageFile = (file: File) => {
    if (!editWine) return;
    if (getWineImages(editWine).length >= 3) {
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
        const maxSize = 600;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        else if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        setEditWine((prev) => {
          if (!prev) return prev;
          const currentImages = getWineImages(prev);
          const nextImages = [
            ...currentImages,
            createWineImage(compressed, currentImages.length === 0 ? "Flasche" : "Etikett", currentImages.length === 0),
          ].slice(0, 3);
          const primary = nextImages.find((image) => image.isPrimary) ?? nextImages[0];
          return { ...prev, images: nextImages, imageData: primary?.uri };
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const setEditPrimaryImage = (imageId: string) => {
    setEditWine((prev) => {
      if (!prev) return prev;
      const nextImages = getWineImages(prev).map((image) => ({ ...image, isPrimary: image.id === imageId }));
      const primary = nextImages.find((image) => image.isPrimary) ?? nextImages[0];
      return { ...prev, images: nextImages, imageData: primary?.uri };
    });
  };

  const removeEditImage = (imageId: string) => {
    setEditWine((prev) => {
      if (!prev) return prev;
      const nextImages = getWineImages(prev)
        .filter((image) => image.id !== imageId)
        .map((image, index) => ({ ...image, isPrimary: index === 0 }));
      const primary = nextImages[0];
      return { ...prev, images: nextImages, imageData: primary?.uri };
    });
  };

  const filtered = wines.filter((w) => {
    const matchSearch = !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.producer.toLowerCase().includes(search.toLowerCase()) ||
      w.region.toLowerCase().includes(search.toLowerCase()) ||
      w.grape.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || w.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalBottles = filtered.reduce((sum, w) => sum + w.quantity, 0);
  const insight = insightWine ? buildWineInsight(insightWine) : null;

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteWine(deleteConfirm.id);
    toast({ title: "Wein gelöscht", description: `${deleteConfirm.name} wurde entfernt.` });
    setDeleteConfirm(null);
  };

  const handleConsume = () => {
    if (!consumeConfirm) return;
    consumeWine(consumeConfirm);
    toast({ title: "Prost!", description: `${consumeConfirm.name} – 1 Flasche getrunken.` });
    setConsumeConfirm(null);
  };

  const handleEditSave = () => {
    if (!editWine) return;
    if (editWine.isGift && !editWine.giftFrom?.trim()) {
      toast({ title: "Fehler", description: "Bei einem Geschenk muss der Schenkende angegeben werden.", variant: "destructive" });
      return;
    }
    const images = getWineImages(editWine);
    const primary = getPrimaryWineImage({ ...editWine, images });
    updateWine(editWine.id, { ...editWine, images, imageData: primary?.uri });
    toast({ title: "Wein aktualisiert", description: `${editWine.name} wurde gespeichert.` });
    setEditWine(null);
  };

  const exportCsv = () => {
    const headers = ["Name", "Produzent", "Typ", "Jahrgang", "Region", "Land", "Rebsorte", "Flaschen", "Flaschengrösse", "Preis", "Wert", "Trinkreif ab", "Trinkreif bis", "Rating", "Geschenk", "Geschenk von", "Rarität", "Notizen"];
    const rows = wines.map((w) => [
      w.name, w.producer, getWineTypeLabel(w.type), w.vintage, w.region, w.country, w.grape,
      w.quantity, getBottleSizeLabel(w.bottleSize), w.purchasePrice, w.quantity * w.purchasePrice, w.drinkFrom, w.drinkUntil,
      w.rating ?? "", w.isGift ? "Ja" : "Nein", w.giftFrom ?? "", w.isRarity ? "Ja" : "Nein", w.notes ?? ""
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = settings.cellarName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    a.download = `${slug}-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export erfolgreich", description: `${wines.length} Weine als CSV exportiert.` });
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-5 animate-fade-in">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Keller</p>
          <h1 className="text-2xl font-display font-bold tracking-tight">Weinkeller</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {totalBottles} Flaschen · {filtered.length} Weine
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="wine" size="sm" onClick={() => navigate("/add?mode=cellar&return=/cellar")} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Wein erfassen
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search, Filter & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Wein suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border font-body"
          />
        </div>
        <div className="flex gap-1.5 items-center">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-body font-medium transition-all duration-200",
                typeFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
          <div className="w-px h-6 bg-border mx-1" />
          <button
            onClick={() => setView("grid")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            title="Kachelansicht"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            title="Listenansicht"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length > 0 ? (
        view === "grid" ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((wine, i) => (
              <WineCard
                key={wine.id}
                wine={wine}
                index={i}
                onInsights={() => setInsightWine(wine)}
                onConsume={() => setConsumeConfirm(wine)}
                onEdit={() => setEditWine({ ...wine })}
                onDelete={() => setDeleteConfirm(wine)}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-body text-muted-foreground">Wein</TableHead>
                    <TableHead className="font-body text-muted-foreground">Produzent</TableHead>
                    <TableHead className="font-body text-muted-foreground">Typ</TableHead>
                    <TableHead className="font-body text-muted-foreground">Jahrgang</TableHead>
                    <TableHead className="font-body text-muted-foreground">Region</TableHead>
                    <TableHead className="font-body text-muted-foreground text-right">Flaschen</TableHead>
                    <TableHead className="font-body text-muted-foreground text-right">Preis/Fl.</TableHead>
                    <TableHead className="font-body text-muted-foreground text-right">Wert</TableHead>
                    <TableHead className="font-body text-muted-foreground">Status</TableHead>
                    <TableHead className="font-body text-muted-foreground text-center">Rating</TableHead>
                    <TableHead className="font-body text-muted-foreground text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((wine) => {
                    const status = getDrinkStatus(wine);
                    return (
                      <TableRow key={wine.id} className="border-border hover:bg-primary/5">
                        <TableCell className="font-body font-medium text-foreground">{wine.name}</TableCell>
                        <TableCell className="font-body text-muted-foreground">{wine.producer}</TableCell>
                        <TableCell>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border font-body", getWineTypeColor(wine.type))}>
                            {getWineTypeLabel(wine.type)}
                          </span>
                        </TableCell>
                        <TableCell className="font-body text-muted-foreground">{wine.vintage}</TableCell>
                        <TableCell className="font-body text-muted-foreground text-sm">{wine.region}</TableCell>
                        <TableCell className="font-body text-foreground text-right font-semibold">{wine.quantity}</TableCell>
                        <TableCell className="font-body text-foreground text-right">{formatCurrency(wine.purchasePrice)}</TableCell>
                        <TableCell className="font-body text-muted-foreground text-right">{formatCurrency(wine.quantity * wine.purchasePrice)}</TableCell>
                        <TableCell>
                          <span className={cn("text-xs font-body font-medium", status.color)}>{status.label}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {wine.rating ? (
                            <span className="flex items-center justify-center gap-1 text-xs text-wine-gold font-body">
                              <Star className="w-3 h-3 fill-wine-gold" />
                              {wine.rating}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">–</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setInsightWine(wine)} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Zusatzinfos">
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setConsumeConfirm(wine)} className="p-1.5 rounded hover:bg-wine-burgundy/20 text-muted-foreground hover:text-wine-rose transition-colors" title="Flasche trinken">
                              <GlassWater className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditWine({ ...wine })} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Bearbeiten">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteConfirm(wine)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Löschen">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      ) : (
        <div className="glass-card p-12 text-center animate-fade-in">
          <WineIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-body">Keine Weine gefunden</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Wein löschen?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body">
            Möchtest du <strong>{deleteConfirm?.name}</strong> ({deleteConfirm?.producer}) wirklich aus deinem Keller entfernen?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleDelete}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consume Confirmation Dialog */}
      <Dialog open={!!consumeConfirm} onOpenChange={() => setConsumeConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Flasche trinken?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body">
            Möchtest du eine Flasche <strong>{consumeConfirm?.name}</strong> ({consumeConfirm?.producer}) als getrunken markieren?
            {consumeConfirm && consumeConfirm.quantity <= 1 && (
              <span className="block mt-2 text-wine-rose font-medium">Das ist die letzte Flasche – der Wein wird aus dem Keller entfernt.</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsumeConfirm(null)}>Abbrechen</Button>
            <Button variant="wine" onClick={handleConsume}>Prost!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI/Web Insight Dialog */}
      <Dialog open={!!insightWine} onOpenChange={() => setInsightWine(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Zusatzinfos zum Wein
            </DialogTitle>
          </DialogHeader>
          {insight && (
            <div className="space-y-4">
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">KI-Briefing</p>
                <h3 className="font-display font-semibold text-lg">{insight.headline}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{insight.summary}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Fakten</p>
                  <ul className="space-y-1.5 text-sm">
                    {insight.facts.map((fact) => <li key={fact}>{fact}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Passt zu</p>
                  <ul className="space-y-1.5 text-sm">
                    {insight.pairings.map((pairing) => <li key={pairing}>{pairing}</li>)}
                  </ul>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Diese erste Version bereitet die Übersicht aus den erfassten Weindaten vor und öffnet die Websuche für aktuelle Quellen.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInsightWine(null)}>Schliessen</Button>
            {insight && (
              <Button variant="wine" onClick={() => window.open(insight.searchUrl, "_blank", "noopener,noreferrer")} className="gap-1.5">
                <ExternalLink className="w-4 h-4" />
                Websuche öffnen
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editWine} onOpenChange={() => setEditWine(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Wein bearbeiten</DialogTitle>
          </DialogHeader>
          {editWine && (
            <div className="space-y-4">
              {/* Image upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label className="font-body text-xs">Bilder der Flasche</Label>
                  <span className="text-xs text-muted-foreground">{getWineImages(editWine).length}/3</span>
                </div>
                {getWineImages(editWine).length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {getWineImages(editWine).map((image) => (
                      <div key={image.id} className="relative h-28 rounded-lg overflow-hidden border border-border bg-black/10">
                        <img src={image.uri} alt={image.label ?? editWine.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeEditImage(image.id)}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-background/85 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          title="Bild entfernen"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditPrimaryImage(image.id)}
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
                {getWineImages(editWine).length < 3 && (
                  <label
                    onDragEnter={(e) => { e.preventDefault(); setIsCellarDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); setIsCellarDragging(true); }}
                    onDragLeave={() => setIsCellarDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsCellarDragging(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) handleCellarImageFile(f); }}
                    className={cn(
                      "relative rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 px-4 py-5 text-center transition-colors cursor-pointer overflow-hidden",
                      isCellarDragging ? "border-primary/60 bg-primary/8" : "border-border hover:border-primary/50"
                    )}
                  >
                    <Image className={cn("w-7 h-7", isCellarDragging ? "text-primary/70" : "text-muted-foreground/60")} />
                    <span className={cn("text-xs font-body", isCellarDragging ? "text-foreground" : "text-muted-foreground")}>
                      {isCellarDragging ? "Loslassen" : "Bild hinzufügen"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCellarImageFile(f); e.target.value = ""; }}
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Name</Label>
                  <Input value={editWine.name} onChange={(e) => setEditWine({ ...editWine, name: e.target.value })} className="font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Produzent</Label>
                  <Input value={editWine.producer} onChange={(e) => setEditWine({ ...editWine, producer: e.target.value })} className="font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Typ</Label>
                  <Select value={editWine.type} onValueChange={(v: Wine["type"]) => setEditWine({ ...editWine, type: v })}>
                    <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rot">Rotwein</SelectItem>
                      <SelectItem value="weiss">Weisswein</SelectItem>
                      <SelectItem value="rosé">Rosé</SelectItem>
                      <SelectItem value="schaumwein">Schaumwein</SelectItem>
                      <SelectItem value="dessert">Dessertwein</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="font-body text-xs">Rebsorte</Label>
                  <GrapeSelector value={editWine.grape} onChange={(v) => setEditWine({ ...editWine, grape: v })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Jahrgang</Label>
                  <Input type="number" value={editWine.vintage} onChange={(e) => setEditWine({ ...editWine, vintage: parseInt(e.target.value) || editWine.vintage })} className="font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Flaschen</Label>
                  <Input type="number" min={0} value={editWine.quantity} onChange={(e) => setEditWine({ ...editWine, quantity: parseInt(e.target.value) || 0 })} className="font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Land</Label>
                  <Select value={editWine.country} onValueChange={(v) => setEditWine({ ...editWine, country: v, region: "" })}>
                    <SelectTrigger className="font-body"><SelectValue placeholder="Land wählen..." /></SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Region</Label>
                  <Select value={editWine.region} onValueChange={(v) => setEditWine({ ...editWine, region: v })} disabled={!editWine.country}>
                    <SelectTrigger className="font-body"><SelectValue placeholder={editWine.country ? "Region wählen..." : "Zuerst Land wählen"} /></SelectTrigger>
                    <SelectContent>
                      {getRegionsForCountry(editWine.country).map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Preis (CHF)</Label>
                  <Input type="number" min={0} step={0.5} value={editWine.purchasePrice} onChange={(e) => setEditWine({ ...editWine, purchasePrice: parseFloat(e.target.value) || 0 })} className="font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Rating (0-100)</Label>
                  <Input type="number" min={0} max={100} value={editWine.rating ?? ""} onChange={(e) => setEditWine({ ...editWine, rating: e.target.value ? parseInt(e.target.value) : undefined })} className="font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Trinkreif ab</Label>
                  <Input type="number" value={editWine.drinkFrom} onChange={(e) => setEditWine({ ...editWine, drinkFrom: parseInt(e.target.value) || editWine.drinkFrom })} className="font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Trinkreif bis</Label>
                  <Input type="number" value={editWine.drinkUntil} onChange={(e) => setEditWine({ ...editWine, drinkUntil: parseInt(e.target.value) || editWine.drinkUntil })} className="font-body" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs">Notizen</Label>
                <Textarea value={editWine.notes ?? ""} onChange={(e) => setEditWine({ ...editWine, notes: e.target.value || undefined })} className="font-body" />
              </div>
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="font-body text-xs flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 text-wine-gold" /> Geschenk</Label>
                  <Switch checked={editWine.isGift ?? false} onCheckedChange={(checked) => setEditWine({ ...editWine, isGift: checked, giftFrom: checked ? editWine.giftFrom : undefined })} />
                </div>
                {editWine.isGift && (
                  <div className="space-y-1.5">
                    <Label className="font-body text-xs">Geschenk von *</Label>
                    <Input value={editWine.giftFrom ?? ""} onChange={(e) => setEditWine({ ...editWine, giftFrom: e.target.value })} placeholder="z.B. Max Mustermann" className="font-body" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label className="font-body text-xs flex items-center gap-1.5"><Gem className="w-3.5 h-3.5 text-wine-gold" /> Rarität</Label>
                  <Switch checked={editWine.isRarity ?? false} onCheckedChange={(checked) => setEditWine({ ...editWine, isRarity: checked || undefined })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Flaschengrösse</Label>
                  <Select value={editWine.bottleSize ?? "standard"} onValueChange={(v) => setEditWine({ ...editWine, bottleSize: v === "standard" ? undefined : v })}>
                    <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BOTTLE_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditWine(null)}>Abbrechen</Button>
            <Button variant="wine" onClick={handleEditSave}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
};

export default Cellar;
