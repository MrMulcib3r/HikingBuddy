/**
 * PRD v33, FR-24: the ONE operations layer. Every change to a user's data — from the web app
 * (guest or signed in) and later from the MCP server — is an `Operation` applied by
 * `applyOperation`. It runs in the browser (instant feedback; the only place it runs for
 * guests) and on the server (the source of truth for accounts), so web and AI can never follow
 * different rules.
 *
 * Rules: pure functions only (no React, no DOM, no storage, no clock, no random ids). Anything
 * that would differ between two runs — new ids, timestamps — travels inside the operation,
 * so the browser and the server always compute exactly the same result.
 *
 * PRD rules enforced here (not only in the UI): no duplicate rows (FR-4), Worn/Consumable on
 * the row (FR-9), weights in grams (FR-3), a Vault edit of an item used in gearlists needs an
 * explicit choice (FR-5), overwriting a snapshot or replacing the template needs an explicit
 * confirmation, template rows are always linked to Gear Vault (T-6).
 */
import { TEMPLATE_NAME, isTemplateCategory } from '../constants';
import { categoryNameFor, isConsumablesCategory, mirrorFromVault } from '../state/logic';
import { reorderById, sortByOrder, withSequentialOrder } from '../utils/reorder';
import { UNCATEGORIZED } from '../types';
import type { AppState, Category, GearItem, GearList, GearListItem, UnitPreference } from '../types';

export type GearItemPatch = Omit<GearItem, 'id' | 'order'>;
export type ListItemEditablePatch = Partial<Pick<GearListItem, 'quantity' | 'isWorn' | 'isConsumable' | 'note'>>;
/** Row-local fields: on a custom entry everything, on a linked row the category (PRD v29) and note. */
export type UnlinkedItemPatch = Partial<Pick<GearListItem, 'name' | 'categoryName' | 'weightGrams' | 'note'>>;

export type Operation =
  | { type: 'ADD_CATEGORY'; id: string; name: string }
  | { type: 'RENAME_CATEGORY'; id: string; name: string }
  | { type: 'DELETE_CATEGORY'; id: string }
  | { type: 'REORDER_CATEGORIES'; sourceId: string; targetId: string; after?: boolean }
  | { type: 'ADD_GEAR_ITEM'; id: string; item: GearItemPatch }
  /** FR-5: changing name / category / weight / note of an item that gearlists or the template
   * use needs `choice: 'update_everywhere'` (the dialog's "Continue"). "Create a copy" is a
   * different operation (ADD_GEAR_ITEM, or COPY_AND_RELINK_LIST_ITEM from a gearlist row). */
  | { type: 'UPDATE_GEAR_ITEM'; id: string; patch: GearItemPatch; choice?: 'update_everywhere' }
  /** FR-5 (v9): removeFromLists true = "Delete everywhere", false = "Keep in gearlists"
   * (rows stay as custom entries). Templates always lose the item (T-6). */
  | { type: 'DELETE_GEAR_ITEM'; id: string; removeFromLists: boolean }
  | { type: 'REORDER_GEAR_ITEMS'; sourceId: string; targetId: string; targetCategoryId: string | null; after?: boolean }
  | { type: 'CREATE_LIST'; id: string; name: string; createdAt: string }
  /** FR-4: adding an item that is already in the list raises its quantity; `rowId` is used
   * only when a new row is needed. */
  | { type: 'ADD_ITEM_TO_LIST'; listId: string; gearItemId: string; quantity: number; rowId: string }
  | { type: 'UPDATE_LIST_ITEM'; listId: string; itemId: string; patch: ListItemEditablePatch }
  | { type: 'UPDATE_UNLINKED_LIST_ITEM'; listId: string; itemId: string; patch: UnlinkedItemPatch }
  /** FR-5 "Create a copy of the item" from a gearlist row: a new Vault item with the new
   * values, and only this one row re-linked to it. */
  | { type: 'COPY_AND_RELINK_LIST_ITEM'; listId: string; itemId: string; newGearItemId: string; item: GearItemPatch }
  | { type: 'REMOVE_LIST_ITEM'; listId: string; itemId: string }
  | { type: 'REORDER_LIST_ITEMS'; listId: string; sourceId: string; targetId: string; after?: boolean }
  | { type: 'REORDER_LIST_CATEGORIES'; listId: string; sourceName: string; targetName: string; after?: boolean }
  /** FR-6: replacing an existing snapshot needs `overwrite: true` (the confirmation dialog). */
  | { type: 'SAVE_SNAPSHOT'; listId: string; savedAt: string; overwrite?: boolean }
  | { type: 'REORDER_LISTS'; sourceId: string; targetId: string; after?: boolean }
  | { type: 'DELETE_LIST'; listId: string }
  /** T-1: replacing an existing template needs `replace: true`. New rows get ids
   * `${rowIdPrefix}-0`, `-1`, … */
  | { type: 'SAVE_AS_TEMPLATE'; listId: string; templateId: string; createdAt: string; rowIdPrefix: string; replace?: boolean }
  | { type: 'DELETE_TEMPLATE'; templateId: string }
  | { type: 'CREATE_LIST_FROM_TEMPLATE'; id: string; name: string; templateId: string; createdAt: string; rowIdPrefix: string }
  | { type: 'DISMISS_TEMPLATE_BANNER' }
  | { type: 'SET_UNIT_PREFERENCE'; pref: UnitPreference }
  /** FR-25 Undo: puts things back to earlier values from the change history (core/history.ts).
   * Only the server creates it (from its own history), never the browser. */
  | { type: 'RESTORE'; actions: RestoreAction[] };

