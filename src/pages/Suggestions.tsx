import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { getDrinkStatus } from "@/data/wines";
import { Lightbulb, Users, UtensilsCrossed, Wine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWineStore } from "@/hooks/useWineStore";

const Suggestions = () => {
  const { wines } = useWineStore();
  const readyWines = useMemo(() => wines.filter(w => getDrinkStatus(w).label === "Trinkreif"), [wines]);

  const mealSuggestions = useMemo(() => {
    const reds = readyWines.filter(w => w.type === "rot");
    const whites = readyWines.filter(w => w.type === "weiss");
    const sparkling = readyWines.filter(w => w.type === "schaumwein");

    const suggestions = [];
    if (reds.length > 0) {
      suggestions.push({
        meal: "Rindsfilet mit Trüffelsauce",
        guests: 4,
        wines: reds.slice(0, 2),
        reason: "Kräftige Rotweine mit guter Tanninstruktur passen perfekt zu Rindfleisch",
      });
    }
    if (whites.length > 0 || sparkling.length > 0) {
      suggestions.push({
        meal: "Fischplatte mit Meeresfrüchten",
        guests: 6,
        wines: [...whites.slice(0, 1), ...sparkling.slice(0, 1)].filter(Boolean),
        reason: "Frische Weissweine und Schaumwein ergänzen die Meeresaromen ideal",
      });
    }
    if (sparkling.length > 0) {
      suggestions.push({
        meal: "Aperitif zum Apéro",
        guests: 8,
        wines: sparkling.slice(0, 1),
        reason: "Eleganter Schaumwein für einen festlichen Start",
      });
    }
    return suggestions;
  }, [readyWines]);

  return (
    <AppLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">Weinvorschläge</h1>
        <p className="text-muted-foreground font-body mt-1">
          Empfehlungen basierend auf deinem Keller
        </p>
      </div>

      {/* Quick suggestion prompt */}
      <div className="glass-card p-6 mb-8 animate-fade-in border-wine-gold/20" style={{ animationDelay: "100ms" }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-wine-gold" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-semibold">Was gibt's zum Essen?</h2>
            <p className="text-sm text-muted-foreground font-body mt-1 mb-4">
              Beschreibe dein Essen, die Anzahl Gäste und den Anlass – wir finden den perfekten Wein.
            </p>
            <Button variant="gold">
              <Lightbulb className="w-4 h-4" />
              Wein empfehlen lassen
            </Button>
          </div>
        </div>
      </div>

      {/* Meal pairing suggestions */}
      {mealSuggestions.length > 0 && (
        <>
          <h2 className="text-xl font-display font-semibold mb-4">Passende Kombinationen</h2>
          <div className="space-y-4 mb-8">
            {mealSuggestions.map((s, i) => (
              <div
                key={i}
                className="glass-card p-5 animate-fade-in"
                style={{ animationDelay: `${(i + 2) * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold">{s.meal}</h3>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                        <Users className="w-3 h-3" /> {s.guests} Personen
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-body mb-3">{s.reason}</p>
                    <div className="flex flex-wrap gap-2">
                      {s.wines.map((w) => (
                        <span
                          key={w.id}
                          className="flex items-center gap-1.5 text-xs bg-secondary px-3 py-1.5 rounded-lg font-body"
                        >
                          <Wine className="w-3 h-3 text-primary" />
                          {w.name} {w.vintage}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Drink now */}
      <h2 className="text-xl font-display font-semibold mb-4">Jetzt geniessen</h2>
      {readyWines.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-3">
          {readyWines.map((wine, i) => (
            <div
              key={wine.id}
              className="glass-card p-4 flex items-center gap-3 animate-fade-in"
              style={{ animationDelay: `${(i + 5) * 80}ms` }}
            >
              <div className="w-8 h-8 rounded-lg bg-green-400/10 flex items-center justify-center">
                <Wine className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-semibold truncate">{wine.name}</p>
                <p className="text-xs text-muted-foreground font-body">{wine.producer} · {wine.vintage}</p>
              </div>
              <span className="text-xs text-green-400 font-body font-medium">Trinkreif</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center animate-fade-in">
          <Wine className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm">Aktuell sind keine Weine trinkreif</p>
        </div>
      )}
    </AppLayout>
  );
};

export default Suggestions;
