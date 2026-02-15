import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ShoppingCart, Plus, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { usePantryStore } from "@/hooks/usePantryStore";
import { defaultCategories, defaultUnits } from "@/data/pantry";

const PantryShopping = () => {
  const { shoppingItems, addShoppingItem, toggleShoppingItem, removeShoppingItem } = usePantryStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    quantity: 1,
    unit: "Stück",
    estimatedPrice: 0,
    reason: "",
  });

  const unchecked = shoppingItems.filter((i) => !i.checked);
  const checked = shoppingItems.filter((i) => i.checked);
  const totalEstimate = unchecked.reduce((sum, i) => sum + i.quantity * i.estimatedPrice, 0);

  const handleAdd = () => {
    if (!newItem.name.trim()) return;
    addShoppingItem({
      name: newItem.name.trim(),
      category: newItem.category,
      quantity: newItem.quantity,
      unit: newItem.unit,
      estimatedPrice: newItem.estimatedPrice,
      reason: newItem.reason.trim(),
    });
    setNewItem({ name: "", category: "", quantity: 1, unit: "Stück", estimatedPrice: 0, reason: "" });
    setShowAdd(false);
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Einkaufsliste</h1>
          <p className="text-muted-foreground font-body mt-1">
            {unchecked.length} Artikel · ca. CHF {totalEstimate.toLocaleString()}
          </p>
        </div>
        <Button variant="wine" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" />
          Hinzufügen
        </Button>
      </div>

      {/* Active items */}
      {unchecked.length > 0 ? (
        <div className="space-y-3 mb-8">
          {unchecked.map((item, i) => (
            <div
              key={item.id}
              className="glass-card p-4 flex items-center gap-4 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <button
                onClick={() => toggleShoppingItem(item.id)}
                className="w-6 h-6 rounded-md border-2 border-border flex items-center justify-center hover:border-primary transition-colors flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground font-body">
                  {item.category}{item.category && item.unit ? " · " : ""}{item.unit}
                </p>
                {item.reason && <p className="text-xs text-wine-gold font-body mt-1">{item.reason}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-body font-medium">{item.quantity}×</p>
                <p className="text-xs text-muted-foreground font-body">CHF {item.estimatedPrice}</p>
              </div>
              <button onClick={() => removeShoppingItem(item.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center mb-8 animate-fade-in">
          <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-body">Deine Einkaufsliste ist leer</p>
        </div>
      )}

      {/* Checked items */}
      {checked.length > 0 && (
        <div>
          <h2 className="text-sm text-muted-foreground font-body uppercase tracking-wider mb-3">Erledigt</h2>
          <div className="space-y-2">
            {checked.map((item) => (
              <div key={item.id} className="glass-card p-4 flex items-center gap-4 opacity-50">
                <button
                  onClick={() => toggleShoppingItem(item.id)}
                  className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm line-through">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{item.category}</p>
                </div>
                <button onClick={() => removeShoppingItem(item.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Artikel zur Einkaufsliste</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Artikelname *</Label>
              <Input placeholder="z.B. Olivenöl" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Kategorie</Label>
              <Select value={newItem.category || "__none"} onValueChange={(v) => setNewItem({ ...newItem, category: v === "__none" ? "" : v })}>
                <SelectTrigger className="font-body"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Keine</SelectItem>
                  {defaultCategories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Menge</Label>
                <Input type="number" min={1} value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} className="font-body" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Einheit</Label>
                <Select value={newItem.unit} onValueChange={(v) => setNewItem({ ...newItem, unit: v })}>
                  <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {defaultUnits.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Preis (CHF)</Label>
                <Input type="number" min={0} step={0.5} value={newItem.estimatedPrice} onChange={(e) => setNewItem({ ...newItem, estimatedPrice: parseFloat(e.target.value) || 0 })} className="font-body" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Grund</Label>
              <Input placeholder="z.B. Vorrat auffüllen" value={newItem.reason} onChange={(e) => setNewItem({ ...newItem, reason: e.target.value })} className="font-body" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Abbrechen</Button>
            <Button variant="wine" onClick={handleAdd}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default PantryShopping;
