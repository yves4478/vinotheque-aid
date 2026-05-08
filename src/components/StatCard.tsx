import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  index?: number;
  accent?: boolean;
  accentGradient?: boolean;
}

export function StatCard({ icon: Icon, label, value, sub, index = 0, accent = false, accentGradient = false }: StatCardProps) {
  if (accentGradient) {
    return (
      <div
        className="rounded-2xl p-5 animate-fade-in"
        style={{
          animationDelay: `${index * 80}ms`,
          background: "var(--gradient-wine)",
          boxShadow: "var(--shadow-wine)",
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide leading-none mb-3"
               style={{ color: "rgba(255,255,255,0.65)" }}>
              {label}
            </p>
            <p className="text-3xl font-display font-bold leading-none tracking-tight text-white">
              {value}
            </p>
            {sub && (
              <p className="text-xs mt-1.5 leading-snug" style={{ color: "rgba(255,255,255,0.55)" }}>
                {sub}
              </p>
            )}
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: "rgba(255,255,255,0.18)" }}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="apple-card p-5 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none mb-3">
            {label}
          </p>
          <p className={cn(
            "text-3xl font-display font-bold leading-none tracking-tight",
            accent ? "text-primary" : "text-foreground"
          )}>
            {value}
          </p>
          {sub && (
            <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{sub}</p>
          )}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}
