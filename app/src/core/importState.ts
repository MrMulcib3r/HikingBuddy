/**
 * FR-23: importing a guest's local data into an account. Pure (the caller passes `newId`), used
 * by the server for "Import your local data" and for Import backup / demo data while signed in.
 *
 * - Empty account → the local data becomes the account's data as it is.
 * - Account with data → everything is added as NEW (fresh ids), nothing is overwritten:
 *   categories with the same name are merged (Martin, 2026-10-21), so "Shelter System" doesn't
 *   appear twice; the local template becomes the account's template only if the account has
 *   none, otherwise it is added as a normal gearlist "Template (imported)".
 * Local data is never changed by this (it stays in the browser).
 */
import { TEMPLATE_NAME } from '../constants';
import { sortByOrder } from '../utils/reorder';
import { isEmptyState } from './schema';
import type { AppState, GearList, GearListItem } from '../types';

export const IMPORTED_TEMPLATE_NAME = `${TEMPLATE_NAME} (imported)`;

export function importIntoAccount(account: AppState, local: AppState, newId: (prefix: string) => string): AppState {
  if (isEmptyState(account)) return local;

  const normalize = (name: string) => name.trim().toLowerCase();

  // Categories: same name → the account's category; otherwise a new one at the end.
  const categories = [...account.categories];
  const categoryIdMap = new Map<string, string>();
  for (const c of sortByOrder(local.categories)) {
    const match = categories.find((a) => normalize(a.name) === normalize(c.name));
    if (match) {
      categoryIdMap.set(c.id, match.id);
    } else {
      const id = categories.some((a) => a.id === c.id) ? newId('cat') : c.id;
      categories.push({ id, name: c.name, order: categories.length });
      categoryIdMap.set(c.id, id);
    }
  }

  const gearIdMap = new Map<string, string>();
  const gearItems = [
    ...account.gearItems,
    ...sortByOrder(local.gearItems).map((g, index) => {
      const id = newId('gear');
      gearIdMap.set(g.id, id);
      return { ...g, id, categoryId: g.categoryId ? (categoryIdMap.get(g.categoryId) ?? null) : null, order: account.gearItems.length + index };
    }),
  ];

  const copyRows = (rows: GearListItem[], prefix: string): GearListItem[] =>
    rows.map((row) => ({ ...row, id: newId(prefix), gearItemId: row.gearItemId ? (gearIdMap.get(row.gearItemId) ?? null) : null }));
  const copyList = (list: GearList, order: number, name = list.name): GearList => ({
    ...list,
    id: newId('list'),
    name,
    order,
    items: copyRows(list.items, 'li'),
    snapshot: list.snapshot ? { savedAt: list.snapshot.savedAt, items: copyRows(list.snapshot.items, 'li') } : null,
  });

  const gearLists = [...account.gearLists, ...sortByOrder(local.gearLists).map((l, index) => copyList(l, account.gearLists.length + index))];
  let templates = account.templates;
  const localTemplate = local.templates[0];
  if (localTemplate && localTemplate.items.length > 0) {
    if (templates.length === 0) {
      templates = [{ ...copyList(localTemplate, 0), id: newId('tpl'), items: copyRows(localTemplate.items, 'ti'), snapshot: null }];
    } else {
      gearLists.push({ ...copyList(localTemplate, gearLists.length, IMPORTED_TEMPLATE_NAME), snapshot: null });
    }
  }

  return { ...account, categories, gearItems, gearLists, templates };
}

/** Counts for the import dialog (FR-23). */
export function countsOf(state: AppState) {
  return { items: state.gearItems.length, gearlists: state.gearLists.length, hasTemplate: state.templates.some((t) => t.items.length > 0) };
}
