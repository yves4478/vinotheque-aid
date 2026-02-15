import { Link } from "react-router-dom";
import { Wine, Package, ArrowRight } from "lucide-react";
import { useWineStore } from "@/hooks/useWineStore";
import { usePantryStore } from "@/hooks/usePantryStore";

const Home = () => {
  const { totalBottles, wines, settings } = useWineStore();
  const { totalItems, items } = usePantryStore();

  const totalWineValue = wines.reduce((sum, w) => sum + w.quantity * w.purchasePrice, 0);
  const totalPantryValue = items.reduce((sum, i) => sum + i.quantity * i.purchasePrice, 0);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground">
            Willkommen bei <span className="text-gradient-gold">{settings.cellarName}</span>
          </h1>
          <p className="text-muted-foreground font-body mt-3 text-lg">
            Wähle deinen Bereich
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Wine Cellar Tile */}
          <Link
            to="/wine"
            className="group glass-card p-8 hover:border-primary/50 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors wine-glow">
                <Wine className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                  Weinkeller
                </h2>
                <p className="text-sm text-muted-foreground font-body">Deine Weinsammlung verwalten</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-3xl font-display font-bold text-foreground">{totalBottles}</p>
                <p className="text-xs text-muted-foreground font-body">Flaschen</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-foreground">
                  CHF {totalWineValue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground font-body">Kellerwert</p>
              </div>
            </div>

            <div className="flex items-center text-sm text-primary font-body font-medium group-hover:gap-3 gap-2 transition-all">
              Zum Weinkeller <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Pantry Tile */}
          <Link
            to="/pantry"
            className="group glass-card p-8 hover:border-accent/50 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 transition-colors gold-glow">
                <Package className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground group-hover:text-accent transition-colors">
                  Vorratskammer
                </h2>
                <p className="text-sm text-muted-foreground font-body">Deinen Hausvorrat verwalten</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-3xl font-display font-bold text-foreground">{totalItems}</p>
                <p className="text-xs text-muted-foreground font-body">Artikel</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-foreground">
                  CHF {totalPantryValue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground font-body">Vorratswert</p>
              </div>
            </div>

            <div className="flex items-center text-sm text-accent font-body font-medium group-hover:gap-3 gap-2 transition-all">
              Zur Vorratskammer <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
