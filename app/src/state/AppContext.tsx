import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { loadState, saveState } from '../storage';
import { newId } from '../utils/id';
import { reorderById, sortByOrder, withSequentialOrder } from '../utils/reorder';
import { categoryNameFor, isConsumablesCategory, mirrorFromVault } from './logic';
import { TEMPLATE_NAME } from '../constants';
import { UNCATEGORIZED } from '../types';
import type { AppState, Category, GearItem, GearList, GearListItem, UnitPreference } from '../types';

type GearItemPatch = Omit<GearItem, 'id' | 'order'>;
type ListItemEditablePatch = Partial<Pick<GearListItem, 'quantity' | 'isWorn' | 'isConsumable' | 'note'>>;
/** "Core" fields mirrored from the Gear Vault — editing these on a linked list item is the
 * same operation as editing the Vault item itself (FR-5), so it goes through the same
 * Cancel / Create a copy / Continue dialog. */
type UnlinkedItemPatch = Partial<Pick<GearListItem, 'name' | 'categoryName' | 'weightGrams' | 'note'>>;

type Action =
  | { type: 'ADD_CATEGORY'; id: string; name: string }
  | { type: 'RENAME_CATEGORY'; id: string; name: string }
  | { type: 'DELETE_CATEGORY'; id: string }
  | { type: 'REORDER_CATEGORIES'; sourceId: string; targetId: string; after?: boolean }
  | { type: 'ADD_GEAR_ITEM'; id: string; item: GearItemPatch }
  | { type: 'UPDATE_GEAR_ITEM'; id: string; patch: GearItemPatch }
  | { type: 'DELETE_GEAR_ITEM'; id: string; removeFromLists: boolean }
  | { type: 'REORDER_GEAR_ITEMS'; sourceId: string; targetId: string; targetCategoryId: string | null; after?: boolean }
  | { type: 'CREATE_LIST'; id: string; name: string }
  | { type: 'ADD_ITEM_TO_LIST'; listId: string; gearItemId: string; quantity: number }
  | { type: 'UPDATE_LIST_ITEM'; listId: string; itemId: string; patch: ListItemEditablePatch }
  | { type: 'UPDATE_UNLINKED_LIST_ITEM'; listId: string; itemId: string; patch: UnlinkedItemPatch }
  | { type: 'RELINK_LIST_ITEM'; listId: string; itemId: string; gearItemId: string }
  | { type: 'REMOVE_LIST_ITEM'; listId: string; itemId: string }
  | { type: 'REORDER_LIST_ITEMS'; listId: string; sourceId: string; targetId: string; after?: boolean }
  | { type: 'REORDER_LIST_CATEGORIES'; listId: string; sourceName: string; targetName: string; after?: boolean }
  | { type: 'SAVE_SNAPSHOT'; listId: string }
  | { type: 'REORDER_LISTS'; sourceId: string; targetId: string; after?: boolean }
  | { type: 'DELETE_LIST'; listId: string }
  | { type: 'SAVE_AS_TEMPLATE'; listId: string; templateId: string }
  | { type: 'DELETE_TEMPLATE'; templateId: string }
  | { type: 'CREATE_LIST_FROM_TEMPLATE'; id: string; name: string; templateId: string }
  | { type: 'DISMISS_TEMPLATE_BANNER' }
  | { type: 'SET_UNIT_PREFERENCE'; pref: UnitPreference }
  | { type: 'REPLACE_STATE'; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_CATEGORY': {
      const category: Category = { id: action.id, name: action.name, order: state.categories.length };
      return { ...state, categories: [...state.categories, category] };
    }
    case 'RENAME_CATEGORY': {
      const categories = state.categories.map((c) => (c.id === action.id ? { ...c, name: action.name } : c));
      // Přejmenování kategorie se u "linked" položek v gearlistech promítne hned
      // (categoryName je jen zrcadlo, dokud item odkazuje na Vault). U odpojených
      // (unlinked) položek zůstává zmrazené jméno — to je záměr.
      const oldName = state.categories.find((c) => c.id === action.id)?.name;
      const newName = categories.find((c) => c.id === action.id)?.name;
      if (oldName === undefined || newName === undefined) return { ...state, categories };
      return mapAllLists({ ...state, categories }, (list) => renameCategoryInRows(list, oldName, newName));
    }
    case 'DELETE_CATEGORY': {
      const categories = state.categories.filter((c) => c.id !== action.id);
      const gearItems = state.gearItems.map((item) => (item.categoryId === action.id ? { ...item, categoryId: null } : item));
      const deletedName = state.categories.find((c) => c.id === action.id)?.name;
      return mapAllLists({ ...state, categories, gearItems }, (list) =>
        deletedName === undefined ? list : renameCategoryInRows(list, deletedName, UNCATEGORIZED)
      );
    }
    case 'REORDER_CATEGORIES': {
      const reordered = reorderById(sortByOrder(state.categories), action.sourceId, action.targetId, action.after);
      return { ...state, categories: withSequentialOrder(reordered) };
    }
    case 'ADD_GEAR_ITEM': {
      const item: GearItem = { ...action.item, id: action.id, order: state.gearItems.length };
      return { ...state, gearItems: [...state.gearItems, item] };
    }
    case 'UPDATE_GEAR_ITEM': {
      const before = state.gearItems.find((g) => g.id === action.id);
      const gearItems = state.gearItems.map((g) => (g.id === action.id ? { ...g, ...action.patch } : g));
      const updated = gearItems.find((g) => g.id === action.id)!;
      // The Vault note reaches the lists only when it was actually edited (the user confirmed
      // the dialog); other updates carry the unchanged note and must not overwrite the notes
      // people wrote per gearlist.
      const noteChanged = before !== undefined && before.note !== updated.note;
      // Likewise the category: a row may have been moved to another category inside its own
      // gearlist (a local change), and an unrelated Vault edit (weight…) must not undo that.
      const categoryChanged = before !== undefined && before.categoryId !== updated.categoryId;
      return mapAllLists({ ...state, gearItems }, (list) =>
        syncLinkedItemsAfterVaultEdit(list, updated, state.categories, noteChanged, categoryChanged)
      );
    }
    case 'DELETE_GEAR_ITEM': {
      const gearItems = state.gearItems.filter((g) => g.id !== action.id);
      // Uživatel volí v dialogu (FR-5): buď se řádky odkazující na smazanou položku ze všech
      // gearlistů odstraní ("Delete everywhere"), nebo se jen odpojí (detach) — zůstanou tam
      // s posledními známými hodnotami jako custom entry. Snapshoty se nemění nikdy.
      const gearLists = state.gearLists.map((list) =>
        action.removeFromLists ? removeDeletedItem(list, action.id) : detachDeletedItem(list, action.id)
      );
      // T-6: a template may only hold Vault items, so a deleted item always leaves the
      // template too (the dialog warns about this before it happens).
      const templates = state.templates.map((t) => removeDeletedItem(t, action.id));
      return { ...state, gearItems, gearLists, templates };
    }
    case 'REORDER_GEAR_ITEMS': {
      const sorted = sortByOrder(state.gearItems);
      const moved = sorted.map((g) => (g.id === action.sourceId ? { ...g, categoryId: action.targetCategoryId } : g));
      const reordered = reorderById(moved, action.sourceId, action.targetId, action.after);
      return { ...state, gearItems: withSequentialOrder(reordered) };
    }
    case 'CREATE_LIST': {
      const list: GearList = {
        id: action.id,
        name: action.name,
        createdAt: new Date().toISOString(),
        items: [],
        snapshot: null,
        order: state.gearLists.length,
      };
      return { ...state, gearLists: [...state.gearLists, list] };
    }
    case 'ADD_ITEM_TO_LIST': {
      const gearItem = state.gearItems.find((g) => g.id === action.gearItemId);
      if (!gearItem) return state;
      return mapListById(state, action.listId, (list) => {
        // Bugfix: stejná Vault položka přidaná znovu do stejného gearlistu se sloučí do
        // existujícího řádku (navýší se množství), nevytváří se duplicitní řádek.
        const existing = list.items.find((i) => i.gearItemId === action.gearItemId);
        if (existing) {
          const items = list.items.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + action.quantity } : i
          );
          return { ...list, items };
        }
        const mirror = mirrorFromVault(gearItem, state.categories);
        const listItem: GearListItem = {
          id: newId('li'),
          gearItemId: gearItem.id,
          name: mirror.name,
          categoryName: mirror.categoryName,
          weightGrams: mirror.weightGrams,
          quantity: action.quantity,
          note: gearItem.note,
          isWorn: false,
          // A Vault item from the "Consumables" category is a consumable from the start.
          isConsumable: isConsumablesCategory(mirror.categoryName),
          order: list.items.length,
        };
        return { ...list, items: [...list.items, listItem] };
      });
    }
    case 'UPDATE_LIST_ITEM': {
      return mapListById(state, action.listId, (list) => ({
        ...list,
        items: list.items.map((item) => (item.id === action.itemId ? { ...item, ...action.patch } : item)),
      }));
    }
    case 'UPDATE_UNLINKED_LIST_ITEM': {
      return mapListById(state, action.listId, (list) => ({
        ...list,
        items: list.items.map((item) => (item.id === action.itemId ? { ...item, ...action.patch } : item)),
      }));
    }
    case 'RELINK_LIST_ITEM': {
      const gearItem = state.gearItems.find((g) => g.id === action.gearItemId);
      if (!gearItem) return state;
      const mirror = mirrorFromVault(gearItem, state.categories);
      return mapListById(state, action.listId, (list) => ({
        ...list,
        items: list.items.map((item) =>
          item.id === action.itemId
            ? { ...item, gearItemId: gearItem.id, name: mirror.name, categoryName: mirror.categoryName, weightGrams: mirror.weightGrams }
            : item
        ),
      }));
    }
    case 'REMOVE_LIST_ITEM': {
      return mapListById(state, action.listId, (list) => ({ ...list, items: list.items.filter((i) => i.id !== action.itemId) }));
    }
    case 'REORDER_LIST_ITEMS': {
      return mapListById(state, action.listId, (list) => {
        const reordered = reorderById(sortByOrder(list.items), action.sourceId, action.targetId, action.after);
        return { ...list, items: withSequentialOrder(reordered) };
      });
    }
    case 'REORDER_LIST_CATEGORIES': {
      // A gearlist shows its categories in the order of its rows, so moving a category means
      // moving all its rows as a block (no data-shape change; only this list is affected).
      return mapListById(state, action.listId, (list) => {
        const groups: { id: string; items: GearListItem[] }[] = [];
        for (const item of sortByOrder(list.items)) {
          const group = groups.find((g) => g.id === item.categoryName);
          if (group) group.items.push(item);
          else groups.push({ id: item.categoryName, items: [item] });
        }
        const moved = reorderById(groups, action.sourceName, action.targetName, action.after);
        return { ...list, items: withSequentialOrder(moved.flatMap((g) => g.items)) };
      });
    }
    case 'SAVE_SNAPSHOT': {
      const gearLists = state.gearLists.map((list) =>
        list.id === action.listId
          ? { ...list, snapshot: { savedAt: new Date().toISOString(), items: list.items.map((i) => ({ ...i })) } }
          : list
      );
      return { ...state, gearLists };
    }
    case 'REORDER_LISTS': {
      const reordered = reorderById(sortByOrder(state.gearLists), action.sourceId, action.targetId, action.after);
      return { ...state, gearLists: withSequentialOrder(reordered) };
    }
    case 'DELETE_LIST': {
      return { ...state, gearLists: state.gearLists.filter((l) => l.id !== action.listId) };
    }
    case 'SAVE_AS_TEMPLATE': {
      // T-1: the template becomes a copy of the gearlist's Vault-linked rows (quantity and
      // Worn/Consumable included). Unlinked custom entries are skipped — a template may only
      // reference items that exist in Gear Vault. Overwrites the existing template (the UI
      // asks first). The gearlist itself is untouched and stays independent.
      const source = state.gearLists.find((l) => l.id === action.listId);
      if (!source) return state;
      const items = withSequentialOrder(
        sortByOrder(source.items.filter((i) => i.gearItemId)).map((i) => ({ ...i, id: newId('ti') }))
      );
      const existing = state.templates[0];
      const template: GearList = {
        id: existing?.id ?? action.templateId,
        name: TEMPLATE_NAME,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        items,
        snapshot: null,
        order: 0,
      };
      return { ...state, templates: [template, ...state.templates.slice(1)] };
    }
    case 'DELETE_TEMPLATE': {
      // Gearlists created from the template were independent copies — deleting it doesn't touch them.
      return { ...state, templates: state.templates.filter((t) => t.id !== action.templateId) };
    }
    case 'CREATE_LIST_FROM_TEMPLATE': {
      // T-4: a normal gearlist pre-filled with the template's rows (fresh row ids, still
      // linked to Gear Vault). From now on it has nothing to do with the template.
      const template = state.templates.find((t) => t.id === action.templateId);
      if (!template) return state;
      const list: GearList = {
        id: action.id,
        name: action.name,
        createdAt: new Date().toISOString(),
        items: sortByOrder(template.items).map((i) => ({ ...i, id: newId('li') })),
        snapshot: null,
        order: state.gearLists.length,
      };
      return { ...state, gearLists: [...state.gearLists, list] };
    }
    case 'DISMISS_TEMPLATE_BANNER': {
      return { ...state, templateBannerDismissed: true };
    }
    case 'SET_UNIT_PREFERENCE': {
      return { ...state, unitPreference: action.pref };
    }
    case 'REPLACE_STATE': {
      // Used by BackupControls' "Import backup" — wholesale swap-in of a previously
      // exported (and already schema-migrated) AppState.
      return action.state;
    }
    default:
      return state;
  }
}

