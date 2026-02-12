import { AppLayout } from "@/components/AppLayout";
import { mockWines } from "@/data/wines";
import { Star, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ratedWines = mockWines.filter(w => w.personalRating);
const unratedWines = mockWines.filter(w => !w.personalRating);

const Ratings = () => {
  return (
    <AppLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">Bewertungen</h1>
        <p className="text-muted-foreground font-body mt-1">
          {ratedWines.length} bewertet · {unratedWines.length} offen
        </p>
      </div>

      {/* Pending ratings */}
      {unratedWines.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-wine-gold" />
            Bewertung ausstehend
          </h2>
          <div className="space-y-3">
            {unratedWines.map((wine, i) => (
              <div
                key={wine.id}
                className="glass-card p-4 flex items-center gap-4 border-wine-gold/10 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm">{wine.name}</p>
                  <p className="text-xs text-muted-foreground font-body">
                    {wine.producer} · {wine.vintage}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} className="hover:scale-125 transition-transform">
                      <Star className="w-5 h-5 text-muted-foreground/20 hover:text-wine-gold hover:fill-wine-gold transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rated wines */}
      <h2 className="text-lg font-display font-semibold mb-3">Deine Bewertungen</h2>
      <div className="space-y-3">
        {ratedWines.map((wine, i) => (
          <div
            key={wine.id}
            className="glass-card p-4 flex items-center gap-4 animate-fade-in"
            style={{ animationDelay: `${(i + unratedWines.length) * 80}ms` }}
          >
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm">{wine.name}</p>
              <p className="text-xs text-muted-foreground font-body">
                {wine.producer} · {wine.vintage}
              </p>
              {wine.notes && (
                <p className="text-xs text-muted-foreground/60 font-body italic mt-1">„{wine.notes}"</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={cn(
                      "w-4 h-4",
                      j < (wine.personalRating || 0) ? "fill-wine-gold text-wine-gold" : "text-muted-foreground/20"
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {wine.rating && (
                  <span className="text-xs text-muted-foreground font-body">Kritiker: {wine.rating}/100</span>
                )}
                <button className="text-xs text-primary hover:text-primary/80 font-body flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Nachkaufen?
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Ratings;
