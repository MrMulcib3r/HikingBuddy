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
import { ICON_STROKE } from './icons/actionIcons';

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

/** `id` is the Vault category id when known (a default-template id gives a fixed icon);
 * otherwise the icon is guessed from the name, falling back to a tag. */
export function CategoryIcon({ id, name, size = 24 }: { id?: string | null; name: string; size?: number }) {
  const Icon = (id ? ICONS_BY_ID[id] : undefined) ?? ICONS_BY_NAME.find(([pattern]) => pattern.test(name))?.[1] ?? Tag;
  return <Icon size={size} strokeWidth={ICON_STROKE} aria-hidden="true" />;
}
