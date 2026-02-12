import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { WineCard } from "@/components/WineCard";
import { mockWines, getDrinkStatus } from "@/data/wines";
import { Wine, Grape, Clock, TrendingUp, Sparkles } from "lucide-react";

const Index = () => {
  const totalBottles = mockWines.reduce((sum, w) => sum + w.quantity, 0);
  const totalValue = mockWines.reduce((sum, w) => sum + w.quantity * w.purchasePrice, 0);
  const readyToDrink = mockWines.filter((w) => getDrinkStatus(w).label === "Trinkreif");
  const avgRating = mockWines.filter(w => w.rating).reduce((sum, w) => sum + (w.rating || 0), 0) / mockWines.filter(w => w.rating).length;

  return (
    <AppLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
          Willkommen bei <span className="text-gradient-gold">VinVault</span>
        </h1>
        <p className="text-muted-foreground font-body mt-2">
          Dein persönlicher Weinkeller auf einen Blick
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Wine} label="Flaschen" value={totalBottles} sub={`${mockWines.length} verschiedene Weine`} index={0} />
        <StatCard icon={TrendingUp} label="Kellerwert" value={`CHF ${totalValue.toLocaleString()}`} index={1} />
        <StatCard icon={Clock} label="Trinkreif" value={readyToDrink.length} sub="Weine bereit zum Genuss" index={2} />
        <StatCard icon={Grape} label="Ø Rating" value={avgRating.toFixed(1)} sub="Durchschnittsbewertung" index={3} />
      </div>

      {/* Ready to drink */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-wine-gold" />
          <h2 className="text-xl font-display font-semibold">Jetzt trinkreif</h2>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {readyToDrink.slice(0, 3).map((wine, i) => (
            <WineCard key={wine.id} wine={wine} index={i} />
          ))}
        </div>
      </div>

      {/* Recent additions */}
      <div>
        <h2 className="text-xl font-display font-semibold mb-4">Zuletzt hinzugefügt</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockWines.slice(0, 3).map((wine, i) => (
            <WineCard key={wine.id} wine={wine} index={i} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
