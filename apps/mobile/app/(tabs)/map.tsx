import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { FeatureUnavailableCard } from "@/components/FeatureUnavailableCard";
import { formatIntegerForLocale } from "@/lib/localeFormat";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { useAppRuntime } from "@/providers/AppRuntimeProvider";
import { useWineStore } from "@/store/useWineStore";
import {
  getWineRegionGuide,
  getWineStylesForRegion,
  getWineTypeLabel,
  matchWineOriginToRegion,
  wineRegions,
} from "@vinotheque/core";
import type { Wine, WineRegion, WineType } from "@vinotheque/core";

const WINE_TYPE_OPTIONS: SelectOption[] = [
  { value: "all", label: "Alle Weintypen" },
  { value: "rot", label: "Rotwein" },
  { value: "weiss", label: "Weisswein" },
  { value: "rosé", label: "Rosé" },
  { value: "schaumwein", label: "Schaumwein" },
  { value: "dessert", label: "Dessertwein" },
];

interface RegionSummary {
  region: WineRegion;
  wines: Wine[];
  wineCount: number;
  totalBottles: number;
  typicalTypes: WineType[];
}

function project([lng, lat]: [number, number], width: number, height: number) {
  return {
    x: ((lng + 180) / 360) * width,
    y: ((90 - lat) / 180) * height,
  };
}

function markerColor(types: WineType[]): string {
  if (types.includes("rot")) return "#8B1A1A";
  if (types.includes("rosé")) return "#be5570";
  if (types.includes("schaumwein")) return "#4f8faf";
  if (types.includes("dessert")) return "#b98b1d";
  return "#c8956c";
}