/** Applies `fn` to every gearlist AND every template — for changes that must show up
 * everywhere a Vault item is linked (Vault edits, category rename/delete). */
function mapAllLists(state: AppState, fn: (list: GearList) => GearList): AppState {
  return { ...state, gearLists: state.gearLists.map(fn), templates: state.templates.map(fn) };
}

/** Applies `fn` to the one gearlist or template with this id. Row-level actions (add item,
 * quantity, Worn/Consumable, remove, reorder, relink) work the same on a template as on a
 * gearlist (T-3), so they all go through here. */
function mapListById(state: AppState, listId: string, fn: (list: GearList) => GearList): AppState {
  if (state.gearLists.some((l) => l.id === listId)) {
    return { ...state, gearLists: state.gearLists.map((l) => (l.id === listId ? fn(l) : l)) };
  }
  return { ...state, templates: state.templates.map((t) => (t.id === listId ? fn(t) : t)) };
}

/** FR-5: propaguje editaci Gear Vault položky do všech gearlistů, kde je "linked". */
function syncLinkedItemsAfterVaultEdit(
  list: GearList,
  updated: GearItem,
  categories: Category[],
  noteChanged: boolean,
  categoryChanged: boolean
): GearList {
  const mirror = mirrorFromVault(updated, categories);
  const items = list.items.map((item) => {
    if (item.gearItemId !== updated.id) return item;
    const synced = {
      ...item,
      name: mirror.name,
      weightGrams: mirror.weightGrams,
      categoryName: categoryChanged ? mirror.categoryName : item.categoryName,
    };
    return noteChanged ? { ...synced, note: updated.note } : synced;
  });
  return { ...list, items };
}

