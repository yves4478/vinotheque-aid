import { Wine, Home, Plus, ShoppingCart, Star, Lightbulb, Map, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useWineStore } from "@/hooks/useWineStore";

const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/cellar", icon: Wine, label: "Weinkeller" },
  { to: "/add", icon: Plus, label: "Wein hinzufügen" },
  { to: "/suggestions", icon: Lightbulb, label: "Vorschläge" },
  { to: "/shopping", icon: ShoppingCart, label: "Einkaufsliste" },
  { to: "/ratings", icon: Star, label: "Bewertungen" },
  { to: "/map", icon: Map, label: "Weinregionen" },
];

export function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalBottles } = useWineStore();

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
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center wine-glow">
              <Wine className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-foreground">VinVault</h1>
              <p className="text-xs text-muted-foreground font-body">Dein Weinkeller</p>
            </div>
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
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground font-body">Flaschen im Keller</p>
            <p className="text-2xl font-display font-bold text-gradient-gold mt-1">{totalBottles}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
