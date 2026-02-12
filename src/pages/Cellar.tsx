import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { WineCard } from "@/components/WineCard";
import { mockWines, type Wine, getWineTypeLabel, getWineTypeColor, getDrinkStatus } from "@/data/wines";
import { Search, Wine as WineIcon, LayoutGrid, List, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const typeFilters = [
  { value: "all", label: "Alle" },
  { value: "rot", label: "Rot" },
  { value: "weiss", label: "Weiss" },
  { value: "rosé", label: "Rosé" },
  { value: "schaumwein", label: "Schaum" },
] as const;

type ViewMode = "grid" | "list";

const Cellar = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("list");

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
              <WineCard key={wine.id} wine={wine} index={i} />
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((wine) => {
                    const status = getDrinkStatus(wine);
                    return (
                      <TableRow key={wine.id} className="border-border cursor-pointer hover:bg-primary/5">
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
    </AppLayout>
  );
};

export default Cellar;
