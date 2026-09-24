import {
  Apple,
  Backpack,
  Bath,
  BatteryCharging,
  BedDouble,
  CookingPot,
  Droplet,
  Package,
  Shirt,
  Tag,
  Tent,
  type LucideIcon,
} from 'lucide-react';
import type { Category } from '../types';

/** Icons for the default category template (FR-2), keyed by the template's category id —
 * so a renamed default category keeps its icon. */
const ICONS_BY_ID: Record<string, LucideIcon> = {
  'cat-backpack': Backpack,
  'cat-shelter': Tent,
  'cat-sleep': BedDouble,
  'cat-clothing': Shirt,
  'cat-cooking': CookingPot,
  'cat-food': Apple,
  'cat-water': Droplet,
  'cat-electronics': BatteryCharging,
  'cat-hygiene': Bath,
  'cat-misc': Package,
};

/** Fallback for categories created by the user (or data from before the template ids):
 * match on the name, otherwise a generic tag icon. */
const ICONS_BY_NAME: [RegExp, LucideIcon][] = [
  [/backpack|pack|batoh/i, Backpack],
  [/shelter|tent|stan/i, Tent],
  [/sleep|span/i, BedDouble],
  [/cloth|obleč|wear/i, Shirt],
  [/cook|vař|kitchen/i, CookingPot],
  [/food|jídl|snack/i, Apple],
  [/water|vod/i, Droplet],
  [/electr|elektr|batter/i, BatteryCharging],
  [/hygien/i, Bath],
  [/misc|other|ostat/i, Package],
];

export function CategoryIcon({ category, size = 26 }: { category: Category; size?: number }) {
  const Icon =
    ICONS_BY_ID[category.id] ?? ICONS_BY_NAME.find(([pattern]) => pattern.test(category.name))?.[1] ?? Tag;
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}