/** One thing to put back: `set` null = remove it; `whole` = bring back a removed thing with all
 * its fields; otherwise only the listed fields are set. `l` = the gearlist of a row. */
export interface RestoreAction {
  k: 'category' | 'gearItem' | 'list' | 'row' | 'snapshot';
  id: string;
  l?: string;
  set: Record<string, unknown> | null;
  whole?: boolean;
}

/** A rule was broken or the operation points at something that doesn't exist. The message is
 * plain English, safe to show to the user (and later to an AI model). */
export class OperationError extends Error {
  readonly code: 'not_found' | 'invalid' | 'needs_choice' | 'needs_confirmation' | 'too_many';
  constructor(code: OperationError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'OperationError';
  }
}

/** Input limits (FR-26 "inputs validated"; also keeps one account well inside D1's free tier). */
export const LIMITS = {
  nameLength: 200,
  noteLength: 2000,
  maxWeightGrams: 1_000_000,
  maxQuantity: 10_000,
  maxGearItems: 5000,
  maxCategories: 200,
  maxLists: 500,
  maxRowsPerList: 1000,
  idLength: 100,
} as const;

/** Applies one operation. Throws OperationError when it breaks a rule; never mutates `state`. */
export function applyOperation(state: AppState, op: Operation): AppState {
  validate(state, op);
  switch (op.type) {
    case 'ADD_CATEGORY': {
      const category: Category = { id: op.id, name: op.name.trim(), order: state.categories.length };
      return { ...state, categories: [...state.categories, category] };
    }
    case 'RENAME_CATEGORY': {
      const oldName = requireCategory(state, op.id).name;
      const newName = op.name.trim();
      const categories = state.categories.map((c) => (c.id === op.id ? { ...c, name: newName } : c));
      // Linked rows show the new name right away; custom entries and snapshots keep theirs.
      return mapAllLists({ ...state, categories }, (list) => renameCategoryInRows(list, oldName, newName));
    }
    case 'DELETE_CATEGORY': {
      const deletedName = requireCategory(state, op.id).name;
      const categories = state.categories.filter((c) => c.id !== op.id);
      const gearItems = state.gearItems.map((item) => (item.categoryId === op.id ? { ...item, categoryId: null } : item));
      return mapAllLists({ ...state, categories, gearItems }, (list) => renameCategoryInRows(list, deletedName, UNCATEGORIZED));
    }
    case 'REORDER_CATEGORIES': {
      const reordered = reorderById(sortByOrder(state.categories), op.sourceId, op.targetId, op.after);
      return { ...state, categories: withSequentialOrder(reordered) };
    }
    case 'ADD_GEAR_ITEM': {
      const item: GearItem = { ...cleanGearPatch(op.item), id: op.id, order: state.gearItems.length };
      return { ...state, gearItems: [...state.gearItems, item] };
    }
    case 'UPDATE_GEAR_ITEM': {
      const before = requireGearItem(state, op.id);
      const updated: GearItem = { ...before, ...cleanGearPatch(op.patch) };
      const gearItems = state.gearItems.map((g) => (g.id === op.id ? updated : g));
      // The Vault note / category reach the lists only when they actually changed: an
      // unrelated edit (weight, quantity) must not overwrite per-gearlist notes or a row moved
      // to another category inside its gearlist (PRD v28, v29).
      const noteChanged = before.note !== updated.note;
      const categoryChanged = before.categoryId !== updated.categoryId;
      return mapAllLists({ ...state, gearItems }, (list) =>
        syncLinkedItemsAfterVaultEdit(list, updated, state.categories, noteChanged, categoryChanged)
      );
    }
    case 'DELETE_GEAR_ITEM': {
      requireGearItem(state, op.id);
      const gearItems = state.gearItems.filter((g) => g.id !== op.id);
      const gearLists = state.gearLists.map((list) =>
        op.removeFromLists ? removeDeletedItem(list, op.id) : detachDeletedItem(list, op.id)
      );
      const templates = state.templates.map((t) => removeDeletedItem(t, op.id));
      return { ...state, gearItems, gearLists, templates };
    }
    case 'REORDER_GEAR_ITEMS': {
      const moved = sortByOrder(state.gearItems).map((g) => (g.id === op.sourceId ? { ...g, categoryId: op.targetCategoryId } : g));
      const reordered = reorderById(moved, op.sourceId, op.targetId, op.after);
      return { ...state, gearItems: withSequentialOrder(reordered) };
    }
    case 'CREATE_LIST': {
      const list: GearList = { id: op.id, name: op.name.trim(), createdAt: op.createdAt, items: [], snapshot: null, order: state.gearLists.length };
      return { ...state, gearLists: [...state.gearLists, list] };
    }
    case 'ADD_ITEM_TO_LIST': {
      const gearItem = requireGearItem(state, op.gearItemId);
      return mapListById(state, op.listId, (list) => {
        // FR-4: the same Vault item added again raises the quantity of its row — no duplicates.
        const existing = list.items.find((i) => i.gearItemId === op.gearItemId);
        if (existing) {
          return { ...list, items: list.items.map((i) => (i.id === existing.id ? { ...i, quantity: clampQuantity(i.quantity + op.quantity) } : i)) };
        }
        const mirror = mirrorFromVault(gearItem, state.categories);
        const row: GearListItem = {
          id: op.rowId,
          gearItemId: gearItem.id,
          name: mirror.name,
          categoryName: mirror.categoryName,
          weightGrams: mirror.weightGrams,
          quantity: op.quantity,
          note: gearItem.note,
          isWorn: false,
          // A Vault item from the "Food" category is a consumable from the start (FR-9, v28).
          isConsumable: isConsumablesCategory(mirror.categoryName),
          order: list.items.length,
        };
        return { ...list, items: [...list.items, row] };
      });
    }
    case 'UPDATE_LIST_ITEM':
    case 'UPDATE_UNLINKED_LIST_ITEM': {
      const patch = cleanRowPatch(op.patch);
      return mapListById(state, op.listId, (list) => ({
        ...list,
        items: list.items.map((item) => (item.id === op.itemId ? { ...item, ...patch } : item)),
      }));
    }
    case 'COPY_AND_RELINK_LIST_ITEM': {
      const item: GearItem = { ...cleanGearPatch(op.item), id: op.newGearItemId, order: state.gearItems.length };
      const mirror = mirrorFromVault(item, state.categories);
      const withItem = { ...state, gearItems: [...state.gearItems, item] };
      return mapListById(withItem, op.listId, (list) => ({
        ...list,
        items: list.items.map((row) =>
          row.id === op.itemId
            ? { ...row, gearItemId: item.id, name: mirror.name, categoryName: mirror.categoryName, weightGrams: mirror.weightGrams }
            : row
        ),
      }));
    }
    case 'REMOVE_LIST_ITEM': {
      return mapListById(state, op.listId, (list) => ({ ...list, items: list.items.filter((i) => i.id !== op.itemId) }));
    }
    case 'REORDER_LIST_ITEMS': {
      return mapListById(state, op.listId, (list) => ({
        ...list,
        items: withSequentialOrder(reorderById(sortByOrder(list.items), op.sourceId, op.targetId, op.after)),
      }));
    }
    case 'REORDER_LIST_CATEGORIES': {
      // A gearlist shows its categories in the order of its rows, so moving a category means
      // moving all its rows as a block (only this list is affected).
      return mapListById(state, op.listId, (list) => {
        const groups: { id: string; items: GearListItem[] }[] = [];
        for (const item of sortByOrder(list.items)) {
          const group = groups.find((g) => g.id === item.categoryName);
          if (group) group.items.push(item);
          else groups.push({ id: item.categoryName, items: [item] });
        }
        const moved = reorderById(groups, op.sourceName, op.targetName, op.after);
        return { ...list, items: withSequentialOrder(moved.flatMap((g) => g.items)) };
      });
    }
    case 'SAVE_SNAPSHOT': {
      return {
        ...state,
        gearLists: state.gearLists.map((list) =>
          list.id === op.listId ? { ...list, snapshot: { savedAt: op.savedAt, items: list.items.map((i) => ({ ...i })) } } : list
        ),
      };
    }
    case 'REORDER_LISTS': {
      return { ...state, gearLists: withSequentialOrder(reorderById(sortByOrder(state.gearLists), op.sourceId, op.targetId, op.after)) };
    }
    case 'DELETE_LIST': {
      return { ...state, gearLists: state.gearLists.filter((l) => l.id !== op.listId) };
    }
    case 'SAVE_AS_TEMPLATE': {
      // T-1: the template becomes a copy of the gearlist's Vault-linked rows (quantity and
      // Worn/Consumable included). Custom entries are skipped. The gearlist stays independent.
      const source = requireList(state, op.listId);
      const items = withSequentialOrder(
        sortByOrder(source.items.filter((i) => i.gearItemId)).map((i, index) => ({ ...i, id: `${op.rowIdPrefix}-${index}` }))
      );
      const existing = state.templates[0];
      const template: GearList = {
        id: existing?.id ?? op.templateId,
        name: TEMPLATE_NAME,
        createdAt: existing?.createdAt ?? op.createdAt,
        items,
        snapshot: null,
        order: 0,
      };
      return { ...state, templates: [template, ...state.templates.slice(1)] };
    }
    case 'DELETE_TEMPLATE': {
      // Gearlists created from the template are independent copies — they don't change.
      return { ...state, templates: state.templates.filter((t) => t.id !== op.templateId) };
    }
    case 'CREATE_LIST_FROM_TEMPLATE': {
      // T-4: a normal gearlist pre-filled with the template's rows (fresh row ids, still linked).
      const template = state.templates.find((t) => t.id === op.templateId);
      if (!template) throw new OperationError('not_found', 'The template no longer exists.');
      const list: GearList = {
        id: op.id,
        name: op.name.trim(),
        createdAt: op.createdAt,
        items: sortByOrder(template.items).map((i, index) => ({ ...i, id: `${op.rowIdPrefix}-${index}` })),
        snapshot: null,
        order: state.gearLists.length,
      };
      return { ...state, gearLists: [...state.gearLists, list] };
    }
    case 'DISMISS_TEMPLATE_BANNER':
      return { ...state, templateBannerDismissed: true };
    case 'SET_UNIT_PREFERENCE':
      return { ...state, unitPreference: op.pref };
    case 'RESTORE':
      return applyRestore(state, op.actions);
  }
}

