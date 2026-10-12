import type { GearListItem } from '../types';
import type { CategoryColorKey } from './categoryStyle';

/** One layer of the backpack chart (FR-19). */
export interface PackCategory {
  /** Unique key of the group (the category name as shown). */
  key: string;
  name: string;
  colorKey: CategoryColorKey;
  /** Vault/template category id when known — gives the default category its icon. */
  iconId: string | null;
  grams: number;
}

/** Groups gearlist rows into pack layers: only rows that are in the pack (Base or
 * Consumable — Consumable wins over Worn, same as computeBreakdown). */
export function packCategoriesFromItems(
  items: GearListItem[],
  resolve: (categoryName: string) => { colorKey: CategoryColorKey; iconId: string | null }
): PackCategory[] {
  const byName = new Map<string, PackCategory>();
  for (const item of items) {
    const inPack = item.isConsumable || !item.isWorn;
    if (!inPack) continue;
    let cat = byName.get(item.categoryName);
    if (!cat) {
      cat = { key: item.categoryName, name: item.categoryName, grams: 0, ...resolve(item.categoryName) };
      byName.set(item.categoryName, cat);
    }
    cat.grams += item.weightGrams * item.quantity;
  }
  return [...byName.values()];
}
