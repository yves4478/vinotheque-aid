import { Wine, Home, Plus, ShoppingCart, Star, Lightbulb, Map, Menu, X, Settings, Heart, Store, Camera, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useWineStore } from "@/hooks/useWineStore";
import { APP_VERSION, formatBuildDate } from "@/lib/version";
import type { FeatureFlagKey } from "@/hooks/useWineStore";

const navItems: Array<{ to: string; icon: typeof Home; label: string; feature?: FeatureFlagKey }> = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/cellar", icon: Wine, label: "Weinkeller" },
  { to: "/add", icon: Plus, label: "Wein hinzufügen" },
  { to: "/suggestions", icon: Lightbulb, label: "Vorschläge", feature: "suggestions" },
  { to: "/shopping", icon: ShoppingCart, label: "Einkaufsliste" },
  { to: "/merchants", icon: Store, label: "Weinhändler", feature: "merchants" },
  { to: "/ratings", icon: Star, label: "Bewertungen", feature: "ratings" },
  { to: "/wishlist", icon: Heart, label: "Merkliste", feature: "wishlist" },
  { to: "/tasting", icon: Camera, label: "Wein-Degu", feature: "tasting" },
  { to: "/import", icon: FileText, label: "Rechnung importieren", feature: "invoiceImport" },
  { to: "/map", icon: Map, label: "Weinregionen", feature: "wineMap" },
  { to: "/settings", icon: Settings, label: "Einstellungen" },
];

export function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalBottles, settings, runtimeState } = useWineStore();
  const visibleNavItems = navItems.filter((item) => !item.feature || settings.featureFlags[item.feature]);
  const isTestState = runtimeState.startsWith("TEST");

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm border border-black/8 shadow-sm text-foreground"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 z-40 transition-transform duration-300 flex flex-col",
          "bg-sidebar border-r border-sidebar-border",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* App header */}
        <div className="px-5 pt-6 pb-5 border-b border-sidebar-border">
          <Link
            to="/"
            className="flex items-center gap-3 group"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--gradient-wine)", boxShadow: "var(--shadow-wine)" }}
            >
              <Wine className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-foreground leading-tight truncate">
                {settings.cellarName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Dein Weinkeller</p>
              <div
                className={cn(
                  "mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-white",
                  isTestState ? "bg-blue-600" : "bg-emerald-700"
                )}
              >
                {runtimeState}
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 select-none",
                  isActive
                    ? "bg-primary text-white font-medium shadow-sm"
                    : "text-foreground/70 hover:text-foreground hover:bg-black/5 font-normal"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "opacity-100" : "opacity-60")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottle counter pill */}
        <div className="px-4 pt-3 border-t border-sidebar-border">
          <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-white border border-black/5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div>
              <p className="text-xs text-muted-foreground font-body">Flaschen im Keller</p>
              <p className="text-xl font-display font-bold text-foreground leading-tight mt-0.5">
                {totalBottles}
              </p>
            </div>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gradient-wine)" }}
            >
              <Wine className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Version footer */}
        <div className="px-5 pb-4 pt-3" title={`Build ${formatBuildDate()}`}>
          <p className="text-[11px] text-muted-foreground/70 font-mono">
            v{APP_VERSION} <span className="opacity-60">· {formatBuildDate()}</span>
          </p>
        </div>
      </aside>
    </>
  );
}