const KIND_ORDER: RestoreAction['k'][] = ['category', 'gearItem', 'list', 'row', 'snapshot'];

/** FR-25: parents first when bringing things back (a gearlist before its rows), children first
 * when removing them. Removing keeps the data consistent the same way the normal deletes do. */
function applyRestore(state: AppState, actions: RestoreAction[]): AppState {
  const rank = (a: RestoreAction) => KIND_ORDER.indexOf(a.k);
  const puts = actions.filter((a) => a.set !== null).sort((x, y) => rank(x) - rank(y));
  const removes = actions.filter((a) => a.set === null).sort((x, y) => rank(y) - rank(x));
  let s = state;
  for (const a of puts) s = restorePut(s, a);
  for (const a of removes) s = restoreRemove(s, a);
  return s;
}

function restorePut(state: AppState, a: RestoreAction): AppState {
  const set = a.set as Record<string, unknown>;
  switch (a.k) {
    case 'category': {
      const exists = state.categories.some((c) => c.id === a.id);
      if (!exists && !a.whole) return state;
      const categories = exists
        ? state.categories.map((c) => (c.id === a.id ? ({ ...c, ...set, id: a.id } as Category) : c))
        : [...state.categories, { ...(set as unknown as Category), id: a.id }];
      return { ...state, categories };
    }
    case 'gearItem': {
      const exists = state.gearItems.some((g) => g.id === a.id);
      if (!exists && !a.whole) return state;
      const merged = (g: GearItem): GearItem => ({ ...g, ...set, id: a.id }) as GearItem;
      let gearItems = exists ? state.gearItems.map((g) => (g.id === a.id ? merged(g) : g)) : [...state.gearItems, merged(set as unknown as GearItem)];
      // A category that no longer exists → Uncategorized (same as deleting the category).
      gearItems = gearItems.map((g) => (g.id === a.id && g.categoryId && !state.categories.some((c) => c.id === g.categoryId) ? { ...g, categoryId: null } : g));
      return { ...state, gearItems };
    }
    case 'list': {
      const kind = set.kind;
      const header = (l: GearList): GearList => ({
        ...l,
        name: typeof set.name === 'string' ? set.name : l.name,
        createdAt: typeof set.createdAt === 'string' ? set.createdAt : l.createdAt,
        order: typeof set.order === 'number' ? set.order : l.order,
      });
      if (state.gearLists.some((l) => l.id === a.id)) return { ...state, gearLists: state.gearLists.map((l) => (l.id === a.id ? header(l) : l)) };
      if (state.templates.some((t) => t.id === a.id)) return { ...state, templates: state.templates.map((t) => (t.id === a.id ? header(t) : t)) };
      if (!a.whole) return state;
      const list = header({ id: a.id, name: '', createdAt: '', items: [], snapshot: null, order: 0 });
      if (kind === 'template') return state.templates.length > 0 ? state : { ...state, templates: [{ ...list, name: TEMPLATE_NAME }] };
      return { ...state, gearLists: [...state.gearLists, list] };
    }
    case 'row': {
      const listId = a.l ?? '';
      const linkOk = (row: GearListItem): GearListItem =>
        row.gearItemId && !state.gearItems.some((g) => g.id === row.gearItemId) ? { ...row, gearItemId: null } : row;
      const put = (list: GearList): GearList => {
        const exists = list.items.some((i) => i.id === a.id);
        if (!exists && !a.whole) return list;
        const items = exists
          ? list.items.map((i) => (i.id === a.id ? linkOk({ ...i, ...set, id: a.id } as GearListItem) : i))
          : [...list.items, linkOk({ ...(set as unknown as GearListItem), id: a.id })];
        return { ...list, items };
      };
      return mapListIfExists(state, listId, put);
    }
    case 'snapshot':
      return mapListIfExists(state, a.id, (list) => {
        if (!list.snapshot && !a.whole) return list;
        const merged = { ...(list.snapshot ?? {}), ...set } as GearList['snapshot'];
        return { ...list, snapshot: merged };
      });
  }
}

