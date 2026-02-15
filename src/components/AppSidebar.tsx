import {
  Wine, Plus, ShoppingCart, Star, Lightbulb, Map, Menu, X, Settings,
  Package, LayoutDashboard, ArrowLeft,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useWineStore } from "@/hooks/useWineStore";
import { usePantryStore } from "@/hooks/usePantryStore";

const wineNavItems = [
  { to: "/wine", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/wine/cellar", icon: Wine, label: "Weinkeller" },
  { to: "/wine/add", icon: Plus, label: "Wein hinzufügen" },
  { to: "/wine/suggestions", icon: Lightbulb, label: "Vorschläge" },
  { to: "/wine/shopping", icon: ShoppingCart, label: "Einkaufsliste" },
  { to: "/wine/ratings", icon: Star, label: "Bewertungen" },
  { to: "/wine/map", icon: Map, label: "Weinregionen" },
];

const pantryNavItems = [
  { to: "/pantry", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/pantry/inventory", icon: Package, label: "Inventar" },
  { to: "/pantry/shopping", icon: ShoppingCart, label: "Einkaufsliste" },
];

export function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalBottles, settings } = useWineStore();
  const { totalItems } = usePantryStore();

  const isPantry = location.pathname.startsWith("/pantry");
  const navItems = isPantry ? pantryNavItems : wineNavItems;

  const sectionSubtitle = isPantry ? "Dein Hausvorrat" : "Dein Weinkeller";
  const SectionIcon = isPantry ? Package : Wine;
  const bottomLabel = isPantry ? "Artikel im Vorrat" : "Flaschen im Keller";
  const bottomValue = isPantry ? totalItems : totalBottles;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-300 flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isPantry ? "bg-accent/20 gold-glow" : "bg-primary/20 wine-glow"
            )}>
              <SectionIcon className={cn("w-5 h-5", isPantry ? "text-accent" : "text-primary")} />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-foreground">{settings.cellarName}</h1>
              <p className="text-xs text-muted-foreground font-body">{sectionSubtitle}</p>
            </div>
          </Link>
        </div>

        {/* Back to Home */}
        <div className="px-4 pt-4">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-body text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Zurück zur Übersicht
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body transition-all duration-200",
                  isActive
                    ? "bg-primary/15 text-primary-foreground border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          {/* Settings always visible */}
          <div className="pt-2 mt-2 border-t border-sidebar-border">
            <Link
              to="/settings"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body transition-all duration-200",
                location.pathname === "/settings"
                  ? "bg-primary/15 text-primary-foreground border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Settings className="w-4 h-4" />
              Einstellungen
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground font-body">{bottomLabel}</p>
            <p className="text-2xl font-display font-bold text-gradient-gold mt-1">{bottomValue}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
