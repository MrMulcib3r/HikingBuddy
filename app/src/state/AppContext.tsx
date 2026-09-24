import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { loadState, saveState } from '../storage';
import { newId } from '../utils/id';
import { reorderById, sortByOrder, withSequentialOrder } from '../utils/reorder';
import { categoryNameFor, mirrorFromVault } from './logic';
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
  | { type: 'REORDER_CATEGORIES'; sourceId: string; targetId: string }
  | { type: 'ADD_GEAR_ITEM'; id: string; item: GearItemPatch }
  | { type: 'UPDATE_GEAR_ITEM'; id: string; patch: GearItemPatch }
  | { type: 'DELETE_GEAR_ITEM'; id: string; removeFromLists: boolean }
  | { type: 'REORDER_GEAR_ITEMS'; sourceId: string; targetId: string; targetCategoryId: string | null }
  | { type: 'CREATE_LIST'; id: string; name: string }
  | { type: 'ADD_ITEM_TO_LIST'; listId: string; gearItemId: string; quantity: number }
  | { type: 'UPDATE_LIST_ITEM'; listId: string; itemId: string; patch: ListItemEditablePatch }
  | { type: 'UPDATE_UNLINKED_LIST_ITEM'; listId: string; itemId: string; patch: UnlinkedItemPatch }
  | { type: 'RELINK_LIST_ITEM'; listId: string; itemId: string; gearItemId: string }
  | { type: 'REMOVE_LIST_ITEM'; listId: string; itemId: string }
  | { type: 'REORDER_LIST_ITEMS'; listId: string; sourceId: string; targetId: string }
  | { type: 'SAVE_SNAPSHOT'; listId: string }
  | { type: 'REORDER_LISTS'; sourceId: string; targetId: string }
  | { type: 'DELETE_LIST'; listId: string }
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
      const gearLists = state.gearLists.map((list) => syncLinkedItemsAfterCategoryRename(list, state.gearItems, categories));
      return { ...state, categories, gearLists };
    }
    case 'DELETE_CATEGORY': {
      const categories = state.categories.filter((c) => c.id !== action.id);
      const gearItems = state.gearItems.map((item) => (item.categoryId === action.id ? { ...item, categoryId: null } : item));
      const gearLists = state.gearLists.map((list) => syncLinkedItemsAfterCategoryRename(list, gearItems, categories));
      return { ...state, categories, gearItems, gearLists };
    }
    case 'REORDER_CATEGORIES': {
      const reordered = reorderById(sortByOrder(state.categories), action.sourceId, action.targetId);
      return { ...state, categories: withSequentialOrder(reordered) };
    }
    case 'ADD_GEAR_ITEM': {
      const item: GearItem = { ...action.item, id: action.id, order: state.gearItems.length };
      return { ...state, gearItems: [...state.gearItems, item] };
    }
    case 'UPDATE_GEAR_ITEM': {
      const gearItems = state.gearItems.map((g) => (g.id === action.id ? { ...g, ...action.patch } : g));
      const updated = gearItems.find((g) => g.id === action.id)!;
      const gearLists = state.gearLists.map((list) => syncLinkedItemsAfterVaultEdit(list, updated, state.categories));
      return { ...state, gearItems, gearLists };
    }
    case 'DELETE_GEAR_ITEM': {
      const gearItems = state.gearItems.filter((g) => g.id !== action.id);
      // Uživatel volí v dialogu (FR-5): buď se řádky odkazující na smazanou položku ze všech
      // gearlistů odstraní ("Delete everywhere"), nebo se jen odpojí (detach) — zůstanou tam
      // s posledními známými hodnotami jako custom entry. Snapshoty se nemění nikdy.
      const gearLists = state.gearLists.map((list) =>
        action.removeFromLists ? removeDeletedItem(list, action.id) : detachDeletedItem(list, action.id)
      );
      return { ...state, gearItems, gearLists };
    }
    case 'REORDER_GEAR_ITEMS': {
      const sorted = sortByOrder(state.gearItems);
      const moved = sorted.map((g) => (g.id === action.sourceId ? { ...g, categoryId: action.targetCategoryId } : g));
      const reordered = reorderById(moved, action.sourceId, action.targetId);
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
      const gearLists = state.gearLists.map((list) => {
        if (list.id !== action.listId) return list;
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
          isConsumable: false,
          order: list.items.length,
        };
        return { ...list, items: [...list.items, listItem] };
      });
      return { ...state, gearLists };
    }
    case 'UPDATE_LIST_ITEM': {
      const gearLists = state.gearLists.map((list) => {
        if (list.id !== action.listId) return list;
        const items = list.items.map((item) => (item.id === action.itemId ? { ...item, ...action.patch } : item));
        return { ...list, items };
      });
      return { ...state, gearLists };
    }
    case 'UPDATE_UNLINKED_LIST_ITEM': {
      const gearLists = state.gearLists.map((list) => {
        if (list.id !== action.listId) return list;
        const items = list.items.map((item) => (item.id === action.itemId ? { ...item, ...action.patch } : item));
        return { ...list, items };
      });
      return { ...state, gearLists };
    }
    case 'RELINK_LIST_ITEM': {
      const gearItem = state.gearItems.find((g) => g.id === action.gearItemId);
      if (!gearItem) return state;
      const mirror = mirrorFromVault(gearItem, state.categories);
      const gearLists = state.gearLists.map((list) => {
        if (list.id !== action.listId) return list;
        const items = list.items.map((item) =>
          item.id === action.itemId
            ? { ...item, gearItemId: gearItem.id, name: mirror.name, categoryName: mirror.categoryName, weightGrams: mirror.weightGrams }
            : item
        );
        return { ...list, items };
      });
      return { ...state, gearLists };
    }
    case 'REMOVE_LIST_ITEM': {
      const gearLists = state.gearLists.map((list) =>
        list.id === action.listId ? { ...list, items: list.items.filter((i) => i.id !== action.itemId) } : list
      );
      return { ...state, gearLists };
    }
    case 'REORDER_LIST_ITEMS': {
      const gearLists = state.gearLists.map((list) => {
        if (list.id !== action.listId) return list;
        const reordered = reorderById(sortByOrder(list.items), action.sourceId, action.targetId);
        return { ...list, items: withSequentialOrder(reordered) };
      });
      return { ...state, gearLists };
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
      const reordered = reorderById(sortByOrder(state.gearLists), action.sourceId, action.targetId);
      return { ...state, gearLists: withSequentialOrder(reordered) };
    }
    case 'DELETE_LIST': {
      return { ...state, gearLists: state.gearLists.filter((l) => l.id !== action.listId) };
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

/** FR-5: propaguje editaci Gear Vault položky do všech gearlistů, kde je "linked". */
function syncLinkedItemsAfterVaultEdit(list: GearList, updated: GearItem, categories: Category[]): GearList {
  const mirror = mirrorFromVault(updated, categories);
  const items = list.items.map((item) => {
    if (item.gearItemId !== updated.id) return item;
    return { ...item, name: mirror.name, categoryName: mirror.categoryName, weightGrams: mirror.weightGrams };
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

function syncLinkedItemsAfterCategoryRename(list: GearList, gearItems: GearItem[], categories: Category[]): GearList {
  const items = list.items.map((item) => {
    if (!item.gearItemId) return item;
    const gearItem = gearItems.find((g) => g.id === item.gearItemId);
    if (!gearItem) return item;
    return { ...item, categoryName: categoryNameFor(gearItem.categoryId, categories) };
  });
  return { ...list, items };
}

interface AppContextValue {
  state: AppState;
  addCategory: (name: string) => string;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (sourceId: string, targetId: string) => void;
  addGearItem: (item: GearItemPatch) => string;
  updateGearItem: (id: string, patch: GearItemPatch) => void;
  /** removeFromLists: true = also remove its rows from every gearlist ("Delete everywhere");
   * false = keep those rows as unlinked custom entries. Snapshots are never touched. */
  deleteGearItem: (id: string, removeFromLists: boolean) => void;
  reorderGearItems: (sourceId: string, targetId: string, targetCategoryId: string | null) => void;
  createList: (name: string) => string;
  addItemToList: (listId: string, gearItemId: string, quantity: number) => void;
  updateListItem: (listId: string, itemId: string, patch: ListItemEditablePatch) => void;
  updateUnlinkedListItem: (listId: string, itemId: string, patch: UnlinkedItemPatch) => void;
  /** FR-5 "Continue": propaguje editaci do Vault položky (a tedy do všech gearlistů, kde je linked). */
  continueEditLinkedItem: (gearItemId: string, patch: GearItemPatch) => void;
  /** FR-5 "Create a copy of the item": vytvoří novou Vault položku a přepojí na ni jen tento konkrétní řádek gearlistu. */
  copyAndRelinkListItem: (listId: string, itemId: string, patch: GearItemPatch) => void;
  removeListItem: (listId: string, itemId: string) => void;
  reorderListItems: (listId: string, sourceId: string, targetId: string) => void;
  saveSnapshot: (listId: string) => void;
  reorderLists: (sourceId: string, targetId: string) => void;
  deleteList: (listId: string) => void;
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
      reorderCategories: (sourceId, targetId) => dispatch({ type: 'REORDER_CATEGORIES', sourceId, targetId }),
      addGearItem: (item) => {
        const id = newId('gear');
        dispatch({ type: 'ADD_GEAR_ITEM', id, item });
        return id;
      },
      updateGearItem: (id, patch) => dispatch({ type: 'UPDATE_GEAR_ITEM', id, patch }),
      deleteGearItem: (id, removeFromLists) => dispatch({ type: 'DELETE_GEAR_ITEM', id, removeFromLists }),
      reorderGearItems: (sourceId, targetId, targetCategoryId) =>
        dispatch({ type: 'REORDER_GEAR_ITEMS', sourceId, targetId, targetCategoryId }),
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
      reorderListItems: (listId, sourceId, targetId) => dispatch({ type: 'REORDER_LIST_ITEMS', listId, sourceId, targetId }),
      saveSnapshot: (listId) => dispatch({ type: 'SAVE_SNAPSHOT', listId }),
      reorderLists: (sourceId, targetId) => dispatch({ type: 'REORDER_LISTS', sourceId, targetId }),
      deleteList: (listId) => dispatch({ type: 'DELETE_LIST', listId }),
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
