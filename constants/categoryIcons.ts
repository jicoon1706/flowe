import type { LucideIcon } from 'lucide-react-native';
import {
  ArrowUpDown, Briefcase, Car, Clapperboard, Coffee, Dumbbell, Gift, GraduationCap, HandCoins, Heart,
  House, Laptop, Package, PiggyBank, Pill, Plane, Receipt, Shirt, ShoppingBag, ShoppingCart, Smartphone,
  Tag, TrendingUp, Utensils, Wallet, Wifi, Zap, Baby, PawPrint, Fuel,
} from 'lucide-react-native';

/**
 * Monochrome line icons for categories. The canvas allows no category colours:
 * icons are always drawn in the current ink.
 */
const BUILTIN: Record<string, LucideIcon> = {
  // expense slugs (constants/categories.ts)
  food: Utensils,
  transport: Car,
  bills: Zap,
  shopping: ShoppingBag,
  health: Pill,
  entertainment: Clapperboard,
  others: Package,
  // income slugs
  salary: Briefcase,
  freelance: Laptop,
  gift: Gift,
  allowance: HandCoins,
  investment: TrendingUp,
  rental: House,
};

/** Icons a custom category can pick (settings/categories edit sheet). Keys are stored in `custom_categories.icon`. */
export const CUSTOM_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  coffee: Coffee,
  'shopping-cart': ShoppingCart,
  'shopping-bag': ShoppingBag,
  car: Car,
  fuel: Fuel,
  zap: Zap,
  wifi: Wifi,
  smartphone: Smartphone,
  house: House,
  receipt: Receipt,
  pill: Pill,
  heart: Heart,
  dumbbell: Dumbbell,
  'graduation-cap': GraduationCap,
  baby: Baby,
  'paw-print': PawPrint,
  shirt: Shirt,
  plane: Plane,
  clapperboard: Clapperboard,
  gift: Gift,
  briefcase: Briefcase,
  laptop: Laptop,
  'hand-coins': HandCoins,
  'trending-up': TrendingUp,
  'piggy-bank': PiggyBank,
  wallet: Wallet,
  tag: Tag,
};

export const CUSTOM_ICON_KEYS = Object.keys(CUSTOM_ICONS);

/** Icon for a built-in slug, a custom icon key, or a transfer. */
export function categoryIcon(slugOrIconKey: string | null | undefined, kind?: 'transfer'): LucideIcon {
  if (kind === 'transfer') return ArrowUpDown;
  if (!slugOrIconKey) return Package;
  return BUILTIN[slugOrIconKey] ?? CUSTOM_ICONS[slugOrIconKey] ?? Tag;
}
