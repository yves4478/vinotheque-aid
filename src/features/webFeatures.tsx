import type { ReactElement } from "react";
import type { FeatureFlags, FeatureKey } from "@vinotheque/core";
import {
  Camera,
  FileText,
  Heart,
  Home,
  Lightbulb,
  Map,
  type LucideIcon,
  Plus,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Wine,
} from "lucide-react";
import AddWine from "@/pages/AddWine";
import Cellar from "@/pages/Cellar";
import Index from "@/pages/Index";
import InvoiceImport from "@/pages/InvoiceImport";
import Merchants from "@/pages/Merchants";
import Ratings from "@/pages/Ratings";
import SettingsPage from "@/pages/Settings";
import Shopping from "@/pages/Shopping";
import Suggestions from "@/pages/Suggestions";
import Tasting from "@/pages/Tasting";
import Wishlist from "@/pages/Wishlist";
import WineMap from "@/pages/WineMap";

export interface WebRouteDefinition {
  path: string;
  label: string;
  icon: LucideIcon;
  element: ReactElement;
  featureKey?: FeatureKey;
  showInNavigation?: boolean;
}

export const WEB_ROUTE_DEFINITIONS: WebRouteDefinition[] = [
  { path: "/", label: "Dashboard", icon: Home, element: <Index />, featureKey: "inventory" },
  { path: "/cellar", label: "Weinkeller", icon: Wine, element: <Cellar />, featureKey: "inventory" },
  { path: "/add", label: "Wein hinzufuegen", icon: Plus, element: <AddWine />, featureKey: "inventory" },
  { path: "/suggestions", label: "Vorschlaege", icon: Lightbulb, element: <Suggestions />, featureKey: "suggestions" },
  { path: "/shopping", label: "Einkaufsliste", icon: ShoppingCart, element: <Shopping />, featureKey: "shopping" },
  { path: "/merchants", label: "Weinhaendler", icon: Store, element: <Merchants />, featureKey: "merchants" },
  { path: "/ratings", label: "Bewertungen", icon: Star, element: <Ratings />, featureKey: "ratings" },
  { path: "/wishlist", label: "Merkliste", icon: Heart, element: <Wishlist />, featureKey: "wishlist" },
  { path: "/tasting", label: "Wein-Degu", icon: Camera, element: <Tasting />, featureKey: "inventory" },
  { path: "/import", label: "Rechnungsimport", icon: FileText, element: <InvoiceImport />, featureKey: "invoiceImport" },
  { path: "/map", label: "Weinregionen", icon: Map, element: <WineMap />, featureKey: "map" },
  { path: "/settings", label: "Einstellungen", icon: Settings, element: <SettingsPage /> },
];

function isRouteEnabled(route: WebRouteDefinition, featureFlags: FeatureFlags): boolean {
  return !route.featureKey || featureFlags[route.featureKey];
}

export function getEnabledWebRoutes(featureFlags: FeatureFlags): WebRouteDefinition[] {
  return WEB_ROUTE_DEFINITIONS.filter((route) => isRouteEnabled(route, featureFlags));
}

export function getEnabledWebNavigation(featureFlags: FeatureFlags): WebRouteDefinition[] {
  return WEB_ROUTE_DEFINITIONS.filter((route) => route.showInNavigation !== false && isRouteEnabled(route, featureFlags));
}
