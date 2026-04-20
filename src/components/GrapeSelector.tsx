import { useState, useMemo, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { wineRegions } from "@/data/wineRegions";
import { cn } from "@/lib/utils";

const ALL_GRAPES: string[] = (() => {
  const set = new Set<string>();
  for (const region of wineRegions) {
    for (const g of region.grapes) set.add(g);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "de"));
})();

interface GrapeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function GrapeSelector({ value, onChange, className }: GrapeSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => {
    if (!value.trim()) return new Set<string>();
    return new Set(value.split(",").map((s) => s.trim()).filter(Boolean));
  }, [value]);

  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return ALL_GRAPES.filter((g) => !selected.has(g)).slice(0, 30);
    return ALL_GRAPES.filter(
      (g) => g.toLowerCase().includes(q) && !selected.has(g)
    ).slice(0, 20);
  }, [query, selected]);

  const add = (grape: string) => {
    const next = new Set(selected);
    next.add(grape);
    onChange(Array.from(next).sort((a, b) => a.localeCompare(b, "de")).join(", "));
    setQuery("");
    inputRef.current?.focus();
  };

  const remove = (grape: string) => {
    const next = new Set(selected);
    next.delete(grape);
    onChange(Array.from(next).sort((a, b) => a.localeCompare(b, "de")).join(", "));
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      add(suggestions[0]);
    }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Backspace" && !query && selected.size > 0) {
      const last = Array.from(selected).at(-1);
      if (last) remove(last);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Input + chips row */}
      <div
        className={cn(
          "min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-xl border bg-white cursor-text transition-colors",
          open ? "border-primary/50 ring-2 ring-primary/10" : "border-gray-200"
        )}
        onClick={() => { inputRef.current?.focus(); setOpen(true); }}
      >
        {/* Selected chips */}
        {Array.from(selected).map((g) => (
          <span
            key={g}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium shrink-0"
          >
            {g}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(g); }}
              className="hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.size === 0 ? "Rebsorte suchen und wählen…" : "Weitere hinzufügen…"}
          className="flex-1 min-w-[120px] text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
        />

        <ChevronDown className={cn("w-4 h-4 text-muted-foreground/50 shrink-0 transition-transform", open && "rotate-180")} />
      </div>

      {/* Dropdown suggestions */}
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          <div className="max-h-56 overflow-y-auto overscroll-contain">
            {suggestions.map((grape) => (
              <button
                key={grape}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); add(grape); }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-primary/5 active:bg-primary/10 transition-colors border-b border-gray-50 last:border-0 min-h-[44px] flex items-center"
              >
                {grape}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {open && query.trim() && suggestions.length === 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3 text-sm text-muted-foreground">
          Keine Rebsorte gefunden für „{query}"
        </div>
      )}
    </div>
  );
}
