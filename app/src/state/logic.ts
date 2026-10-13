import { plural } from '../utils/text';
import { UNCATEGORIZED } from '../types';
import type { AppState, Category, GearItem, GearList, GearListItem, WeightBreakdown } from '../types';

/** Jméno kategorie k zobrazení/zamrazení — FR-8: chybějící kategorie -> "Uncategorized". */
export function categoryNameFor(categoryId: string | null, categories: Category[]): string {
  if (!categoryId) return UNCATEGORIZED;
  return categories.find((c) => c.id === categoryId)?.name ?? UNCATEGORIZED;
}

/** Zrcadlová pole, která se u "linked" položky v gearlistu přebírají z Gear Vaultu (FR-5). */
export function mirrorFromVault(item: GearItem, categories: Category[]) {
  return {
    name: item.name,
    categoryName: categoryNameFor(item.categoryId, categories),
    weightGrams: item.weightGrams,
  };
}

/** Součet vah podle typu (FR-10). Worn a Consumable jsou nezávislé per-list příznaky
 * (FR-9); pro přehledové dlaždice se každá položka řadí do jednoho ze tří košů podle
 * priority Consumable > Worn > Base, ale do celkové váhy (total) se počítá vždy jen
 * jednou. Násobí váhu jednotky počtem kusů. */
export function computeBreakdown(items: GearListItem[]): WeightBreakdown {
  const result: WeightBreakdown = { base: 0, worn: 0, consumable: 0, total: 0 };
  for (const item of items) {
    const subtotal = item.weightGrams * item.quantity;
    result.total += subtotal;
    if (item.isConsumable) {
      result.consumable += subtotal;
    } else if (item.isWorn) {
      result.worn += subtotal;
    } else {
      result.base += subtotal;
    }
  }
  return result;
}

/** Gearlisty, které obsahují danou položku z Gear Vaultu — pro potvrzovací dialog FR-5
 * (Cancel / Create a copy of the item / Continue). Gearlisty jsou teď vždy editovatelné,
 * takže se na rozdíl od dřívějška nefiltruje podle stavu. */
export function findAffectedLists(state: AppState, gearItemId: string): GearList[] {
  return state.gearLists.filter((list) => list.items.some((i) => i.gearItemId === gearItemId));
}

/** Templates containing the Vault item. The template counts as "used elsewhere" (PRD 7.5,
 * T-5/T-6), so edits and deletes of such an item always go through a dialog. */
export function findAffectedTemplates(state: AppState, gearItemId: string): GearList[] {
  return state.templates.filter((t) => t.items.some((i) => i.gearItemId === gearItemId));
}

/** Plain-language "where is it used" for dialog messages, e.g. "2 gearlists and your template". */
export function describeUsage(listCount: number, templateCount: number): string {
  const parts: string[] = [];
  if (listCount > 0) parts.push(plural(listCount, 'gearlist'));
  if (templateCount > 0) parts.push('your template');
  return parts.join(' and ');
}