function restoreRemove(state: AppState, a: RestoreAction): AppState {
  switch (a.k) {
    case 'category': {
      const category = state.categories.find((c) => c.id === a.id);
      if (!category) return state;
      const categories = state.categories.filter((c) => c.id !== a.id);
      const gearItems = state.gearItems.map((item) => (item.categoryId === a.id ? { ...item, categoryId: null } : item));
      return mapAllLists({ ...state, categories, gearItems }, (list) => renameCategoryInRows(list, category.name, UNCATEGORIZED));
    }
    case 'gearItem': {
      if (!state.gearItems.some((g) => g.id === a.id)) return state;
      // Rows that still link to it stay as custom entries; the template only holds linked rows (T-6).
      return {
        ...state,
        gearItems: state.gearItems.filter((g) => g.id !== a.id),
        gearLists: state.gearLists.map((l) => detachDeletedItem(l, a.id)),
        templates: state.templates.map((t) => removeDeletedItem(t, a.id)),
      };
    }
    case 'list':
      return { ...state, gearLists: state.gearLists.filter((l) => l.id !== a.id), templates: state.templates.filter((t) => t.id !== a.id) };
    case 'row':
      return mapListIfExists(state, a.l ?? '', (list) => ({ ...list, items: list.items.filter((i) => i.id !== a.id) }));
    case 'snapshot':
      return mapListIfExists(state, a.id, (list) => ({ ...list, snapshot: null }));
  }
}

