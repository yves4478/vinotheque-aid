import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWineStore } from "@/hooks/useWineStore";
import { useToast } from "@/hooks/use-toast";

const Ratings = () => {
  const { wines, updateWine } = useWineStore();
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = useState<{ wineId: string; stars: number } | null>(null);

  const ratedWines = wines.filter(w => w.personalRating);
  const unratedWines = wines.filter(w => !w.personalRating);

  const handleRate = (wineId: string, stars: number) => {
    const wine = wines.find(w => w.id === wineId);
    if (!wine) return;
    updateWine(wineId, { personalRating: stars });
    toast({ title: "Bewertung gespeichert", description: `${wine.name} – ${stars} Stern${stars > 1 ? "e" : ""}` });
  };

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
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starValue = i + 1;
                    const isHovered = hoverRating?.wineId === wine.id && starValue <= hoverRating.stars;
                    return (
                      <button
                        key={i}
                        className="hover:scale-125 transition-transform"
                        onMouseEnter={() => setHoverRating({ wineId: wine.id, stars: starValue })}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => handleRate(wine.id, starValue)}
                      >
                        <Star className={cn(
                          "w-5 h-5 transition-colors",
                          isHovered ? "text-wine-gold fill-wine-gold" : "text-muted-foreground/20"
                        )} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rated wines */}
      {ratedWines.length > 0 && (
        <>
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
                    <p className="text-xs text-muted-foreground/60 font-body italic mt-1">&bdquo;{wine.notes}&ldquo;</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => {
                      const starValue = j + 1;
                      const isHovered = hoverRating?.wineId === wine.id && starValue <= hoverRating.stars;
                      const isFilled = j < (wine.personalRating || 0);
                      return (
                        <button
                          key={j}
                          className="hover:scale-110 transition-transform"
                          onMouseEnter={() => setHoverRating({ wineId: wine.id, stars: starValue })}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => handleRate(wine.id, starValue)}
                        >
                          <Star
                            className={cn(
                              "w-4 h-4 transition-colors",
                              isHovered
                                ? "fill-wine-gold text-wine-gold"
                                : isFilled
                                  ? "fill-wine-gold text-wine-gold"
                                  : "text-muted-foreground/20"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                  {wine.rating && (
                    <span className="text-xs text-muted-foreground font-body">Kritiker: {wine.rating}/100</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default Ratings;
