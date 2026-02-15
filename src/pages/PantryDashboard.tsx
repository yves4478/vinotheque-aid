import { useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { usePantryStore } from "@/hooks/usePantryStore";
import { getExpiryStatus } from "@/data/pantry";
import { useWineStore } from "@/hooks/useWineStore";
import { Package, AlertTriangle, TrendingUp, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const PantryDashboard = () => {
  const { items } = usePantryStore();
  const { settings } = useWineStore();

  useEffect(() => {
    document.title = `Vorratskammer – ${settings.cellarName}`;
  }, [settings.cellarName]);

  const stats = useMemo(() => {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalValue = items.reduce((sum, i) => sum + i.quantity * i.purchasePrice, 0);
    const expiringSoon = items.filter((i) => {
      const status = getExpiryStatus(i);
      return status.label === "Abgelaufen" || (status.label.includes("Tage") && parseInt(status.label) <= 7);
    });
    const locations = [...new Set(items.map((i) => i.location).filter(Boolean))];
    const categories = items.reduce<Record<string, number>>((acc, i) => {
      const cat = i.category || "Sonstiges";
      acc[cat] = (acc[cat] || 0) + i.quantity;
      return acc;
    }, {});
    const recentlyAdded = [...items].slice(0, 5);
    return { totalItems, totalValue, expiringSoon, locations, categories, recentlyAdded };
  }, [items]);

  return (
    <AppLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
          <span className="text-gradient-gold">Vorratskammer</span>
        </h1>
        <p className="text-muted-foreground font-body mt-2">
          Dein Hausvorrat auf einen Blick
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Artikel" value={stats.totalItems} sub={`${items.length} verschiedene Produkte`} index={0} />
        <StatCard icon={TrendingUp} label="Vorratswert" value={`CHF ${stats.totalValue.toLocaleString()}`} index={1} />
        <StatCard icon={AlertTriangle} label="Ablaufend" value={stats.expiringSoon.length} sub="Bald ablaufende Artikel" index={2} />
        <StatCard icon={MapPin} label="Lagerorte" value={stats.locations.length} sub="Verschiedene Orte" index={3} />
      </div>

      {/* Expiring soon */}
      {stats.expiringSoon.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-display font-semibold">Bald ablaufend</h2>
          </div>
          <div className="space-y-3">
            {stats.expiringSoon.map((item, i) => {
              const status = getExpiryStatus(item);
              return (
                <div
                  key={item.id}
                  className="glass-card p-4 flex items-center gap-4 animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {item.category} · {item.location}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-body font-medium">{item.quantity} {item.unit}</p>
                    <p className={cn("text-xs font-body font-medium", status.color)}>{status.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories breakdown */}
      {Object.keys(stats.categories).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-display font-semibold mb-4">Nach Kategorie</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(stats.categories)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count], i) => (
                <div
                  key={category}
                  className="glass-card p-4 animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">{category}</p>
                  <p className="text-2xl font-display font-bold mt-1">{count}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recently added */}
      {stats.recentlyAdded.length > 0 && (
        <div>
          <h2 className="text-xl font-display font-semibold mb-4">Zuletzt hinzugefügt</h2>
          <div className="space-y-3">
            {stats.recentlyAdded.map((item, i) => (
              <div
                key={item.id}
                className="glass-card p-4 flex items-center gap-4 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-body">
                    {item.category} · {item.location}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-body font-medium">{item.quantity} {item.unit}</p>
                  <p className="text-xs text-muted-foreground font-body">CHF {item.purchasePrice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-body">Noch keine Artikel in der Vorratskammer</p>
          <p className="text-sm text-muted-foreground/60 font-body mt-1">
            Füge deinen ersten Artikel über "Inventar" hinzu
          </p>
        </div>
      )}
    </AppLayout>
  );
};

export default PantryDashboard;