function mapListIfExists(state: AppState, listId: string, fn: (list: GearList) => GearList): AppState {
  if (!state.gearLists.some((l) => l.id === listId) && !state.templates.some((t) => t.id === listId)) return state;
  return mapListById(state, listId, fn);
}

/** Applies operations in order, skipping (and reporting) any that break a rule — the rest
 * still apply. Used by the server for a batch and by the browser to replay unsent changes. */
export function applyOperations(state: AppState, ops: Operation[]): { state: AppState; rejected: { index: number; error: OperationError }[] } {
  let current = state;
  const rejected: { index: number; error: OperationError }[] = [];
  ops.forEach((op, index) => {
    try {
      current = applyOperation(current, op);
    } catch (err) {
      if (err instanceof OperationError) rejected.push({ index, error: err });
      else throw err;
    }
  });
  return { state: current, rejected };
}

/** How many gearlist / template rows link to this Vault item — "used elsewhere" for FR-5. */
export function linkedRowCount(state: AppState, gearItemId: string): number {
  let n = 0;
  for (const list of [...state.gearLists, ...state.templates]) n += list.items.filter((i) => i.gearItemId === gearItemId).length;
  return n;
}

// ---------------------------------------------------------------------------------------------
// Validation

function validate(state: AppState, op: Operation): void {
  switch (op.type) {
    case 'ADD_CATEGORY':
      checkId(op.id);
      checkName(op.name, 'Category name');
      if (state.categories.some((c) => c.id === op.id)) throw new OperationError('invalid', 'This category already exists.');
      if (state.categories.length >= LIMITS.maxCategories) throw new OperationError('too_many', `You can have at most ${LIMITS.maxCategories} categories.`);
      return;
    case 'RENAME_CATEGORY':
      checkName(op.name, 'Category name');
      return;
    case 'DELETE_CATEGORY':
      // PRD v15: categories from the default template can't be deleted.
      if (isTemplateCategory(op.id)) throw new OperationError('invalid', 'Default categories can be renamed but not deleted.');
      return;
    case 'ADD_GEAR_ITEM':
      checkId(op.id);
      checkGearPatch(op.item);
      if (state.gearItems.some((g) => g.id === op.id)) throw new OperationError('invalid', 'This item already exists.');
      if (state.gearItems.length >= LIMITS.maxGearItems) throw new OperationError('too_many', `Gear Vault can hold at most ${LIMITS.maxGearItems} items.`);
      checkCategoryRef(state, op.item.categoryId);
      return;
    case 'UPDATE_GEAR_ITEM': {
      checkGearPatch(op.patch);
      checkCategoryRef(state, op.patch.categoryId);
      const before = requireGearItem(state, op.id);
      const coreChanged =
        before.name !== op.patch.name.trim() ||
        before.categoryId !== op.patch.categoryId ||
        before.weightGrams !== op.patch.weightGrams ||
        before.note !== op.patch.note;
      if (coreChanged && linkedRowCount(state, op.id) > 0 && op.choice !== 'update_everywhere') {
        throw new OperationError(
          'needs_choice',
          `"${before.name}" is used in gearlists or the template. Choose "update everywhere" or create a copy of the item.`
        );
      }
      return;
    }
    case 'DELETE_GEAR_ITEM':
      return;
    case 'REORDER_GEAR_ITEMS': {
      checkCategoryRef(state, op.targetCategoryId);
      // Moving into another category is a category edit: FR-5 applies (UPDATE_GEAR_ITEM).
      const source = requireGearItem(state, op.sourceId);
      if (source.categoryId !== op.targetCategoryId && linkedRowCount(state, op.sourceId) > 0) {
        throw new OperationError('needs_choice', `"${source.name}" is used in gearlists or the template. Change its category with "update everywhere" or create a copy.`);
      }
      return;
    }
    case 'CREATE_LIST':
    case 'CREATE_LIST_FROM_TEMPLATE':
      checkId(op.id);
      checkName(op.name, 'Gearlist name');
      if ([...state.gearLists, ...state.templates].some((l) => l.id === op.id)) throw new OperationError('invalid', 'This gearlist already exists.');
      if (state.gearLists.length >= LIMITS.maxLists) throw new OperationError('too_many', `You can have at most ${LIMITS.maxLists} gearlists.`);
      return;
    case 'ADD_ITEM_TO_LIST': {
      checkId(op.rowId);
      checkQuantity(op.quantity);
      const list = requireListOrTemplate(state, op.listId);
      if (list.items.length >= LIMITS.maxRowsPerList) throw new OperationError('too_many', `A gearlist can hold at most ${LIMITS.maxRowsPerList} items.`);
      if (list.items.some((i) => i.id === op.rowId && i.gearItemId !== op.gearItemId)) throw new OperationError('invalid', 'This row already exists.');
      return;
    }
    case 'UPDATE_LIST_ITEM':
    case 'UPDATE_UNLINKED_LIST_ITEM': {
      const row = requireRow(state, op.listId, op.itemId);
      checkRowPatch(op.patch);
      // Name and weight of a linked row mirror the Vault item: changing them goes through
      // the Vault (UPDATE_GEAR_ITEM / COPY_AND_RELINK_LIST_ITEM, FR-5). Category and note are row-local.
      const p = op.patch as UnlinkedItemPatch;
      if (row.gearItemId && (p.name !== undefined || p.weightGrams !== undefined)) {
        throw new OperationError('invalid', 'Name and weight of an item linked to Gear Vault are changed on the Vault item.');
      }
      if (isTemplate(state, op.listId) && p.name !== undefined) throw new OperationError('invalid', 'Template rows are always linked to Gear Vault.');
      return;
    }
    case 'COPY_AND_RELINK_LIST_ITEM':
      checkId(op.newGearItemId);
      checkGearPatch(op.item);
      checkCategoryRef(state, op.item.categoryId);
      requireRow(state, op.listId, op.itemId);
      if (state.gearItems.some((g) => g.id === op.newGearItemId)) throw new OperationError('invalid', 'This item already exists.');
      if (state.gearItems.length >= LIMITS.maxGearItems) throw new OperationError('too_many', `Gear Vault can hold at most ${LIMITS.maxGearItems} items.`);
      return;
    case 'REMOVE_LIST_ITEM':
      requireRow(state, op.listId, op.itemId);
      return;
    case 'REORDER_LIST_ITEMS':
    case 'REORDER_LIST_CATEGORIES':
      requireListOrTemplate(state, op.listId);
      return;
    case 'SAVE_SNAPSHOT': {
      const list = requireList(state, op.listId);
      if (list.snapshot && !op.overwrite) throw new OperationError('needs_confirmation', `"${list.name}" already has a snapshot. Saving replaces it — confirm to overwrite.`);
      return;
    }
    case 'DELETE_LIST':
      requireList(state, op.listId);
      return;
    case 'SAVE_AS_TEMPLATE':
      checkId(op.templateId);
      checkId(op.rowIdPrefix);
      requireList(state, op.listId);
      if (state.templates.length > 0 && !op.replace) throw new OperationError('needs_confirmation', 'You already have a template. Saving replaces it — confirm to replace.');
      return;
    case 'DELETE_TEMPLATE':
      if (!isTemplate(state, op.templateId)) throw new OperationError('not_found', 'The template no longer exists.');
      return;
    case 'SET_UNIT_PREFERENCE':
      if (op.pref !== 'metric' && op.pref !== 'imperial') throw new OperationError('invalid', 'Unknown unit preference.');
      return;
    default:
      return;
  }
}

