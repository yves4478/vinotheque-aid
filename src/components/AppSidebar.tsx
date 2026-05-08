import { Wine, Menu, X, Home, Plus, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useWineStore } from "@/hooks/useWineStore";
import { useAppRuntime } from "@/providers/AppRuntimeProvider";
import { getEnabledWebNavigation } from "@/features/webFeatures";
import { APP_VERSION, BUILD_NUMBER, formatBuildDate } from "@/lib/version";

const BOTTOM_NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/cellar", label: "Weinkeller", icon: Wine },
  { path: "/add", label: "Hinzufügen", icon: Plus, highlight: true },
  { path: "/shopping", label: "Einkauf", icon: ShoppingCart },
  { path: "menu", label: "Mehr", icon: Menu },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalBottles, settings } = useWineStore();
  const { featureFlags } = useAppRuntime();
  const navItems = getEnabledWebNavigation(featureFlags);

  return (
    <>
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 z-40 transition-transform duration-300 flex flex-col",
          "border-r border-sidebar-border",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ background: "hsl(var(--sidebar-background))" }}
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
              style={{
                background: "var(--gradient-gold)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
              }}
            >
              <Wine className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold leading-tight truncate"
                 style={{ color: "hsl(var(--sidebar-foreground))" }}>
                {settings.cellarName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--sidebar-foreground) / 0.5)" }}>
                Dein Weinkeller
              </p>
            </div>
          </Link>
        </div>

        {/* Close button (mobile) */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 lg:hidden w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: "hsl(var(--sidebar-foreground) / 0.5)", background: "hsl(var(--sidebar-accent))" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 select-none",
                  isActive
                    ? "font-semibold shadow-sm"
                    : "font-normal"
                )}
                style={
                  isActive
                    ? {
                        background: "hsl(var(--sidebar-primary))",
                        color: "hsl(var(--sidebar-primary-foreground))",
                      }
                    : {
                        color: "hsl(var(--sidebar-foreground) / 0.65)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "hsl(var(--sidebar-accent))";
                    e.currentTarget.style.color = "hsl(var(--sidebar-foreground))";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "";
                    e.currentTarget.style.color = "hsl(var(--sidebar-foreground) / 0.65)";
                  }
                }}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "opacity-100" : "opacity-60")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottle counter */}
        <div className="px-4 pt-3 border-t border-sidebar-border">
          <div
            className="flex items-center justify-between px-3 py-3 rounded-xl border"
            style={{
              background: "hsl(var(--sidebar-accent))",
              borderColor: "hsl(var(--sidebar-border))",
            }}
          >
            <div>
              <p className="text-xs font-body" style={{ color: "hsl(var(--sidebar-foreground) / 0.5)" }}>
                Flaschen im Keller
              </p>
              <p className="text-xl font-display font-bold leading-tight mt-0.5"
                 style={{ color: "hsl(var(--sidebar-foreground))" }}>
                {totalBottles}
              </p>
            </div>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gradient-gold)" }}
            >
              <Wine className="w-4 h-4" style={{ color: "hsl(var(--sidebar-primary-foreground))" }} />
            </div>
          </div>
        </div>

        {/* Version footer */}
        <div className="px-5 pb-4 pt-3" title={`Build ${BUILD_NUMBER} vom ${formatBuildDate()}`}>
          <p className="text-[11px] font-mono" style={{ color: "hsl(var(--sidebar-foreground) / 0.3)" }}>
            v{APP_VERSION} <span style={{ opacity: 0.6 }}>· {formatBuildDate()} · {BUILD_NUMBER}</span>
          </p>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <nav
          className="bg-white/95 backdrop-blur-xl border-t border-black/8 flex items-center justify-around px-2 pt-2 pb-safe"
          style={{ borderTopColor: "rgba(0,0,0,0.08)" }}
        >
          {BOTTOM_NAV_ITEMS.map((item) => {
            if (item.path === "menu") {
              return (
                <button
                  key="menu"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1 min-w-[52px] transition-colors",
                    mobileOpen ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Menu className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Mehr</span>
                </button>
              );
            }
            if (item.highlight) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-0.5 -mt-5"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: "var(--gradient-wine)",
                      boxShadow: "var(--shadow-wine)",
                    }}
                  >
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                    {item.label}
                  </span>
                </Link>
              );
            }
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 min-w-[52px] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
