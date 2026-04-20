import { useEffect, useMemo, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AppLayout } from "@/components/AppLayout";
import {
  getWineStylesForRegion,
  matchWineOriginToRegion,
  normalizeOriginName,
  wineRegions,
  type WineRegion,
} from "@/data/wineRegions";
import { type Wine, getWineTypeLabel } from "@/data/wines";
import { useWineStore } from "@/hooks/useWineStore";
import { X, MapPin, Grape, Star, Wine as WineIcon, Filter, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT_MAP_CENTER: [number, number] = [20, 10];
const DEFAULT_MAP_ZOOM = 2;
const COUNTRY_MARKER_MAX_ZOOM = 3.8;
const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const WINE_TYPE_ORDER: Wine["type"][] = ["rot", "weiss", "rosé", "schaumwein", "dessert"];
const SECTION_TITLE_CLASS = "text-[11px] sm:text-xs font-body font-semibold text-foreground/70 uppercase tracking-[0.18em] mb-2.5";

type CellarOriginGroup = {
  key: string;
  country: string;
  region: string;
  wines: Wine[];
  wineCount: number;
  totalBottles: number;
};

type RegionSummary = {
  region: WineRegion;
  wines: Wine[];
  wineCount: number;
  totalBottles: number;
  cellarWineTypes: Wine["type"][];
  typicalWineTypes: Wine["type"][];
};

type CountrySummary = {
  country: string;
  regions: WineRegion[];
  wineCount: number;
  totalBottles: number;
  typicalWineTypes: Wine["type"][];
  bounds: L.LatLngBounds;
  center: [number, number];
};

function toLeafletLatLng([lng, lat]: [number, number]): [number, number] {
  return [lat, lng];
}

function sortWineTypes(types: Wine["type"][]): Wine["type"][] {
  return [...types].sort((a, b) => WINE_TYPE_ORDER.indexOf(a) - WINE_TYPE_ORDER.indexOf(b));
}

function getBoundsForRegions(regions: WineRegion[]): L.LatLngBounds | null {
  if (regions.length === 0) return null;
  return L.latLngBounds(regions.map((region) => toLeafletLatLng(region.coordinates)));
}

function groupCellarOrigins(wines: Wine[]): CellarOriginGroup[] {
  const groupedOrigins = new Map<string, CellarOriginGroup>();

  wines.forEach((wine) => {
    const key = `${normalizeOriginName(wine.country)}::${normalizeOriginName(wine.region)}`;
    const existing = groupedOrigins.get(key);

    if (existing) {
      existing.wines.push(wine);
      existing.wineCount += 1;
      existing.totalBottles += wine.quantity;
      return;
    }

    groupedOrigins.set(key, {
      key,
      country: wine.country,
      region: wine.region,
      wines: [wine],
      wineCount: 1,
      totalBottles: wine.quantity,
    });
  });

  return Array.from(groupedOrigins.values()).sort((a, b) =>
    b.wineCount - a.wineCount ||
    b.totalBottles - a.totalBottles ||
    a.country.localeCompare(b.country, "de") ||
    a.region.localeCompare(b.region, "de")
  );
}

function getMarkerRadius(wineCount: number, selected = false) {
  if (wineCount <= 0) return selected ? 7 : 5;
  if (wineCount < 3) return selected ? 9 : 7;
  if (wineCount < 8) return selected ? 11 : 9;
  return selected ? 13 : 11;
}

function getRegionWineTypeChipClass(type: Wine["type"]) {
  switch (type) {
    case "rot":
      return "bg-red-100 text-red-900 border-red-200";
    case "weiss":
      return "bg-amber-100 text-amber-950 border-amber-200";
    case "rosé":
      return "bg-pink-100 text-pink-900 border-pink-200";
    case "schaumwein":
      return "bg-sky-100 text-sky-900 border-sky-200";
    case "dessert":
      return "bg-yellow-100 text-yellow-950 border-yellow-300";
    default:
      return "bg-stone-100 text-stone-800 border-stone-200";
  }
}

function getRegionMetaChipClass(kind: "grape" | "characteristic") {
  if (kind === "grape") {
    return "bg-stone-100 text-stone-800 border-stone-200";
  }

  return "bg-rose-100 text-rose-900 border-rose-200";
}

const WineMap = () => {
  const { wines } = useWineStore();
  const [selectedRegion, setSelectedRegion] = useState<WineRegion | null>(null);
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterWineType, setFilterWineType] = useState<string>("all");
  const [mapZoom, setMapZoom] = useState<number>(DEFAULT_MAP_ZOOM);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const activeWineType = filterWineType === "all" ? null : filterWineType as Wine["type"];

  const filteredCellarWines = useMemo(
    () => activeWineType ? wines.filter((wine) => wine.type === activeWineType) : wines,
    [activeWineType, wines],
  );

  const filteredCellarOrigins = useMemo(
    () => groupCellarOrigins(filteredCellarWines),
    [filteredCellarWines],
  );

  const { regionInventoryById, unmappedOrigins } = useMemo(() => {
    const inventory = new Map<string, { wines: Wine[]; wineCount: number; totalBottles: number }>();
    const nextUnmappedOrigins: CellarOriginGroup[] = [];

    filteredCellarOrigins.forEach((origin) => {
      const matchedRegion = matchWineOriginToRegion(origin);

      if (!matchedRegion) {
        nextUnmappedOrigins.push(origin);
        return;
      }

      const existing = inventory.get(matchedRegion.id);
      if (existing) {
        existing.wines.push(...origin.wines);
        existing.wineCount += origin.wineCount;
        existing.totalBottles += origin.totalBottles;
        return;
      }

      inventory.set(matchedRegion.id, {
        wines: [...origin.wines],
        wineCount: origin.wineCount,
        totalBottles: origin.totalBottles,
      });
    });

    return { regionInventoryById: inventory, unmappedOrigins: nextUnmappedOrigins };
  }, [filteredCellarOrigins]);

  const regionSummaries = useMemo(() => {
    // Every catalog region stays visible; cellar counts are layered on top.
    return wineRegions.map((region) => {
      const inventory = regionInventoryById.get(region.id);
      const winesForRegion = inventory?.wines || [];
      const cellarWineTypes = sortWineTypes(Array.from(new Set(winesForRegion.map((wine) => wine.type))));
      const typicalWineTypes = sortWineTypes(getWineStylesForRegion(region));

      return {
        region,
        wines: winesForRegion,
        wineCount: inventory?.wineCount || 0,
        totalBottles: inventory?.totalBottles || 0,
        cellarWineTypes,
        typicalWineTypes,
      };
    });
  }, [regionInventoryById]);

  const countries = useMemo(() => {
    const set = new Set(wineRegions.map((region) => region.country));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "de"));
  }, []);

  const filteredRegionSummaries = useMemo(() => {
    return regionSummaries
      .filter(({ region, typicalWineTypes }) => {
        if (filterCountry !== "all" && region.country !== filterCountry) return false;
        if (activeWineType && !typicalWineTypes.includes(activeWineType)) return false;
        return true;
      })
      .sort((a, b) =>
        b.wineCount - a.wineCount ||
        b.totalBottles - a.totalBottles ||
        a.region.country.localeCompare(b.region.country, "de") ||
        a.region.name.localeCompare(b.region.name, "de")
      );
  }, [activeWineType, filterCountry, regionSummaries]);

  const countrySummaries = useMemo(() => {
    const countryStats = new Map<string, { wineCount: number; totalBottles: number }>();

    filteredCellarOrigins.forEach((origin) => {
      const existing = countryStats.get(origin.country);
      if (existing) {
        existing.wineCount += origin.wineCount;
        existing.totalBottles += origin.totalBottles;
        return;
      }

      countryStats.set(origin.country, {
        wineCount: origin.wineCount,
        totalBottles: origin.totalBottles,
      });
    });

    const groupedRegions = new Map<string, WineRegion[]>();
    wineRegions.forEach((region) => {
      const regions = groupedRegions.get(region.country);
      if (regions) {
        regions.push(region);
        return;
      }
      groupedRegions.set(region.country, [region]);
    });

    // Country markers aggregate cellar totals while keeping the geometry anchored
    // to the full region catalog for stable zoom transitions.
    return Array.from(groupedRegions.entries())
      .map(([country, regions]) => {
        const bounds = getBoundsForRegions(regions)!;
        const center = bounds.getCenter();
        const typicalWineTypes = sortWineTypes(Array.from(new Set(
          regions.flatMap((region) => getWineStylesForRegion(region))
        )));
        const stats = countryStats.get(country);

        return {
          country,
          regions,
          wineCount: stats?.wineCount || 0,
          totalBottles: stats?.totalBottles || 0,
          typicalWineTypes,
          bounds,
          center: [center.lat, center.lng] as [number, number],
        };
      })
      .filter((summary) => {
        if (filterCountry !== "all" && summary.country !== filterCountry) return false;
        if (activeWineType && !summary.typicalWineTypes.includes(activeWineType)) return false;
        return true;
      })
      .sort((a, b) =>
        b.wineCount - a.wineCount ||
        b.totalBottles - a.totalBottles ||
        a.country.localeCompare(b.country, "de")
      );
  }, [activeWineType, filterCountry, filteredCellarOrigins]);

  const filteredRegionSummariesById = useMemo(
    () => new Map(filteredRegionSummaries.map((summary) => [summary.region.id, summary])),
    [filteredRegionSummaries],
  );

  const isCountryMarkerView = filterCountry === "all" && mapZoom <= COUNTRY_MARKER_MAX_ZOOM;

  useEffect(() => {
    if (!selectedRegion) return;

    const isSelectedRegionVisible = filteredRegionSummaries.some(({ region }) => region.id === selectedRegion.id);
    if (!isSelectedRegionVisible) {
      setSelectedRegion(null);
    }
  }, [filteredRegionSummaries, selectedRegion]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      minZoom: 2,
      maxZoom: 8,
      worldCopyJump: true,
      zoomControl: true,
    });

    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    const handleZoomEnd = () => setMapZoom(map.getZoom());

    markersLayerRef.current = L.layerGroup().addTo(map);
    map.on("zoomend", handleZoomEnd);
    mapRef.current = map;
    setMapZoom(map.getZoom());

    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      markersLayerRef.current?.clearLayers();
      markersLayerRef.current = null;
      map.off("zoomend", handleZoomEnd);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Low zoom levels emphasize cellar distribution by country; once zoomed in,
    // the map swaps to per-region markers without changing the underlying data.
    if (isCountryMarkerView) {
      countrySummaries.forEach((summary) => {
        const hasWines = summary.wineCount > 0;
        const marker = L.circleMarker(summary.center, {
          radius: getMarkerRadius(summary.wineCount),
          color: hasWines ? "hsl(43, 60%, 65%)" : "hsl(20, 10%, 36%)",
          weight: hasWines ? 2.5 : 1.5,
          fillColor: hasWines ? "hsl(352, 55%, 32%)" : "hsl(20, 10%, 24%)",
          fillOpacity: hasWines ? 0.88 : 0.45,
        });

        if (hasWines) {
          marker.bindTooltip(String(summary.wineCount), {
            permanent: true,
            direction: "top",
            offset: [0, -10],
            className: "wine-map-count-tooltip",
          });
        }

        marker.bindPopup(`
          <div class="text-sm">
            <strong>${summary.country}</strong><br />
            ${summary.wineCount} Weine · ${summary.totalBottles} Flaschen
          </div>
        `);

        marker.on("click", () => {
          setSelectedRegion(null);
          map.fitBounds(summary.bounds.pad(0.25), { maxZoom: 6 });
        });

        marker.addTo(markersLayer);
      });

      return;
    }

    filteredRegionSummaries.forEach((summary) => {
      const hasWines = summary.wineCount > 0;
      const isSelected = selectedRegion?.id === summary.region.id;
      const marker = L.circleMarker(toLeafletLatLng(summary.region.coordinates), {
        radius: getMarkerRadius(summary.wineCount, isSelected),
        color: isSelected ? "hsl(43, 60%, 65%)" : "hsl(20, 10%, 8%)",
        weight: isSelected ? 3 : hasWines ? 2 : 1.25,
        fillColor: summary.region.color,
        fillOpacity: hasWines ? 0.95 : 0.38,
      });

      if (hasWines) {
        marker.bindTooltip(String(summary.wineCount), {
          permanent: true,
          direction: "top",
          offset: [0, -8],
          className: "wine-map-count-tooltip",
        });
      }

      marker.bindPopup(`
        <div class="text-sm">
          <strong>${summary.region.name}</strong><br />
          ${summary.region.country}<br />
          ${summary.wineCount} Weine · ${summary.totalBottles} Flaschen
        </div>
      `);

      marker.on("click", () => setSelectedRegion(summary.region));
      marker.addTo(markersLayer);
    });
  }, [countrySummaries, filteredRegionSummaries, isCountryMarkerView, selectedRegion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (filterCountry !== "all") {
      const countrySummary = countrySummaries.find((summary) => summary.country === filterCountry);
      if (countrySummary) {
        map.fitBounds(countrySummary.bounds.pad(0.25), { maxZoom: 6 });
        return;
      }
    }

    if (filterWineType !== "all") {
      const bounds = getBoundsForRegions(filteredRegionSummaries.map((summary) => summary.region));
      if (bounds) {
        map.fitBounds(bounds.pad(0.4), { maxZoom: 4 });
        return;
      }
    }

    map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
  }, [countrySummaries, filterCountry, filterWineType, filteredRegionSummaries]);

  const selectedRegionSummary = selectedRegion ? filteredRegionSummariesById.get(selectedRegion.id) : null;

  return (
    <AppLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">Weinregionen</h1>
        <p className="text-muted-foreground font-body mt-1">
          Alle Regionen bleiben sichtbar. Herausgezoomt siehst du deine Kelleranzahl pro Land, hineingezoomt pro Region.
        </p>
      </div>

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
            {countries.map((country) => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
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
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-3 py-1 text-xs font-body text-muted-foreground">
          <MapIcon className="w-3.5 h-3.5" />
          {isCountryMarkerView ? "Länderansicht" : "Regionsansicht"}
        </span>
        <span className="text-xs text-muted-foreground font-body ml-auto">
          {filteredRegionSummaries.length} Regionen · {unmappedOrigins.length} nicht zugeordnet
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] items-start animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="relative">
            <div ref={mapContainerRef} className="wine-map-leaflet h-[380px] sm:h-[460px] lg:h-[520px] w-full" />
            {filteredRegionSummaries.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
                <p className="rounded-full bg-card/95 px-4 py-2 text-sm font-body text-muted-foreground shadow-sm">
                  Keine Regionen für diese Filter
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {selectedRegion && selectedRegionSummary ? (
            <RegionDetail
              summary={selectedRegionSummary}
              onClose={() => setSelectedRegion(null)}
            />
          ) : (
            <RegionList
              regions={filteredRegionSummaries}
              onSelect={setSelectedRegion}
            />
          )}
          <UnmappedOriginList origins={unmappedOrigins} />
        </div>
      </div>
    </AppLayout>
  );
};

function RegionDetail({
  summary,
  onClose,
}: {
  summary: RegionSummary;
  onClose: () => void;
}) {
  const { region, wines, wineCount, totalBottles, cellarWineTypes, typicalWineTypes } = summary;
  const producerCount = new Set(wines.map((wine) => wine.producer)).size;

  return (
    <div className="glass-card p-4 sm:p-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl sm:text-[2rem] leading-tight font-display font-bold text-foreground">{region.name}</h2>
          <p className="text-base sm:text-lg text-foreground/60 font-body mt-1">{region.country}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary text-foreground/55 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <SummaryStat label="Meine Weine" value={String(wineCount)} />
        <SummaryStat label="Flaschen" value={String(totalBottles)} />
        <SummaryStat label="Produzenten" value={String(producerCount)} />
        <SummaryStat label="Meine Weinarten" value={String(cellarWineTypes.length)} />
      </div>

      <div className="mb-5">
        <h3 className={SECTION_TITLE_CLASS}>
          Typische Weinarten
        </h3>
        {typicalWineTypes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {typicalWineTypes.map((type) => (
              <span key={type} className={cn("inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-body font-medium leading-none shadow-sm", getRegionWineTypeChipClass(type))}>
                {getWineTypeLabel(type)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/60 font-body italic">Für diese Region sind noch keine typischen Weinarten hinterlegt</p>
        )}
      </div>

      {cellarWineTypes.length > 0 && (
        <div className="mb-5">
          <h3 className={SECTION_TITLE_CLASS}>
            In meinem Keller
          </h3>
          <div className="flex flex-wrap gap-2">
            {cellarWineTypes.map((type) => (
              <span key={type} className={cn("inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-body font-medium leading-none shadow-sm", getRegionWineTypeChipClass(type))}>
                {getWineTypeLabel(type)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-5">
        <h3 className={SECTION_TITLE_CLASS}>
          Eigenschaften
        </h3>
        <div className="flex flex-wrap gap-2">
          {region.characteristics.map((characteristic) => (
            <span key={characteristic} className={cn("inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-body font-medium leading-none shadow-sm", getRegionMetaChipClass("characteristic"))}>
              {characteristic}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <h3 className={SECTION_TITLE_CLASS}>
          <Grape className="w-3 h-3 inline mr-1" /> Wichtigste Trauben
        </h3>
        <div className="flex flex-wrap gap-2">
          {region.grapes.map((grape) => (
            <span key={grape} className={cn("inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-body font-medium leading-none shadow-sm", getRegionMetaChipClass("grape"))}>
              {grape}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className={SECTION_TITLE_CLASS}>
          <WineIcon className="w-3 h-3 inline mr-1" /> Meine Weine ({wineCount})
        </h3>
        {wines.length > 0 ? (
          <div className="space-y-2">
            {wines.map((wine) => (
              <div key={wine.id} className="p-3 sm:p-3.5 rounded-xl bg-secondary/55 border border-border/60 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-body font-medium text-foreground">{wine.name}</p>
                    <p className="text-xs text-muted-foreground font-body">{wine.producer} · {wine.vintage}</p>
                  </div>
                  <span className={cn("shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-body font-semibold leading-none shadow-sm", getRegionWineTypeChipClass(wine.type))}>
                    {getWineTypeLabel(wine.type)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-foreground/65 font-body">
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
          <p className="text-sm text-muted-foreground/50 font-body italic">Noch keine Weine aus dieser Region im Keller</p>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-secondary/80 to-card px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm">
      <p className="text-[11px] font-body font-medium uppercase tracking-[0.16em] text-foreground/55">{label}</p>
      <p className="mt-2 text-2xl sm:text-[1.9rem] leading-none font-display font-semibold text-foreground">{value}</p>
    </div>
  );
}

function RegionList({
  regions,
  onSelect,
}: {
  regions: RegionSummary[];
  onSelect: (region: WineRegion) => void;
}) {
  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-display font-bold mb-3">Alle Regionen</h2>
      {regions.length > 0 ? (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
          {regions.map((summary) => (
            <button
              key={summary.region.id}
              onClick={() => onSelect(summary.region)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/80 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-body font-medium text-foreground truncate">{summary.region.name}</p>
                  <p className="text-xs text-muted-foreground font-body truncate">{summary.region.country}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-body font-semibold text-foreground">{summary.wineCount} Weine</p>
                <p className="text-[11px] font-body text-foreground/60">{summary.totalBottles} Fl.</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground font-body">
          Für diese Filter gibt es keine passenden Regionen.
        </p>
      )}
    </div>
  );
}

function UnmappedOriginList({ origins }: { origins: CellarOriginGroup[] }) {
  if (origins.length === 0) return null;

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-display font-bold mb-1">Nicht Zugeordnet</h2>
      <p className="text-xs text-muted-foreground font-body mb-3">
        Diese Keller-Ursprünge haben noch keinen passenden Eintrag in der Kartenabdeckung.
      </p>
      <div className="space-y-2">
        {origins.map((origin) => (
          <div
            key={origin.key}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-secondary/40 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-body font-medium text-foreground truncate">{origin.region}</p>
              <p className="text-xs text-muted-foreground font-body truncate">{origin.country}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-body font-semibold text-foreground">{origin.wineCount} Weine</p>
              <p className="text-[11px] font-body text-foreground/60">{origin.totalBottles} Fl.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WineMap;