function checkId(id: string) {
  if (typeof id !== 'string' || id.length === 0 || id.length > LIMITS.idLength) throw new OperationError('invalid', 'Invalid id.');
}
function checkName(name: string, label: string) {
  if (typeof name !== 'string' || name.trim().length === 0) throw new OperationError('invalid', `${label} can't be empty.`);
  if (name.length > LIMITS.nameLength) throw new OperationError('invalid', `${label} is too long (max ${LIMITS.nameLength} characters).`);
}
function checkNote(note: string) {
  if (typeof note !== 'string' || note.length > LIMITS.noteLength) throw new OperationError('invalid', `Note is too long (max ${LIMITS.noteLength} characters).`);
}
function checkWeight(grams: number) {
  if (typeof grams !== 'number' || !Number.isFinite(grams) || grams < 0 || grams > LIMITS.maxWeightGrams) {
    throw new OperationError('invalid', `Weight must be between 0 and ${LIMITS.maxWeightGrams} g.`);
  }
}
function checkQuantity(q: number) {
  if (typeof q !== 'number' || !Number.isInteger(q) || q < 0 || q > LIMITS.maxQuantity) {
    throw new OperationError('invalid', `Quantity must be a whole number between 0 and ${LIMITS.maxQuantity}.`);
  }
}
function checkGearPatch(p: GearItemPatch) {
  checkName(p.name, 'Item name');
  checkNote(p.note);
  checkWeight(p.weightGrams);
  checkQuantity(p.defaultQuantity);
}
function checkRowPatch(p: UnlinkedItemPatch & ListItemEditablePatch) {
  if (p.name !== undefined) checkName(p.name, 'Item name');
  if (p.categoryName !== undefined) checkName(p.categoryName, 'Category name');
  if (p.note !== undefined) checkNote(p.note);
  if (p.weightGrams !== undefined) checkWeight(p.weightGrams);
  if (p.quantity !== undefined) checkQuantity(p.quantity);
  if (p.isWorn !== undefined && typeof p.isWorn !== 'boolean') throw new OperationError('invalid', 'Worn must be true or false.');
  if (p.isConsumable !== undefined && typeof p.isConsumable !== 'boolean') throw new OperationError('invalid', 'Consumable must be true or false.');
}
function checkCategoryRef(state: AppState, categoryId: string | null) {
  if (categoryId !== null && !state.categories.some((c) => c.id === categoryId)) throw new OperationError('not_found', 'That category no longer exists.');
}

