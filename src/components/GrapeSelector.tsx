import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";
import { wineRegions } from "@/data/wineRegions";

const ALL_GRAPES: string[] = (() => {
  const set = new Set<string>();
  for (const region of wineRegions) {
    for (const g of region.grapes) {
      set.add(g);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "de"));
})();

interface GrapeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function GrapeSelector({ value, onChange, className }: GrapeSelectorProps) {
  const [search, setSearch] = useState("");

  const selected = useMemo(() => {
    if (!value.trim()) return new Set<string>();
    return new Set(value.split(",").map((s) => s.trim()).filter(Boolean));
  }, [value]);

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_GRAPES;
    const q = search.toLowerCase();
    return ALL_GRAPES.filter((g) => g.toLowerCase().includes(q));
  }, [search]);

  const toggle = (grape: string) => {
    const next = new Set(selected);
    if (next.has(grape)) {
      next.delete(grape);
    } else {
      next.add(grape);
    }
    onChange(Array.from(next).sort((a, b) => a.localeCompare(b, "de")).join(", "));
  };

  const remove = (grape: string) => {
    const next = new Set(selected);
    next.delete(grape);
    onChange(Array.from(next).sort((a, b) => a.localeCompare(b, "de")).join(", "));
  };

  return (
    <div className={className}>
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Array.from(selected).sort((a, b) => a.localeCompare(b, "de")).map((g) => (
            <span
              key={g}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/25 font-body"
            >
              {g}
              <button
                type="button"
                onClick={() => remove(g)}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Rebsorte suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs bg-card border-border font-body"
        />
      </div>

      <div className="max-h-44 overflow-y-auto rounded-md border border-border bg-card p-2 space-y-0.5">
        {filtered.length > 0 ? (
          filtered.map((grape) => (
            <label
              key={grape}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selected.has(grape)}
                onCheckedChange={() => toggle(grape)}
              />
              <span className="text-xs font-body">{grape}</span>
            </label>
          ))
        ) : (
          <p className="text-xs text-muted-foreground font-body text-center py-2">
            Keine Rebsorte gefunden
          </p>
        )}
      </div>
    </div>
  );
}
