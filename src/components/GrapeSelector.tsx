import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  type GrapeEntryMode,
  OTHER_GRAPE_OPTION,
  formatGrapeList,
  getGrapesForCountry,
  parseGrapeList,
} from "@vinotheque/core";
import { cn } from "@/lib/utils";

interface GrapeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  country?: string;
  className?: string;
}

export function GrapeSelector({ value, onChange, country, className }: GrapeSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<GrapeEntryMode>("single");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const grapeOptions = useMemo(() => getGrapesForCountry(country), [country]);
  const selected = useMemo(() => {
    if (!value.trim()) return new Set<string>();
    return new Set(parseGrapeList(value));
  }, [value]);

  useEffect(() => {
    const values = parseGrapeList(value);
    if (values.length > 1) {
      setMode("assemblage");
    } else if (values.length === 1 && !grapeOptions.includes(values[0])) {
      setMode("other");
    }
  }, [grapeOptions, value]);

  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return grapeOptions.filter((g) => !selected.has(g)).slice(0, 30);
    return grapeOptions.filter(
      (g) => g.toLowerCase().includes(q) && !selected.has(g)
    ).slice(0, 20);
  }, [grapeOptions, query, selected]);

  const add = (grape: string) => {
    const next = new Set(selected);
    next.add(grape);
    onChange(formatGrapeList(next));
    setQuery("");
    inputRef.current?.focus();
  };

  const addSingle = (grape: string) => {
    onChange(grape);
    setQuery("");
    setOpen(false);
  };

  const remove = (grape: string) => {
    const next = new Set(selected);
    next.delete(grape);
    onChange(formatGrapeList(next));
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

  const switchMode = (nextMode: GrapeEntryMode) => {
    setMode(nextMode);
    setQuery("");
    setOpen(false);
    onChange("");
  };

  const selectSingleGrape = (nextValue: string) => {
    if (nextValue === OTHER_GRAPE_OPTION) {
      switchMode("other");
      return;
    }
    onChange(nextValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      add(suggestions[0]);
    }
    if (e.key === "Enter" && suggestions.length === 0 && query.trim()) {
      e.preventDefault();
      add(query.trim());
    }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Backspace" && !query && selected.size > 0) {
      const last = Array.from(selected).at(-1);
      if (last) remove(last);
    }
  };

  const handleSingleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      addSingle(suggestions[0]);
    }
    if (e.key === "Enter" && suggestions.length === 0 && query.trim()) {
      e.preventDefault();
      onChange(query.trim());
      setMode("other");
      setQuery("");
      setOpen(false);
    }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Backspace" && !query && value) onChange("");
  };

  return (
    <div ref={containerRef} className={cn("space-y-2", className)}>
      <select
        value={mode}
        onChange={(event) => switchMode(event.target.value as GrapeEntryMode)}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
      >
        <option value="single">Rebsorte</option>
        <option value="assemblage">Assemblage</option>
        <option value="other">Andere</option>
      </select>

      {mode === "single" && (
        <div className="relative">
          <div
            className={cn(
              "min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-xl border bg-white cursor-text transition-colors",
              open ? "border-primary/50 ring-2 ring-primary/10" : "border-gray-200"
            )}
            onClick={() => { inputRef.current?.focus(); setOpen(true); }}
          >
            {value && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                {value}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(""); }}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleSingleKeyDown}
              placeholder={value ? "Andere Rebsorte suchen…" : country ? `Rebsorte aus ${country} suchen…` : "Rebsorte suchen…"}
              className="flex-1 min-w-[120px] text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
            />

            <ChevronDown className={cn("w-4 h-4 text-muted-foreground/50 shrink-0 transition-transform", open && "rotate-180")} />
          </div>

          {open && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
            >
              <div className="max-h-56 overflow-y-auto overscroll-contain">
                {suggestions.map((grape) => (
                  <button
                    key={grape}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addSingle(grape); }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-primary/5 active:bg-primary/10 transition-colors border-b border-gray-50 last:border-0 min-h-[44px] flex items-center"
                  >
                    {grape}
                  </button>
                ))}
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); switchMode("other"); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-primary/5 active:bg-primary/10 transition-colors min-h-[44px] flex items-center font-medium text-primary"
                >
                  Andere…
                </button>
              </div>
            </div>
          )}

          {open && query.trim() && suggestions.length === 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(query.trim());
                  setMode("other");
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-primary/5 active:bg-primary/10 transition-colors min-h-[44px] flex items-center"
              >
                „{query.trim()}" als andere Traube verwenden
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "other" && (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Rebsorte manuell eingeben…"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none placeholder:text-muted-foreground/40 transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        />
      )}

      {mode === "assemblage" && (
        <div className="relative">
          <div
            className={cn(
              "min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-xl border bg-white cursor-text transition-colors",
              open ? "border-primary/50 ring-2 ring-primary/10" : "border-gray-200"
            )}
            onClick={() => { inputRef.current?.focus(); setOpen(true); }}
          >
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

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={selected.size === 0 ? "Trauben für Assemblage wählen…" : "Weitere hinzufügen…"}
              className="flex-1 min-w-[120px] text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
            />

            <ChevronDown className={cn("w-4 h-4 text-muted-foreground/50 shrink-0 transition-transform", open && "rotate-180")} />
          </div>

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
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (query.trim()) {
                      add(query.trim());
                    } else {
                      switchMode("other");
                    }
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-primary/5 active:bg-primary/10 transition-colors min-h-[44px] flex items-center font-medium text-primary"
                >
                  Andere…
                </button>
              </div>
            </div>
          )}

          {open && query.trim() && suggestions.length === 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); add(query.trim()); }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-primary/5 active:bg-primary/10 transition-colors min-h-[44px] flex items-center"
              >
                „{query.trim()}" als andere Traube hinzufügen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
