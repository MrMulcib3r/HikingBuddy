import { UNCATEGORIZED } from '../types';
import type {
  AppState,
  Category,
  DraftGearList,
  GearItem,
  GearList,
  GearListItem,
  WeightBreakdown,
} from '../types';

/** Jméno kategorie k zobrazení/zamrazení — FR-8: chybějící kategorie -> "Uncategorized". */
export function categoryNameFor(categoryId: string | null, categories: Category[]): string {
  if (!categoryId) return UNCATEGORIZED;
  return categories.find((c) => c.id === categoryId)?.name ?? UNCATEGORIZED;
}

/** Zrcadlová pole, která se u "linked" položky v Draft gearlistu přebírají z Gear Vaultu (FR-5). */
export function mirrorFromVault(item: GearItem, categories: Category[]) {
  return {
    name: item.name,
    categoryName: categoryNameFor(item.categoryId, categories),
    weightGrams: item.weightGrams,
    vaultWeightType: item.weightType,
  };
}

/** Součet vah podle typu (FR-10). Násobí váhu jednotky počtem kusů. */
export function computeBreakdown(items: GearListItem[]): WeightBreakdown {
  const result: WeightBreakdown = { base: 0, worn: 0, consumable: 0, total: 0 };
  for (const item of items) {
    const subtotal = item.weightGrams * item.quantity;
    result[item.weightType] += subtotal;
    result.total += subtotal;
  }
  return result;
}

/** Draft gearlisty, které obsahují danou položku z Gear Vaultu — pro potvrzovací dialog FR-5/FR-7. */
export function findAffectedDraftLists(state: AppState, gearItemId: string): DraftGearList[] {
  return state.gearLists.filter(
    (list): list is DraftGearList =>
      list.status === 'draft' && list.items.some((i) => i.gearItemId === gearItemId)
  );
}

export function isFinalized(list: GearList): list is Extract<GearList, { status: 'finalized' }> {
  return list.status === 'finalized';
}
