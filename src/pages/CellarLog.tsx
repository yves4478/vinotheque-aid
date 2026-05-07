import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useWineStore } from "@/hooks/useWineStore";
import { cn } from "@/lib/utils";
import { ArrowDownToLine, ArrowUpFromLine, BookOpen, Filter } from "lucide-react";
import type { CellarMovement } from "@vinotheque/core";

type FilterType = "all" | "in" | "out";

const CellarLog = () => {
  const { cellarMovements } = useWineStore();
  const [filter, setFilter] = useState<FilterType>("all");

  const sorted = [...cellarMovements]
    .filter((m) => filter === "all" || m.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("de-CH", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const inCount = cellarMovements.filter((m) => m.type === "in").reduce((s, m) => s + m.quantity, 0);
  const outCount = cellarMovements.filter((m) => m.type === "out").reduce((s, m) => s + m.quantity, 0);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-5 animate-fade-in">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Keller</p>
          <h1 className="text-2xl font-display font-bold tracking-tight">Kellerbuch</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            <span className="text-emerald-600 font-medium">+{inCount}</span> eingelagert ·{" "}
            <span className="text-wine-rose font-medium">−{outCount}</span> entnommen
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-5 animate-fade-in" style={{ animationDelay: "60ms" }}>
        <Filter className="w-4 h-4 text-muted-foreground" />
        {(["all", "in", "out"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all duration-200",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" ? "Alle" : f === "in" ? "Eingelagert" : "Entnommen"}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-body">
            {filter === "all" ? "Noch keine Bewegungen erfasst" : "Keine Einträge für diesen Filter"}
          </p>
          {filter === "all" && (
            <p className="text-muted-foreground/60 font-body text-sm mt-1">
              Einträge entstehen automatisch beim Einlagern und Entnehmen
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2 animate-fade-in">
          {sorted.map((movement: CellarMovement, i) => (
            <div
              key={movement.id}
              className="glass-card p-4 flex items-start gap-4 animate-fade-in"
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                movement.type === "in"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-wine-rose/10 text-wine-rose"
              )}>
                {movement.type === "in"
                  ? <ArrowDownToLine className="w-4 h-4" />
                  : <ArrowUpFromLine className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-display font-semibold text-sm leading-snug">{movement.wineName}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {movement.wineProducer} · {movement.wineVintage}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold font-body px-2.5 py-0.5 rounded-full flex-shrink-0",
                    movement.type === "in"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-wine-rose/10 text-wine-rose"
                  )}>
                    {movement.type === "in" ? `+${movement.quantity}` : `−${movement.quantity}`}{" "}
                    {movement.quantity === 1 ? "Flasche" : "Flaschen"}
                  </span>
                </div>
                {movement.occasion && (
                  <p className="text-xs text-foreground/70 font-body mt-1.5 flex items-center gap-1">
                    <span className="text-muted-foreground">Anlass:</span> {movement.occasion}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/60 font-body mt-1">{formatDate(movement.date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default CellarLog;