function requireCategory(state: AppState, id: string): Category {
  const c = state.categories.find((x) => x.id === id);
  if (!c) throw new OperationError('not_found', 'That category no longer exists.');
  return c;
}
function requireGearItem(state: AppState, id: string): GearItem {
  const g = state.gearItems.find((x) => x.id === id);
  if (!g) throw new OperationError('not_found', 'That Gear Vault item no longer exists.');
  return g;
}
function requireList(state: AppState, id: string): GearList {
  const l = state.gearLists.find((x) => x.id === id);
  if (!l) throw new OperationError('not_found', 'That gearlist no longer exists.');
  return l;
}
function requireListOrTemplate(state: AppState, id: string): GearList {
  const l = state.gearLists.find((x) => x.id === id) ?? state.templates.find((x) => x.id === id);
  if (!l) throw new OperationError('not_found', 'That gearlist no longer exists.');
  return l;
}
function requireRow(state: AppState, listId: string, itemId: string): GearListItem {
  const row = requireListOrTemplate(state, listId).items.find((i) => i.id === itemId);
  if (!row) throw new OperationError('not_found', 'That gearlist item no longer exists.');
  return row;
}
function isTemplate(state: AppState, id: string): boolean {
  return state.templates.some((t) => t.id === id);
}

// ---------------------------------------------------------------------------------------------
// Helpers (moved from AppContext's reducer unchanged)

