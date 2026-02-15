import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { usePantryStore, type PantryItem } from "@/hooks/usePantryStore";
import { defaultCategories, defaultUnits, defaultLocations, getExpiryStatus } from "@/data/pantry";
import { Search, Package, LayoutGrid, List, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "grid" | "list";

const emptyForm = {
  name: "",
  category: "",
  quantity: 1,
  unit: "Stück",
  location: "",
  expiryDate: "",
  purchasePrice: 0,
  notes: "",
};

const PantryInventory = () => {
  const { items, addItem, updateItem, deleteItem } = usePantryStore();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [view, setView] = useState<ViewMode>("list");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<PantryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PantryItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const categories = ["all", ...new Set(items.map((i) => i.category).filter(Boolean))];

  const filtered = items.filter((i) => {
    const matchSearch =
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()) ||
      i.location.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalQuantity = filtered.reduce((sum, i) => sum + i.quantity, 0);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addItem({ ...form, name: form.name.trim(), notes: form.notes || undefined });
    toast({ title: "Hinzugefügt", description: `${form.name} wurde zur Vorratskammer hinzugefügt.` });
    setForm(emptyForm);
    setShowAdd(false);
  };

  const handleEditSave = () => {
    if (!editItem) return;
    updateItem(editItem.id, editItem);
    toast({ title: "Aktualisiert", description: `${editItem.name} wurde gespeichert.` });
    setEditItem(null);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteItem(deleteConfirm.id);
    toast({ title: "Gelöscht", description: `${deleteConfirm.name} wurde entfernt.` });
    setDeleteConfirm(null);
  };

  const openEdit = (item: PantryItem) => setEditItem({ ...item });

  const ItemFormFields = ({ data, onChange }: { data: typeof emptyForm | PantryItem; onChange: (d: typeof data) => void }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label className="font-body text-xs">Name *</Label>
          <Input value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} placeholder="z.B. Olivenöl" className="font-body" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-xs">Kategorie</Label>
          <Select value={data.category || "__none"} onValueChange={(v) => onChange({ ...data, category: v === "__none" ? "" : v })}>
            <SelectTrigger className="font-body"><SelectValue placeholder="Wählen..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Keine</SelectItem>
              {defaultCategories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-xs">Lagerort</Label>
          <Select value={data.location || "__none"} onValueChange={(v) => onChange({ ...data, location: v === "__none" ? "" : v })}>
            <SelectTrigger className="font-body"><SelectValue placeholder="Wählen..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Kein Ort</SelectItem>
              {defaultLocations.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-xs">Menge</Label>
          <Input type="number" min={0} value={data.quantity} onChange={(e) => onChange({ ...data, quantity: parseInt(e.target.value) || 0 })} className="font-body" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-xs">Einheit</Label>
          <Select value={data.unit} onValueChange={(v) => onChange({ ...data, unit: v })}>
            <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
            <SelectContent>
              {defaultUnits.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-xs">Ablaufdatum</Label>
          <Input type="date" value={data.expiryDate} onChange={(e) => onChange({ ...data, expiryDate: e.target.value })} className="font-body" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-xs">Preis (CHF)</Label>
          <Input type="number" min={0} step={0.1} value={data.purchasePrice} onChange={(e) => onChange({ ...data, purchasePrice: parseFloat(e.target.value) || 0 })} className="font-body" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="font-body text-xs">Notizen</Label>
        <Textarea value={data.notes ?? ""} onChange={(e) => onChange({ ...data, notes: e.target.value })} placeholder="Optional..." className="font-body" />
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Inventar</h1>
          <p className="text-muted-foreground font-body mt-1">
            {totalQuantity} Artikel · {filtered.length} Produkte
          </p>
        </div>
        <Button variant="wine" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
          <Plus className="w-4 h-4" />
          Hinzufügen
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Artikel suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border font-body"
          />
        </div>
        <div className="flex gap-1.5 items-center flex-wrap">
          {categories.slice(0, 6).map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-body font-medium transition-all duration-200",
                catFilter === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {c === "all" ? "Alle" : c}
            </button>
          ))}
          <div className="w-px h-6 bg-border mx-1" />
          <button
            onClick={() => setView("grid")}
            className={cn("p-2 rounded-lg transition-colors", view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("p-2 rounded-lg transition-colors", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length > 0 ? (
        view === "grid" ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((item, i) => {
              const status = getExpiryStatus(item);
              return (
                <div
                  key={item.id}
                  className="glass-card p-5 animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-semibold">{item.name}</h3>
                      <p className="text-xs text-muted-foreground font-body">{item.category}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(item)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm font-body">
                    <span>{item.quantity} {item.unit}</span>
                    <span className="text-muted-foreground">{item.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-body mt-2">
                    <span className="text-muted-foreground">CHF {item.purchasePrice}</span>
                    <span className={cn("font-medium", status.color)}>{status.label}</span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground/70 font-body mt-2 line-clamp-2">{item.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-body text-muted-foreground">Artikel</TableHead>
                    <TableHead className="font-body text-muted-foreground">Kategorie</TableHead>
                    <TableHead className="font-body text-muted-foreground text-right">Menge</TableHead>
                    <TableHead className="font-body text-muted-foreground">Lagerort</TableHead>
                    <TableHead className="font-body text-muted-foreground text-right">Preis</TableHead>
                    <TableHead className="font-body text-muted-foreground">Ablauf</TableHead>
                    <TableHead className="font-body text-muted-foreground text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => {
                    const status = getExpiryStatus(item);
                    return (
                      <TableRow key={item.id} className="border-border hover:bg-primary/5">
                        <TableCell className="font-body font-medium text-foreground">{item.name}</TableCell>
                        <TableCell className="font-body text-muted-foreground text-sm">{item.category}</TableCell>
                        <TableCell className="font-body text-foreground text-right font-semibold">{item.quantity} {item.unit}</TableCell>
                        <TableCell className="font-body text-muted-foreground text-sm">{item.location}</TableCell>
                        <TableCell className="font-body text-foreground text-right">CHF {item.purchasePrice}</TableCell>
                        <TableCell>
                          <span className={cn("text-xs font-body font-medium", status.color)}>{status.label}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteConfirm(item)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
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
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-body">Keine Artikel gefunden</p>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Artikel hinzufügen</DialogTitle>
          </DialogHeader>
          <ItemFormFields data={form} onChange={setForm as (d: typeof form) => void} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Abbrechen</Button>
            <Button variant="wine" onClick={handleAdd}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Artikel bearbeiten</DialogTitle>
          </DialogHeader>
          {editItem && <ItemFormFields data={editItem} onChange={setEditItem as (d: PantryItem) => void} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Abbrechen</Button>
            <Button variant="wine" onClick={handleEditSave}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Artikel löschen?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body">
            Möchtest du <strong>{deleteConfirm?.name}</strong> wirklich aus der Vorratskammer entfernen?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleDelete}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default PantryInventory;