export default function WineMapScreen() {
  const { wines } = useWineStore();
  const { isFeatureEnabled } = useAppRuntime();
  const { width: screenWidth } = useWindowDimensions();
  const [countryFilter, setCountryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  if (!isFeatureEnabled("map")) {
    return (
      <FeatureUnavailableCard
        title="Weinweltkarte"
        description="Diese Funktion bleibt geparkt, bis sie ueber iOS, PWA, Web und Backend gemeinsam ausgerollt ist."
      />
    );
  }

  const mapWidth = Math.min(Math.max(screenWidth - 32, 320), 720);
  const mapHeight = mapWidth * 0.54;
  const activeType = typeFilter === "all" ? null : (typeFilter as WineType);

  const countryOptions = useMemo<SelectOption[]>(() => {
    const countries = Array.from(new Set(wineRegions.map((region) => region.country)))
      .sort((a, b) => a.localeCompare(b, "de"));
    return [{ value: "all", label: "Alle Länder" }, ...countries.map((country) => ({ value: country, label: country }))];
  }, []);

  const inventoryByRegion = useMemo(() => {
    const inventory = new Map<string, { wines: Wine[]; wineCount: number; totalBottles: number }>();

    wines.forEach((wine) => {
      if (activeType && wine.type !== activeType) return;
      const region = matchWineOriginToRegion({ country: wine.country, region: wine.region });
      if (!region) return;

      const existing = inventory.get(region.id);
      if (existing) {
        existing.wines.push(wine);
        existing.wineCount += 1;
        existing.totalBottles += wine.quantity;
        return;
      }

      inventory.set(region.id, {
        wines: [wine],
        wineCount: 1,
        totalBottles: wine.quantity,
      });
    });

    return inventory;
  }, [activeType, wines]);

  const summaries = useMemo<RegionSummary[]>(() => (
    wineRegions
      .map((region) => {
        const inventory = inventoryByRegion.get(region.id);
        return {
          region,
          wines: inventory?.wines ?? [],
          wineCount: inventory?.wineCount ?? 0,
          totalBottles: inventory?.totalBottles ?? 0,
          typicalTypes: getWineStylesForRegion(region),
        };
      })
      .filter((summary) => {
        if (countryFilter !== "all" && summary.region.country !== countryFilter) return false;
        if (activeType && !summary.typicalTypes.includes(activeType)) return false;
        return true;
      })
      .sort((a, b) =>
        b.wineCount - a.wineCount ||
        b.totalBottles - a.totalBottles ||
        a.region.country.localeCompare(b.region.country, "de") ||
        a.region.name.localeCompare(b.region.name, "de")
      )
  ), [activeType, countryFilter, inventoryByRegion]);

  const selectedSummary = summaries.find((summary) => summary.region.id === selectedRegionId) ?? summaries[0];
  const maxCount = Math.max(1, ...summaries.map((summary) => summary.wineCount));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Weinweltkarte</Text>
      <Text style={styles.subtitle}>Regionen, typische Stile und dein Kellerbestand auf einen Blick.</Text>

      <View style={styles.filters}>
        <View style={styles.filterField}>
          <SelectField
            label="Land"
            value={countryFilter}
            onValueChange={(value) => {
              setCountryFilter(value);
              setSelectedRegionId(null);
            }}
            options={countryOptions}
            testID="map-country-select"
          />
        </View>
        <View style={styles.filterField}>
          <SelectField
            label="Weintyp"
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setSelectedRegionId(null);
            }}
            options={WINE_TYPE_OPTIONS}
            testID="map-type-select"
          />
        </View>
      </View>

      <View style={styles.mapShell}>
        <Svg width={mapWidth} height={mapHeight}>
          <Rect x={0} y={0} width={mapWidth} height={mapHeight} rx={12} fill="#f3eee9" />
          {[60, 120, 180, 240, 300].map((lng) => (
            <Line
              key={`lng-${lng}`}
              x1={(lng / 360) * mapWidth}
              y1={0}
              x2={(lng / 360) * mapWidth}
              y2={mapHeight}
              stroke="#dfd4ce"
              strokeWidth={1}
            />
          ))}
          {[45, 90, 135].map((lat) => (
            <Line
              key={`lat-${lat}`}
              x1={0}
              y1={(lat / 180) * mapHeight}
              x2={mapWidth}
              y2={(lat / 180) * mapHeight}
              stroke="#dfd4ce"
              strokeWidth={1}
            />
          ))}
          <Path d="M28 58 C48 33 91 24 118 42 C138 55 128 78 103 82 C80 87 52 80 28 58 Z" fill="#e2d7d1" />
          <Path d="M112 92 C129 111 126 145 109 171 C91 149 84 118 96 96 Z" fill="#e2d7d1" />
          <Path d="M164 52 C205 33 270 39 334 72 C300 91 230 90 183 76 C164 71 151 62 164 52 Z" fill="#e2d7d1" />
          <Path d="M180 84 C206 87 219 112 209 145 C191 138 174 113 180 84 Z" fill="#e2d7d1" />
          <Path d="M285 134 C305 122 331 128 342 145 C321 156 296 152 285 134 Z" fill="#e2d7d1" />
          <Path d="M85 30 C101 17 126 18 138 31 C121 38 102 38 85 30 Z" fill="#e2d7d1" />

          {summaries.map((summary) => {
            const { x, y } = project(summary.region.coordinates, mapWidth, mapHeight);
            const selected = selectedSummary?.region.id === summary.region.id;
            const radius = 4 + (summary.wineCount / maxCount) * 8 + (selected ? 2 : 0);
            const hasWine = summary.wineCount > 0;
            return (
              <Circle
                key={summary.region.id}
                cx={x}
                cy={y}
                r={radius}
                fill={hasWine ? markerColor(summary.typicalTypes) : "#9b8f89"}
                fillOpacity={hasWine ? 0.92 : 0.52}
                stroke={selected ? "#1a0500" : "#fff"}
                strokeWidth={selected ? 2.5 : 1.5}
                onPress={() => setSelectedRegionId(summary.region.id)}
              />
            );
          })}

          {summaries
            .filter((summary) => summary.wineCount > 0)
            .map((summary) => {
              const { x, y } = project(summary.region.coordinates, mapWidth, mapHeight);
              return (
                <SvgText
                  key={`count-${summary.region.id}`}
                  x={x}
                  y={y + 3}
                  fontSize={9}
                  fontWeight="700"
                  fill="#fff"
                  textAnchor="middle"
                >
                  {formatIntegerForLocale(summary.wineCount)}
                </SvgText>
              );
            })}
        </Svg>
      </View>

      {selectedSummary && <RegionDetail summary={selectedSummary} />}

      <Text style={styles.sectionTitle}>Regionen</Text>
      {summaries.slice(0, 40).map((summary) => (
        <TouchableOpacity
          key={summary.region.id}
          style={styles.regionRow}
          onPress={() => setSelectedRegionId(summary.region.id)}
        >
          <View style={[styles.markerDot, { backgroundColor: markerColor(summary.typicalTypes) }]} />
          <View style={styles.regionText}>
            <Text style={styles.regionName}>{summary.region.name}</Text>
            <Text style={styles.regionMeta}>{summary.region.country} · {summary.typicalTypes.map(getWineTypeLabel).join(", ")}</Text>
          </View>
          <Text style={styles.regionCount}>
            {formatIntegerForLocale(summary.wineCount)} / {formatIntegerForLocale(summary.totalBottles)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function RegionDetail({ summary }: { summary: RegionSummary }) {
  const guide = getWineRegionGuide(summary.region);

  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailEyebrow}>{summary.region.country}</Text>
      <Text style={styles.detailTitle}>{summary.region.name}</Text>
      <Text style={styles.detailText}>
        {formatIntegerForLocale(summary.wineCount)} Weine · {formatIntegerForLocale(summary.totalBottles)} Flaschen in deinem Keller
      </Text>
      <Text style={styles.detailLabel}>Trauben</Text>
      <Text style={styles.detailText}>{summary.region.grapes.join(", ")}</Text>
      <Text style={styles.detailLabel}>Charakter</Text>
      <Text style={styles.detailText}>{summary.region.characteristics.join(", ")}</Text>
      {guide && (
        <>
          <Text style={styles.detailLabel}>Guide</Text>
          <Text style={styles.detailText}>{guide.summary}</Text>
        </>
      )}
      {summary.wines.length > 0 && (
        <>
          <Text style={styles.detailLabel}>Deine Weine</Text>
          {summary.wines.slice(0, 4).map((wine) => (
            <Text key={wine.id} style={styles.wineLine}>
              {wine.name} · {wine.producer} · {formatIntegerForLocale(wine.quantity)} Fl.
            </Text>
          ))}
        </>
      )}
    </View>
  );
}

const WINE_RED = "#8B1A1A";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5" },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: "900", color: "#1a0500" },
  subtitle: { color: "#7c706b", marginTop: 4, lineHeight: 20, marginBottom: 16 },
  filters: { flexDirection: "row", gap: 10, marginBottom: 14 },
  filterField: { flex: 1 },
  mapShell: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e6dcd7",
    alignItems: "center",
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6dcd7",
    padding: 14,
    marginTop: 14,
  },
  detailEyebrow: { color: WINE_RED, fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  detailTitle: { color: "#1a0500", fontSize: 20, fontWeight: "900", marginTop: 2 },
  detailLabel: { color: WINE_RED, fontSize: 12, fontWeight: "900", marginTop: 12, marginBottom: 4 },
  detailText: { color: "#443936", lineHeight: 20 },
  wineLine: { color: "#443936", lineHeight: 20, fontWeight: "600" },
  sectionTitle: { fontSize: 12, fontWeight: "900", color: WINE_RED, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  regionRow: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6dcd7",
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  markerDot: { width: 12, height: 12, borderRadius: 6 },
  regionText: { flex: 1 },
  regionName: { color: "#1a0500", fontWeight: "900" },
  regionMeta: { color: "#7c706b", fontSize: 12, marginTop: 2 },
  regionCount: { color: WINE_RED, fontWeight: "900", fontSize: 12 },
});