function cleanGearPatch(p: GearItemPatch): GearItemPatch {
  return { name: p.name.trim(), categoryId: p.categoryId, weightGrams: p.weightGrams, defaultQuantity: p.defaultQuantity, note: p.note };
}
/** Keeps only the known row fields, so nothing unexpected (ids, links) can be patched in. */
function cleanRowPatch(p: UnlinkedItemPatch & ListItemEditablePatch): Partial<GearListItem> {
  const out: Partial<GearListItem> = {};
  if (p.name !== undefined) out.name = p.name.trim();
  if (p.categoryName !== undefined) out.categoryName = p.categoryName;
  if (p.weightGrams !== undefined) out.weightGrams = p.weightGrams;
  if (p.note !== undefined) out.note = p.note;
  if (p.quantity !== undefined) out.quantity = p.quantity;
  if (p.isWorn !== undefined) out.isWorn = p.isWorn;
  if (p.isConsumable !== undefined) out.isConsumable = p.isConsumable;
  return out;
}
function clampQuantity(q: number): number {
  return Math.min(q, LIMITS.maxQuantity);
}

/** Applies `fn` to every gearlist AND every template — for changes that must show up
 * everywhere a Vault item is linked (Vault edits, category rename/delete). */
function mapAllLists(state: AppState, fn: (list: GearList) => GearList): AppState {
  return { ...state, gearLists: state.gearLists.map(fn), templates: state.templates.map(fn) };
}

/** Applies `fn` to the one gearlist or template with this id (row actions work the same on both, T-3). */
function mapListById(state: AppState, listId: string, fn: (list: GearList) => GearList): AppState {
  if (state.gearLists.some((l) => l.id === listId)) {
    return { ...state, gearLists: state.gearLists.map((l) => (l.id === listId ? fn(l) : l)) };
  }
  if (state.templates.some((t) => t.id === listId)) {
    return { ...state, templates: state.templates.map((t) => (t.id === listId ? fn(t) : t)) };
  }
  throw new OperationError('not_found', 'That gearlist no longer exists.');
}

/** FR-5: carries a Vault item edit into every row linked to it. */
function syncLinkedItemsAfterVaultEdit(list: GearList, updated: GearItem, categories: Category[], noteChanged: boolean, categoryChanged: boolean): GearList {
  const mirror = mirrorFromVault(updated, categories);
  const items = list.items.map((item) => {
    if (item.gearItemId !== updated.id) return item;
    const synced = { ...item, name: mirror.name, weightGrams: mirror.weightGrams, categoryName: categoryChanged ? mirror.categoryName : item.categoryName };
    return noteChanged ? { ...synced, note: updated.note } : synced;
  });
  return { ...list, items };
}

function detachDeletedItem(list: GearList, deletedGearItemId: string): GearList {
  return { ...list, items: list.items.map((item) => (item.gearItemId === deletedGearItemId ? { ...item, gearItemId: null } : item)) };
}

function removeDeletedItem(list: GearList, deletedGearItemId: string): GearList {
  return { ...list, items: withSequentialOrder(sortByOrder(list.items.filter((item) => item.gearItemId !== deletedGearItemId))) };
}

/** Category renamed (or deleted → "Uncategorized"): every linked row currently shown in it
 * follows, including rows moved there inside their gearlist. Custom entries keep their name. */
function renameCategoryInRows(list: GearList, oldName: string, newName: string): GearList {
  return { ...list, items: list.items.map((item) => (item.gearItemId && item.categoryName === oldName ? { ...item, categoryName: newName } : item)) };
}

export { categoryNameFor };
