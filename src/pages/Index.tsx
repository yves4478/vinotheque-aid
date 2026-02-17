import { useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { WineCard } from "@/components/WineCard";
import { getDrinkStatus } from "@/data/wines";
import { useWineStore } from "@/hooks/useWineStore";
import { Wine, Grape, Clock, TrendingUp, Sparkles, GlassWater, Gem, Maximize2 } from "lucide-react";
import { getWineTypeColor, getWineTypeLabel } from "@/data/wines";

const Index = () => {
  const { wines, totalBottles, consumedWines, settings } = useWineStore();

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

  return (
    <AppLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
          Willkommen bei <span className="text-gradient-gold">{settings.cellarName}</span>
        </h1>
        <p className="text-muted-foreground font-body mt-2">
          Dein persönlicher Weinkeller auf einen Blick
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Wine} label="Flaschen" value={totalBottles} sub={`${wines.length} verschiedene Weine`} index={0} />
        <StatCard icon={TrendingUp} label="Kellerwert" value={`CHF ${stats.totalValue.toLocaleString()}`} index={1} />
        <StatCard icon={Clock} label="Trinkreif" value={stats.readyToDrink.length} sub="Weine bereit zum Genuss" index={2} />
        <StatCard icon={Grape} label="Ø Rating" value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "–"} sub="Durchschnittsbewertung" index={3} />
        <StatCard icon={Gem} label="Raritäten" value={stats.rarityCount} sub={`${stats.rarityWines} Weinschätze im Keller`} index={4} />
        <StatCard icon={Maximize2} label="Grossflaschen" value={stats.largeFormatCount} sub={`${stats.largeFormatWines} Weine in Magnum+`} index={5} />
      </div>

      {/* Ready to drink */}
      {stats.readyToDrink.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-wine-gold" />
            <h2 className="text-xl font-display font-semibold">Jetzt trinkreif</h2>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stats.readyToDrink.slice(0, 3).map((wine, i) => (
              <WineCard key={wine.id} wine={wine} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Recently consumed */}
      {consumedWines.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <GlassWater className="w-5 h-5 text-wine-rose" />
            <h2 className="text-xl font-display font-semibold">Zuletzt getrunken</h2>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {consumedWines.slice(0, 3).map((entry, i) => (
              <div
                key={entry.id}
                className="glass-card p-5 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-body ${getWineTypeColor(entry.type)}`}>
                      {getWineTypeLabel(entry.type)}
                    </span>
                    <h3 className="font-display text-lg font-semibold text-foreground truncate mt-2">
                      {entry.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-body mt-0.5">
                      {entry.producer} · {entry.vintage}
                    </p>
                    <p className="text-xs text-muted-foreground/70 font-body mt-2">
                      Getrunken am {new Date(entry.consumedDate).toLocaleDateString("de-CH")}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-wine-burgundy/10 flex items-center justify-center flex-shrink-0">
                    <GlassWater className="w-6 h-6 text-wine-rose" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent additions */}
      {stats.recentlyAdded.length > 0 && (
        <div>
          <h2 className="text-xl font-display font-semibold mb-4">Zuletzt hinzugefügt</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stats.recentlyAdded.map((wine, i) => (
              <WineCard key={wine.id} wine={wine} index={i} />
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Index;
