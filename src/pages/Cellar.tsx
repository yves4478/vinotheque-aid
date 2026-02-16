import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { WineCard } from "@/components/WineCard";
import { type Wine, getWineTypeLabel, getWineTypeColor, getDrinkStatus } from "@/data/wines";
import { Search, Wine as WineIcon, LayoutGrid, List, Star, Trash2, Pencil, Download, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { GrapeSelector } from "@/components/GrapeSelector";
import { cn } from "@/lib/utils";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";

const typeFilters = [
  { value: "all", label: "Alle" },
  { value: "rot", label: "Rot" },
  { value: "weiss", label: "Weiss" },
  { value: "rosé", label: "Rosé" },
  { value: "schaumwein", label: "Schaum" },
] as const;

type ViewMode = "grid" | "list";

const Cellar = () => {
  const { wines, deleteWine, updateWine, settings } = useWineStore();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("list");
  const [editWine, setEditWine] = useState<Wine | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Wine | null>(null);

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

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteWine(deleteConfirm.id);
    toast({ title: "Wein gelöscht", description: `${deleteConfirm.name} wurde entfernt.` });
    setDeleteConfirm(null);
  };

  const handleEditSave = () => {
    if (!editWine) return;
    if (editWine.isGift && !editWine.giftFrom?.trim()) {
      toast({ title: "Fehler", description: "Bei einem Geschenk muss der Schenkende angegeben werden.", variant: "destructive" });
      return;
    }
    updateWine(editWine.id, editWine);
    toast({ title: "Wein aktualisiert", description: `${editWine.name} wurde gespeichert.` });
    setEditWine(null);
  };

  const exportCsv = () => {
    const headers = ["Name", "Produzent", "Typ", "Jahrgang", "Region", "Land", "Rebsorte", "Flaschen", "Preis", "Wert", "Trinkreif ab", "Trinkreif bis", "Rating", "Geschenk", "Geschenk von", "Notizen"];
    const rows = wines.map((w) => [
      w.name, w.producer, getWineTypeLabel(w.type), w.vintage, w.region, w.country, w.grape,
      w.quantity, w.purchasePrice, w.quantity * w.purchasePrice, w.drinkFrom, w.drinkUntil,
      w.rating ?? "", w.isGift ? "Ja" : "Nein", w.giftFrom ?? "", w.notes ?? ""
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
      <div className="flex items-start justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Weinkeller</h1>
          <p className="text-muted-foreground font-body mt-1">
            {totalBottles} Flaschen · {filtered.length} Weine
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
          <Download className="w-4 h-4" />
          CSV Export
        </Button>
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
              <WineCard key={wine.id} wine={wine} index={i} onEdit={() => setEditWine({ ...wine })} onDelete={() => setDeleteConfirm(wine)} />
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
                        <TableCell className="font-body text-foreground text-right">CHF {wine.purchasePrice}</TableCell>
                        <TableCell className="font-body text-muted-foreground text-right">CHF {wine.quantity * wine.purchasePrice}</TableCell>
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

      {/* Edit Dialog */}
      <Dialog open={!!editWine} onOpenChange={() => setEditWine(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Wein bearbeiten</DialogTitle>
          </DialogHeader>
          {editWine && (
            <div className="space-y-4">
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
                  <Label className="font-body text-xs">Region</Label>
                  <Input value={editWine.region} onChange={(e) => setEditWine({ ...editWine, region: e.target.value })} className="font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs">Land</Label>
                  <Input value={editWine.country} onChange={(e) => setEditWine({ ...editWine, country: e.target.value })} className="font-body" />
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
