import { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { AppLayout } from "@/components/AppLayout";
import { wineRegions, type WineRegion } from "@/data/wineRegions";
import { mockWines, type Wine, getWineTypeLabel, getWineTypeColor } from "@/data/wines";
import { X, MapPin, Grape, Star, Wine as WineIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const WineMap = () => {
  const [selectedRegion, setSelectedRegion] = useState<WineRegion | null>(null);
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterWineType, setFilterWineType] = useState<string>("all");
  const [onlyMyRegions, setOnlyMyRegions] = useState(false);

  // Group wines by region
  const winesByRegion = useMemo(() => {
    const map = new Map<string, Wine[]>();
    mockWines.forEach((wine) => {
      const key = wine.region.toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(wine);
    });
    return map;
  }, []);

  // Unique countries for filter
  const countries = useMemo(() => {
    const set = new Set(wineRegions.map((r) => r.country));
    return Array.from(set).sort();
  }, []);

  // Filtered regions
  const filteredRegions = useMemo(() => {
    return wineRegions.filter((region) => {
      if (filterCountry !== "all" && region.country !== filterCountry) return false;
      if (onlyMyRegions) {
        const wines = winesByRegion.get(region.name.toLowerCase()) || [];
        if (wines.length === 0) return false;
      }
      if (filterWineType !== "all") {
        const wines = winesByRegion.get(region.name.toLowerCase()) || [];
        if (onlyMyRegions || wines.length > 0) {
          const hasType = wines.some((w) => w.type === filterWineType);
          if (!hasType && wines.length > 0) return false;
        }
      }
      return true;
    });
  }, [filterCountry, filterWineType, onlyMyRegions, winesByRegion]);

  const getRegionWineCount = (region: WineRegion) => {
    const wines = winesByRegion.get(region.name.toLowerCase()) || [];
    return wines.reduce((sum, w) => sum + w.quantity, 0);
  };

  const getRegionWines = (region: WineRegion): Wine[] => {
    return winesByRegion.get(region.name.toLowerCase()) || [];
  };

  return (
    <AppLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">Weinregionen</h1>
        <p className="text-muted-foreground font-body mt-1">
          Entdecke Weingebiete und deine Weine auf der Weltkarte
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-4 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-body font-medium">Filter:</span>
        </div>
        <Select value={filterCountry} onValueChange={setFilterCountry}>
          <SelectTrigger className="w-[160px] h-9 text-sm bg-secondary border-border">
            <SelectValue placeholder="Land" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">Alle Länder</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterWineType} onValueChange={setFilterWineType}>
          <SelectTrigger className="w-[160px] h-9 text-sm bg-secondary border-border">
            <SelectValue placeholder="Weintyp" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">Alle Typen</SelectItem>
            <SelectItem value="rot">Rotwein</SelectItem>
            <SelectItem value="weiss">Weisswein</SelectItem>
            <SelectItem value="rosé">Rosé</SelectItem>
            <SelectItem value="schaumwein">Schaumwein</SelectItem>
            <SelectItem value="dessert">Dessertwein</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch id="my-regions" checked={onlyMyRegions} onCheckedChange={setOnlyMyRegions} />
          <Label htmlFor="my-regions" className="text-sm font-body cursor-pointer">Nur meine Regionen</Label>
        </div>
        <span className="text-xs text-muted-foreground font-body ml-auto">
          {filteredRegions.length} Regionen
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {/* Map */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <ComposableMap
            projection="geoEqualEarth"
            projectionConfig={{ scale: 160, center: [10, 20] }}
            className="w-full"
            style={{ aspectRatio: "2/1" }}
          >
            <ZoomableGroup>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="hsl(20, 10%, 16%)"
                      stroke="hsl(20, 10%, 22%)"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "hsl(20, 10%, 20%)", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {filteredRegions.map((region) => {
                const count = getRegionWineCount(region);
                const isSelected = selectedRegion?.id === region.id;
                const hasWines = count > 0;

                return (
                  <Marker
                    key={region.id}
                    coordinates={region.coordinates}
                    onClick={() => setSelectedRegion(region)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Pulse ring for regions with wines */}
                    {hasWines && (
                      <circle
                        r={10}
                        fill="none"
                        stroke={region.color}
                        strokeWidth={1}
                        opacity={0.4}
                        className="animate-ping"
                        style={{ transformOrigin: "center", animationDuration: "3s" }}
                      />
                    )}
                    <circle
                      r={hasWines ? 6 : 4}
                      fill={isSelected ? "hsl(43, 55%, 54%)" : region.color}
                      stroke={isSelected ? "hsl(43, 60%, 65%)" : "hsl(20, 10%, 8%)"}
                      strokeWidth={isSelected ? 2 : 1}
                      opacity={hasWines ? 1 : 0.5}
                    />
                    {hasWines && (
                      <text
                        textAnchor="middle"
                        y={-10}
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 8,
                          fill: "hsl(43, 55%, 54%)",
                          fontWeight: 600,
                        }}
                      >
                        {count}
                      </text>
                    )}
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* Sidebar / Detail Panel */}
        <div className="space-y-4">
          {selectedRegion ? (
            <RegionDetail
              region={selectedRegion}
              wines={getRegionWines(selectedRegion)}
              onClose={() => setSelectedRegion(null)}
            />
          ) : (
            <RegionList
              regions={filteredRegions}
              winesByRegion={winesByRegion}
              onSelect={setSelectedRegion}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

function RegionDetail({
  region,
  wines,
  onClose,
}: {
  region: WineRegion;
  wines: Wine[];
  onClose: () => void;
}) {
  const totalBottles = wines.reduce((sum, w) => sum + w.quantity, 0);

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-display font-bold">{region.name}</h2>
          <p className="text-sm text-muted-foreground font-body">{region.country}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Characteristics */}
      <div className="mb-4">
        <h3 className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Eigenschaften
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {region.characteristics.map((c) => (
            <span key={c} className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary-foreground border border-primary/20 font-body">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Grapes */}
      <div className="mb-4">
        <h3 className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2">
          <Grape className="w-3 h-3 inline mr-1" /> Trauben
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {region.grapes.map((g) => (
            <span key={g} className="text-xs px-2 py-1 rounded-full bg-accent/15 text-accent border border-accent/20 font-body">
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* My wines */}
      <div>
        <h3 className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2">
          <WineIcon className="w-3 h-3 inline mr-1" /> Meine Weine ({totalBottles} Flaschen)
        </h3>
        {wines.length > 0 ? (
          <div className="space-y-2">
            {wines.map((wine) => (
              <div key={wine.id} className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-body font-medium text-foreground">{wine.name}</p>
                    <p className="text-xs text-muted-foreground font-body">{wine.producer} · {wine.vintage}</p>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-body", getWineTypeColor(wine.type))}>
                    {getWineTypeLabel(wine.type)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-body">
                  <span>{wine.quantity} Fl.</span>
                  <span>CHF {wine.purchasePrice}/Fl.</span>
                  {wine.rating && (
                    <span className="flex items-center gap-0.5 text-accent">
                      <Star className="w-3 h-3 fill-accent" />
                      {wine.rating}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50 font-body italic">Keine Weine aus dieser Region</p>
        )}
      </div>
    </div>
  );
}

function RegionList({
  regions,
  winesByRegion,
  onSelect,
}: {
  regions: WineRegion[];
  winesByRegion: Map<string, Wine[]>;
  onSelect: (r: WineRegion) => void;
}) {
  // Sort: regions with wines first, then alphabetically
  const sorted = [...regions].sort((a, b) => {
    const aCount = (winesByRegion.get(a.name.toLowerCase()) || []).reduce((s, w) => s + w.quantity, 0);
    const bCount = (winesByRegion.get(b.name.toLowerCase()) || []).reduce((s, w) => s + w.quantity, 0);
    if (aCount && !bCount) return -1;
    if (!aCount && bCount) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-display font-bold mb-3">Alle Regionen</h2>
      <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
        {sorted.map((region) => {
          const wines = winesByRegion.get(region.name.toLowerCase()) || [];
          const count = wines.reduce((s, w) => s + w.quantity, 0);
          return (
            <button
              key={region.id}
              onClick={() => onSelect(region)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary/80 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-body font-medium text-foreground">{region.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{region.country}</p>
                </div>
              </div>
              {count > 0 && (
                <span className="text-xs font-body font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded-full">
                  {count} Fl.
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default WineMap;
