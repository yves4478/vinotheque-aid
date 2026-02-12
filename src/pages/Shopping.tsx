import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ShoppingCart, Plus, Check, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShoppingItem {
  id: string;
  name: string;
  producer: string;
  quantity: number;
  estimatedPrice: number;
  reason: string;
  checked: boolean;
}

const initialItems: ShoppingItem[] = [
  { id: "1", name: "Barolo Riserva 2016", producer: "Giacomo Conterno", quantity: 2, estimatedPrice: 89, reason: "Liebling auffüllen", checked: false },
  { id: "2", name: "Riesling Kabinett 2023", producer: "Joh. Jos. Prüm", quantity: 6, estimatedPrice: 18, reason: "Empfehlung basierend auf Bewertung", checked: false },
  { id: "3", name: "Brunello di Montalcino 2018", producer: "Biondi-Santi", quantity: 3, estimatedPrice: 75, reason: "Neuentdeckung", checked: true },
];

const Shopping = () => {
  const [items, setItems] = useState(initialItems);

  const toggle = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const remove = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);
  const totalEstimate = unchecked.reduce((sum, i) => sum + i.quantity * i.estimatedPrice, 0);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold">Einkaufsliste</h1>
          <p className="text-muted-foreground font-body mt-1">
            {unchecked.length} Weine · ca. CHF {totalEstimate.toLocaleString()}
          </p>
        </div>
        <Button variant="wine">
          <Plus className="w-4 h-4" />
          Hinzufügen
        </Button>
      </div>

      {/* Active items */}
      <div className="space-y-3 mb-8">
        {unchecked.map((item, i) => (
          <div
            key={item.id}
            className="glass-card p-4 flex items-center gap-4 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <button
              onClick={() => toggle(item.id)}
              className="w-6 h-6 rounded-md border-2 border-border flex items-center justify-center hover:border-primary transition-colors flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm">{item.name}</p>
              <p className="text-xs text-muted-foreground font-body">{item.producer}</p>
              <p className="text-xs text-wine-gold font-body mt-1">{item.reason}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-body font-medium">{item.quantity}×</p>
              <p className="text-xs text-muted-foreground font-body">CHF {item.estimatedPrice}</p>
            </div>
            <button onClick={() => remove(item.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Checked items */}
      {checked.length > 0 && (
        <div>
          <h2 className="text-sm text-muted-foreground font-body uppercase tracking-wider mb-3">Erledigt</h2>
          <div className="space-y-2">
            {checked.map((item) => (
              <div
                key={item.id}
                className="glass-card p-4 flex items-center gap-4 opacity-50"
              >
                <button
                  onClick={() => toggle(item.id)}
                  className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm line-through">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{item.producer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Shopping;
