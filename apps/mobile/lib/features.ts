import type { FeatureFlags, FeatureKey } from "@vinotheque/core";
import {
  Heart,
  Map,
  PlusCircle,
  Settings,
  ShoppingCart,
  Star,
  Wine,
  type LucideIcon,
} from "lucide-react-native";

type MobileTabIcon = LucideIcon;

export interface MobileTabDefinition {
  name: string;
  title: string;
  tabBarLabel: string;
  icon: MobileTabIcon;
  featureKey?: FeatureKey;
}

export const MOBILE_TAB_DEFINITIONS: MobileTabDefinition[] = [
  { name: "index", title: "Mein Keller", tabBarLabel: "Keller", icon: Wine, featureKey: "inventory" },
  { name: "map", title: "Weinweltkarte", tabBarLabel: "Karte", icon: Map, featureKey: "map" },
  { name: "add", title: "Wein erfassen", tabBarLabel: "Erfassen", icon: PlusCircle, featureKey: "inventory" },
  { name: "tasting", title: "Wein-Degu", tabBarLabel: "Degu", icon: Star, featureKey: "inventory" },
  { name: "wishlist", title: "Merkliste", tabBarLabel: "Merken", icon: Heart, featureKey: "wishlist" },
  { name: "shopping", title: "Einkaufsliste", tabBarLabel: "Einkauf", icon: ShoppingCart, featureKey: "shopping" },
  { name: "settings", title: "Einstellungen", tabBarLabel: "Einstellungen", icon: Settings },
];

export function getEnabledMobileTabs(featureFlags: FeatureFlags): MobileTabDefinition[] {
  return MOBILE_TAB_DEFINITIONS.filter((tab) => !tab.featureKey || featureFlags[tab.featureKey]);
}
