import { Wine, Star, Pencil, Trash2 } from "lucide-react";
import { type Wine as WineType, getWineTypeColor, getWineTypeLabel, getDrinkStatus } from "@/data/wines";
import { cn } from "@/lib/utils";

interface WineCardProps {
  wine: WineType;
  index?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function WineCard({ wine, index = 0, onEdit, onDelete }: WineCardProps) {
  const status = getDrinkStatus(wine);

  return (
    <div
      className="glass-card p-5 hover:border-primary/30 transition-all duration-300 group animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("text-xs px-2 py-0.5 rounded-full border font-body", getWineTypeColor(wine.type))}>
              {getWineTypeLabel(wine.type)}
            </span>
            <span className={cn("text-xs font-body font-medium", status.color)}>
              {status.label}
            </span>
          </div>

          <h3 className="font-display text-lg font-semibold text-foreground truncate group-hover:text-wine-gold transition-colors">
            {wine.name}
          </h3>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            {wine.producer} · {wine.vintage}
          </p>
          <p className="text-xs text-muted-foreground/70 font-body mt-1">
            {wine.region}, {wine.country}
          </p>

          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-muted-foreground font-body">
              {wine.quantity} {wine.quantity === 1 ? "Flasche" : "Flaschen"}
            </span>
            <span className="text-xs text-muted-foreground font-body">
              CHF {wine.purchasePrice}
            </span>
            {wine.rating && (
              <span className="flex items-center gap-1 text-xs text-wine-gold font-body">
                <Star className="w-3 h-3 fill-wine-gold" />
                {wine.rating}
              </span>
            )}
          </div>

          {wine.personalRating && (
            <div className="flex items-center gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5",
                    i < wine.personalRating! ? "fill-wine-gold text-wine-gold" : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wine className="w-6 h-6 text-primary" />
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button onClick={onEdit} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Bearbeiten">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Löschen">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {wine.notes && (
        <p className="text-xs text-muted-foreground/60 font-body italic mt-3 line-clamp-2">
          &bdquo;{wine.notes}&ldquo;
        </p>
      )}
    </div>
  );
}
