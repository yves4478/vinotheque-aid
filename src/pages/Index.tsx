import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PwaInstallCard } from "@/components/PwaInstallCard";
import { StatCard } from "@/components/StatCard";
import { WineCard } from "@/components/WineCard";
import { getDrinkStatus, type Wine as WineTypeModel } from "@/data/wines";
import { useWineStore } from "@/hooks/useWineStore";
import { Wine, Grape, Clock, TrendingUp, Sparkles, GlassWater, Gem, Maximize2 } from "lucide-react";
import { getWineTypeColor, getWineTypeLabel } from "@/data/wines";
import { formatCurrency } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const CHART_COLORS = ["#8B1A1A", "#c8956c", "#e8d5b0", "#4a7c59", "#2d5a8e"];

const Index = () => {
  const { wines, totalBottles, consumedWines, settings } = useWineStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${settings.cellarName} – Dein Weinkeller`;
  }, [settings.cellarName]);

  const stats = useMemo(() => {
    const totalValue = wines.reduce((sum, w) => sum + w.quantity * w.purchasePrice, 0);
    const readyToDrink = wines.filter((w) => getDrinkStatus(w).label === "Trinkreif");
    const winesWithRating = wines.filter(w => w.rating);
    const avgRating = winesWithRating.length > 0
      ? winesWithRating.reduce((sum, w) => sum + (w.rating || 0), 0) / winesWithRating.length
      : 0;
    const recentlyAdded = [...wines].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)).slice(0, 3);
    const rarities = wines.filter(w => w.isRarity);
    const rarityCount = rarities.reduce((sum, w) => sum + w.quantity, 0);
    const largeFormats = wines.filter(w => w.bottleSize && w.bottleSize !== "standard");
    const largeFormatCount = largeFormats.reduce((sum, w) => sum + w.quantity, 0);
    return { totalValue, readyToDrink, avgRating, recentlyAdded, rarityCount, rarityWines: rarities.length, largeFormatCount, largeFormatWines: largeFormats.length };
  }, [wines]);

  const drinkWindowStats = useMemo(() => {
    const counts = { trinkreif: 0, bald: 0, lagern: 0, ueberschritten: 0, unknown: 0 };
    for (const wine of wines) {
      counts[getDrinkStatus(wine).status]++;
    }
    return counts;
  }, [wines]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const wine of wines) {
      counts[wine.type] = (counts[wine.type] ?? 0) + wine.quantity;
    }
    return Object.entries(counts).map(([type, value]) => ({
      name: getWineTypeLabel(type as WineTypeModel["type"]),
      value,
    }));
  }, [wines]);

  return (
    <AppLayout>
      {/* Hero header */}
      <div className="mb-8 animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Übersicht</p>
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
          {settings.cellarName}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Dein persönlicher Weinkeller auf einen Blick
        </p>
      </div>

      <PwaInstallCard />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        <StatCard icon={Wine} label="Flaschen" value={totalBottles} sub={`${wines.length} verschiedene Weine`} index={0} />
        <StatCard icon={TrendingUp} label="Kellerwert" value={formatCurrency(stats.totalValue)} index={1} accent />
        <StatCard icon={Clock} label="Trinkreif" value={stats.readyToDrink.length} sub="Weine bereit zum Genuss" index={2} />
        <StatCard icon={Grape} label="Ø Tester-Rating" value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "–"} sub="Durchschnitt bekannter Tester" index={3} />
        <StatCard icon={Gem} label="Raritäten" value={stats.rarityCount} sub={`${stats.rarityWines} Weinschätze im Keller`} index={4} />
        <StatCard icon={Maximize2} label="Grossflaschen" value={stats.largeFormatCount} sub={`${stats.largeFormatWines} Weine in Magnum+`} index={5} />
        <StatCard icon={GlassWater} label="Getrunken" value={consumedWines.length} sub="Flaschen genossen" index={6} />
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-display font-semibold tracking-tight mb-3">Trinkreife</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { status: "trinkreif", label: "Jetzt ideal", count: drinkWindowStats.trinkreif, cls: "border-green-200 bg-green-50 dark:bg-green-950/20" },
            { status: "bald", label: "Bald trinken", count: drinkWindowStats.bald, cls: "border-orange-200 bg-orange-50 dark:bg-orange-950/20" },
            { status: "lagern", label: "Noch lagern", count: drinkWindowStats.lagern, cls: "border-amber-200 bg-amber-50 dark:bg-amber-950/20" },
            { status: "ueberschritten", label: "Über Höhepunkt", count: drinkWindowStats.ueberschritten, cls: "border-red-200 bg-red-50 dark:bg-red-950/20" },
          ].map((tile) => (
            <button
              key={tile.status}
              onClick={() => navigate(`/cellar?filter=${tile.status}`)}
              className={`rounded-lg border p-4 text-left transition-all hover:scale-[1.02] active:scale-100 ${tile.cls}`}
            >
              <p className="text-3xl font-bold">{tile.count}</p>
              <p className="text-sm text-muted-foreground mt-1">{tile.label}</p>
            </button>
          ))}
        </div>
      </section>

      {typeData.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-display font-semibold tracking-tight mb-3">Bestand nach Typ</h2>
          <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                  {typeData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Fl.`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1 min-w-0">
              {typeData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span>{entry.name}</span>
                  <span className="text-muted-foreground ml-auto">{entry.value} Fl.</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ready to drink */}
      {stats.readyToDrink.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-display font-semibold tracking-tight">Jetzt trinkreif</h2>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {stats.readyToDrink.slice(0, 3).map((wine, i) => (
              <WineCard key={wine.id} wine={wine} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Recently consumed */}
      {consumedWines.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <GlassWater className="w-4 h-4 text-wine-rose" />
            <h2 className="text-lg font-display font-semibold tracking-tight">Zuletzt getrunken</h2>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {consumedWines.slice(0, 3).map((entry, i) => (
              <div
                key={entry.id}
                className="apple-card p-4 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <GlassWater className="w-5 h-5 text-wine-rose" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getWineTypeColor(entry.type)}`}>
                      {getWineTypeLabel(entry.type)}
                    </span>
                    <h3 className="font-display text-base font-semibold text-foreground truncate mt-1.5">
                      {entry.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {entry.producer} &middot; {entry.vintage}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1.5">
                      Getrunken am {new Date(entry.consumedDate).toLocaleDateString("de-CH")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent additions */}
      {stats.recentlyAdded.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold tracking-tight mb-4">Zuletzt hinzugefügt</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {stats.recentlyAdded.map((wine, i) => (
              <WineCard key={wine.id} wine={wine} index={i} />
            ))}
          </div>
        </section>
      )}
    </AppLayout>
  );
};

export default Index;
