import { Wine, Star, Pencil, Trash2, Gift, GlassWater, Sparkles } from "lucide-react";
import { type Wine as WineType, getWineTypeColor, getWineTypeLabel, getDrinkStatus, getPrimaryWineImage, getWineImages } from "@/data/wines";
import { cn, formatCurrency } from "@/lib/utils";

interface WineCardProps {
  wine: WineType;
  index?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onConsume?: () => void;
  onInsights?: () => void;
}

const drinkStatusStyle: Record<string, string> = {
  "Zu jung": "bg-blue-50 text-blue-600",
  "Trinkreif": "bg-green-50 text-green-600",
  "Trinkreif bald": "bg-amber-50 text-amber-600",
  "Überfällig": "bg-red-50 text-red-600",
};

export function WineCard({ wine, index = 0, onEdit, onDelete, onConsume, onInsights }: WineCardProps) {
  const status = getDrinkStatus(wine);
  const primaryImage = getPrimaryWineImage(wine);
  const imageCount = getWineImages(wine).length;

  return (
    <div
      className="apple-card p-4 transition-all duration-200 group animate-fade-in hover:shadow-md"
      style={{
        animationDelay: `${index * 60}ms`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-start gap-3">
        {/* Wine image */}
        <div className="relative w-12 h-14 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
          {primaryImage ? (
            <img src={primaryImage.uri} alt={wine.name} className="w-full h-full object-cover" />
          ) : (
            <Wine className="w-5 h-5 text-primary opacity-70" />
          )}
          {imageCount > 1 && (
            <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {imageCount}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-md font-medium",
              getWineTypeColor(wine.type)
            )}>
              {getWineTypeLabel(wine.type)}
            </span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-md font-medium",
              drinkStatusStyle[status.label] ?? "bg-gray-50 text-gray-500"
            )}>
              {status.label}
            </span>
          </div>

          {/* Name */}
          <h3 className="font-display text-base font-semibold text-foreground leading-snug truncate">
            {wine.name}
          </h3>

          {/* Producer + vintage */}
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {wine.producer} &middot; {wine.vintage}
          </p>

          {/* Region */}
          <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
            {wine.region}, {wine.country}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {wine.quantity} {wine.quantity === 1 ? "Flasche" : "Flaschen"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatCurrency(wine.purchasePrice)}
            </span>
            {wine.rating && (
              <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                <Star className="w-3 h-3 fill-amber-500" />
                {wine.rating}
              </span>
            )}
            {wine.isGift && (
              <span className="flex items-center gap-1 text-xs text-wine-rose">
                <Gift className="w-3 h-3" />
                {wine.giftFrom}
              </span>
            )}
          </div>

          {/* Personal star rating */}
          {wine.personalRating && (
            <div className="flex items-center gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3 h-3",
                    i < wine.personalRating! ? "fill-amber-400 text-amber-400" : "text-gray-200"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions (shown on hover) */}
        {(onEdit || onDelete || onConsume || onInsights) && (
          <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
            {onInsights && (
              <button
                onClick={onInsights}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Zusatzinfos"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
            {onConsume && (
              <button
                onClick={onConsume}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-wine-rose hover:bg-red-50 transition-colors"
                title="Flasche trinken"
              >
                <GlassWater className="w-3.5 h-3.5" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
                title="Bearbeiten"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                title="Löschen"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      {wine.notes && (
        <p className="text-xs text-muted-foreground/60 italic mt-3 pl-14 line-clamp-2">
          &bdquo;{wine.notes}&ldquo;
        </p>
      )}
    </div>
  );
}
