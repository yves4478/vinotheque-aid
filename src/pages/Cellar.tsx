import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { WineCard } from "@/components/WineCard";
import { mockWines, type Wine } from "@/data/wines";
import { Search, Filter, Wine as WineIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const typeFilters = [
  { value: "all", label: "Alle" },
  { value: "rot", label: "Rot" },
  { value: "weiss", label: "Weiss" },
  { value: "rosé", label: "Rosé" },
  { value: "schaumwein", label: "Schaum" },
] as const;

const Cellar = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = mockWines.filter((w) => {
    const matchSearch = !search || 
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.producer.toLowerCase().includes(search.toLowerCase()) ||
      w.region.toLowerCase().includes(search.toLowerCase()) ||
      w.grape.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || w.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalBottles = filtered.reduce((sum, w) => sum + w.quantity, 0);

  return (
    <AppLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">Weinkeller</h1>
        <p className="text-muted-foreground font-body mt-1">
          {totalBottles} Flaschen · {filtered.length} Weine
        </p>
      </div>

      {/* Search & Filter */}
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
        <div className="flex gap-1.5">
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
        </div>
      </div>

      {/* Wine Grid */}
      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((wine, i) => (
            <WineCard key={wine.id} wine={wine} index={i} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center animate-fade-in">
          <WineIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-body">Keine Weine gefunden</p>
        </div>
      )}
    </AppLayout>
  );
};

export default Cellar;