function detachDeletedItem(list: GearList, deletedGearItemId: string): GearList {
  const items = list.items.map((item) => (item.gearItemId === deletedGearItemId ? { ...item, gearItemId: null } : item));
  return { ...list, items };
}

function removeDeletedItem(list: GearList, deletedGearItemId: string): GearList {
  const items = sortByOrder(list.items.filter((item) => item.gearItemId !== deletedGearItemId));
  return { ...list, items: withSequentialOrder(items) };
}

/** Category renamed (or deleted → "Uncategorized"): every linked row currently shown in it
 * follows, including rows moved there inside their gearlist. Custom entries keep their name. */
function renameCategoryInRows(list: GearList, oldName: string, newName: string): GearList {
  const items = list.items.map((item) => (item.gearItemId && item.categoryName === oldName ? { ...item, categoryName: newName } : item));
  return { ...list, items };
}

interface AppContextValue {
  state: AppState;
  addCategory: (name: string) => string;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (sourceId: string, targetId: string, after?: boolean) => void;
  addGearItem: (item: GearItemPatch) => string;
  updateGearItem: (id: string, patch: GearItemPatch) => void;
  /** removeFromLists: true = also remove its rows from every gearlist ("Delete everywhere");
   * false = keep those rows as unlinked custom entries. Snapshots are never touched. */
  deleteGearItem: (id: string, removeFromLists: boolean) => void;
  reorderGearItems: (sourceId: string, targetId: string, targetCategoryId: string | null, after?: boolean) => void;
  createList: (name: string) => string;
  addItemToList: (listId: string, gearItemId: string, quantity: number) => void;
  updateListItem: (listId: string, itemId: string, patch: ListItemEditablePatch) => void;
  updateUnlinkedListItem: (listId: string, itemId: string, patch: UnlinkedItemPatch) => void;
  /** FR-5 "Continue": propaguje editaci do Vault položky (a tedy do všech gearlistů, kde je linked). */
  continueEditLinkedItem: (gearItemId: string, patch: GearItemPatch) => void;
  /** FR-5 "Create a copy of the item": vytvoří novou Vault položku a přepojí na ni jen tento konkrétní řádek gearlistu. */
  copyAndRelinkListItem: (listId: string, itemId: string, patch: GearItemPatch) => void;
  removeListItem: (listId: string, itemId: string) => void;
  reorderListItems: (listId: string, sourceId: string, targetId: string, after?: boolean) => void;
  /** Moves a category's rows (by category name) in front of another category in one gearlist. */
  reorderListCategories: (listId: string, sourceName: string, targetName: string, after?: boolean) => void;
  saveSnapshot: (listId: string) => void;
  reorderLists: (sourceId: string, targetId: string, after?: boolean) => void;
  deleteList: (listId: string) => void;
  /** T-1: save this gearlist's Vault-linked rows as the (single) template, replacing any existing one. */
  saveAsTemplate: (listId: string) => void;
  deleteTemplate: (templateId: string) => void;
  /** T-4: new gearlist pre-filled from the template. Returns the new gearlist's id. */
  createListFromTemplate: (name: string, templateId: string) => string;
  dismissTemplateBanner: () => void;
  setUnitPreference: (pref: UnitPreference) => void;
  replaceState: (state: AppState) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      addCategory: (name) => {
        const id = newId('cat');
        dispatch({ type: 'ADD_CATEGORY', id, name });
        return id;
      },
      renameCategory: (id, name) => dispatch({ type: 'RENAME_CATEGORY', id, name }),
      deleteCategory: (id) => dispatch({ type: 'DELETE_CATEGORY', id }),
      reorderCategories: (sourceId, targetId, after) => dispatch({ type: 'REORDER_CATEGORIES', sourceId, targetId, after }),
      addGearItem: (item) => {
        const id = newId('gear');
        dispatch({ type: 'ADD_GEAR_ITEM', id, item });
        return id;
      },
      updateGearItem: (id, patch) => dispatch({ type: 'UPDATE_GEAR_ITEM', id, patch }),
      deleteGearItem: (id, removeFromLists) => dispatch({ type: 'DELETE_GEAR_ITEM', id, removeFromLists }),
      reorderGearItems: (sourceId, targetId, targetCategoryId, after) =>
        dispatch({ type: 'REORDER_GEAR_ITEMS', sourceId, targetId, targetCategoryId, after }),
      createList: (name) => {
        const id = newId('list');
        dispatch({ type: 'CREATE_LIST', id, name });
        return id;
      },
      addItemToList: (listId, gearItemId, quantity) => dispatch({ type: 'ADD_ITEM_TO_LIST', listId, gearItemId, quantity }),
      updateListItem: (listId, itemId, patch) => dispatch({ type: 'UPDATE_LIST_ITEM', listId, itemId, patch }),
      updateUnlinkedListItem: (listId, itemId, patch) => dispatch({ type: 'UPDATE_UNLINKED_LIST_ITEM', listId, itemId, patch }),
      continueEditLinkedItem: (gearItemId, patch) => dispatch({ type: 'UPDATE_GEAR_ITEM', id: gearItemId, patch }),
      copyAndRelinkListItem: (listId, itemId, patch) => {
        const id = newId('gear');
        dispatch({ type: 'ADD_GEAR_ITEM', id, item: patch });
        dispatch({ type: 'RELINK_LIST_ITEM', listId, itemId, gearItemId: id });
      },
      removeListItem: (listId, itemId) => dispatch({ type: 'REMOVE_LIST_ITEM', listId, itemId }),
      reorderListItems: (listId, sourceId, targetId, after) => dispatch({ type: 'REORDER_LIST_ITEMS', listId, sourceId, targetId, after }),
      reorderListCategories: (listId, sourceName, targetName, after) =>
        dispatch({ type: 'REORDER_LIST_CATEGORIES', listId, sourceName, targetName, after }),
      saveSnapshot: (listId) => dispatch({ type: 'SAVE_SNAPSHOT', listId }),
      reorderLists: (sourceId, targetId, after) => dispatch({ type: 'REORDER_LISTS', sourceId, targetId, after }),
      deleteList: (listId) => dispatch({ type: 'DELETE_LIST', listId }),
      saveAsTemplate: (listId) => dispatch({ type: 'SAVE_AS_TEMPLATE', listId, templateId: newId('tpl') }),
      deleteTemplate: (templateId) => dispatch({ type: 'DELETE_TEMPLATE', templateId }),
      createListFromTemplate: (name, templateId) => {
        const id = newId('list');
        dispatch({ type: 'CREATE_LIST_FROM_TEMPLATE', id, name, templateId });
        return id;
      },
      dismissTemplateBanner: () => dispatch({ type: 'DISMISS_TEMPLATE_BANNER' }),
      setUnitPreference: (pref) => dispatch({ type: 'SET_UNIT_PREFERENCE', pref }),
      replaceState: (state) => dispatch({ type: 'REPLACE_STATE', state }),
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>.');
  return ctx;
}

export { categoryNameFor };
