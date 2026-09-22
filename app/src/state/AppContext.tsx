import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { loadState, saveState } from '../storage';
import { newId } from '../utils/id';
import { categoryNameFor, mirrorFromVault } from './logic';
import type {
  AppState,
  Category,
  DraftGearList,
  FinalizedGearList,
  GearItem,
  GearList,
  GearListItem,
  UnitPreference,
  WeightType,
} from '../types';

type Action =
  | { type: 'ADD_CATEGORY'; name: string }
  | { type: 'RENAME_CATEGORY'; id: string; name: string }
  | { type: 'DELETE_CATEGORY'; id: string }
  | { type: 'ADD_GEAR_ITEM'; item: Omit<GearItem, 'id'> }
  | { type: 'UPDATE_GEAR_ITEM'; id: string; patch: Omit<GearItem, 'id'> }
  | { type: 'DELETE_GEAR_ITEM'; id: string }
  | { type: 'CREATE_DRAFT_LIST'; id: string; name: string }
  | { type: 'ADD_ITEM_TO_LIST'; listId: string; gearItemId: string; quantity: number }
  | {
      type: 'UPDATE_LIST_ITEM';
      listId: string;
      itemId: string;
      patch: Partial<Pick<GearListItem, 'quantity' | 'weightTypeOverride' | 'name' | 'categoryName' | 'weightGrams' | 'note'>>;
    }
  | { type: 'REMOVE_LIST_ITEM'; listId: string; itemId: string }
  | { type: 'FINALIZE_LIST'; listId: string }
  | { type: 'DUPLICATE_LIST_AS_DRAFT'; sourceListId: string; newListId: string }
  | { type: 'DELETE_LIST'; listId: string }
  | { type: 'SET_UNIT_PREFERENCE'; pref: UnitPreference };

function effectiveWeightType(vaultType: WeightType, override: WeightType | null): WeightType {
  return override ?? vaultType;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_CATEGORY': {
      const category: Category = { id: newId('cat'), name: action.name };
      return { ...state, categories: [...state.categories, category] };
    }
    case 'RENAME_CATEGORY': {
      const categories = state.categories.map((c) => (c.id === action.id ? { ...c, name: action.name } : c));
      // Přejmenování kategorie se u "linked" položek v Draft gearlistech promítne hned
      // (categoryName je jen zrcadlo, dokud item odkazuje na Vault). U Finalized a
      // odpojených (unlinked) položek zůstává zmrazené jméno — to je záměr.
      const gearLists = state.gearLists.map((list) =>
        syncLinkedItemsAfterCategoryRename(list, state.gearItems, categories)
      );
      return { ...state, categories, gearLists };
    }
    case 'DELETE_CATEGORY': {
      const categories = state.categories.filter((c) => c.id !== action.id);
      const gearItems = state.gearItems.map((item) =>
        item.categoryId === action.id ? { ...item, categoryId: null } : item
      );
      const gearLists = state.gearLists.map((list) => syncLinkedItemsAfterCategoryRename(list, gearItems, categories));
      return { ...state, categories, gearItems, gearLists };
    }
    case 'ADD_GEAR_ITEM': {
      const item: GearItem = { ...action.item, id: newId('gear') };
      return { ...state, gearItems: [...state.gearItems, item] };
    }
    case 'UPDATE_GEAR_ITEM': {
      const gearItems = state.gearItems.map((g) => (g.id === action.id ? { ...action.patch, id: action.id } : g));
      const updated = gearItems.find((g) => g.id === action.id)!;
      const gearLists = state.gearLists.map((list) => syncLinkedItemsAfterVaultEdit(list, updated, state.categories));
      return { ...state, gearItems, gearLists };
    }
    case 'DELETE_GEAR_ITEM': {
      const gearItems = state.gearItems.filter((g) => g.id !== action.id);
      // Odpojí (detach) položky v Draft gearlistech, které na smazanou položku odkazovaly —
      // zůstanou tam s posledními známými hodnotami, ale dál nezávisle editovatelné.
      const gearLists = state.gearLists.map((list) => detachDeletedItem(list, action.id));
      return { ...state, gearItems, gearLists };
    }
    case 'CREATE_DRAFT_LIST': {
      const list: DraftGearList = {
        id: action.id,
        name: action.name,
        status: 'draft',
        createdAt: new Date().toISOString(),
        items: [],
      };
      return { ...state, gearLists: [...state.gearLists, list] };
    }
    case 'ADD_ITEM_TO_LIST': {
      const gearItem = state.gearItems.find((g) => g.id === action.gearItemId);
      if (!gearItem) return state;
      const mirror = mirrorFromVault(gearItem, state.categories);
      const listItem: GearListItem = {
        id: newId('li'),
        gearItemId: gearItem.id,
        name: mirror.name,
        categoryName: mirror.categoryName,
        weightGrams: mirror.weightGrams,
        weightType: mirror.vaultWeightType,
        weightTypeOverride: null,
        quantity: action.quantity,
        note: gearItem.note,
      };
      const gearLists = state.gearLists.map((list) =>
        list.id === action.listId && list.status === 'draft'
          ? { ...list, items: [...list.items, listItem] }
          : list
      );
      return { ...state, gearLists };
    }
    case 'UPDATE_LIST_ITEM': {
      const gearLists = state.gearLists.map((list) => {
        if (list.id !== action.listId || list.status !== 'draft') return list;
        const items = list.items.map((item) => {
          if (item.id !== action.itemId) return item;
          const next = { ...item, ...action.patch };
          if (action.patch.weightTypeOverride !== undefined) {
            const gearItem = state.gearItems.find((g) => g.id === item.gearItemId);
            next.weightType = item.gearItemId
              ? effectiveWeightType(gearItem?.weightType ?? item.weightType, action.patch.weightTypeOverride)
              : action.patch.weightTypeOverride ?? next.weightType;
          }
          return next;
        });
        return { ...list, items };
      });
      return { ...state, gearLists };
    }
    case 'REMOVE_LIST_ITEM': {
      const gearLists = state.gearLists.map((list) =>
        list.id === action.listId && list.status === 'draft'
          ? { ...list, items: list.items.filter((i) => i.id !== action.itemId) }
          : list
      );
      return { ...state, gearLists };
    }
    case 'FINALIZE_LIST': {
      const gearLists = state.gearLists.map((list): GearList => {
        if (list.id !== action.listId || list.status !== 'draft') return list;
        const finalized: FinalizedGearList = {
          id: list.id,
          name: list.name,
          createdAt: list.createdAt,
          status: 'finalized',
          finalizedAt: new Date().toISOString(),
          // Odpojení od Gear Vaultu — od teď je to nezávislá zmrazená kopie (FR-6).
          items: list.items.map((item) => ({ ...item, gearItemId: null })),
        };
        return finalized;
      });
      return { ...state, gearLists };
    }
    case 'DUPLICATE_LIST_AS_DRAFT': {
      const source = state.gearLists.find((l) => l.id === action.sourceListId);
      if (!source) return state;
      const copy: DraftGearList = {
        id: action.newListId,
        name: `${source.name} (copy)`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        items: source.items.map((item) => ({ ...item, id: newId('li') })),
      };
      return { ...state, gearLists: [...state.gearLists, copy] };
    }
    case 'DELETE_LIST': {
      return { ...state, gearLists: state.gearLists.filter((l) => l.id !== action.listId) };
    }
    case 'SET_UNIT_PREFERENCE': {
      return { ...state, unitPreference: action.pref };
    }
    default:
      return state;
  }
}

/** FR-5: propaguje editaci Gear Vault položky do všech Draft gearlistů, kde je "linked". */
function syncLinkedItemsAfterVaultEdit(list: GearList, updated: GearItem, categories: Category[]): GearList {
  if (list.status !== 'draft') return list;
  const mirror = mirrorFromVault(updated, categories);
  const items = list.items.map((item) => {
    if (item.gearItemId !== updated.id) return item;
    return {
      ...item,
      name: mirror.name,
      categoryName: mirror.categoryName,
      weightGrams: mirror.weightGrams,
      weightType: effectiveWeightType(mirror.vaultWeightType, item.weightTypeOverride),
    };
  });
  return { ...list, items };
}

function detachDeletedItem(list: GearList, deletedGearItemId: string): GearList {
  if (list.status !== 'draft') return list;
  const items = list.items.map((item) => (item.gearItemId === deletedGearItemId ? { ...item, gearItemId: null } : item));
  return { ...list, items };
}

function syncLinkedItemsAfterCategoryRename(list: GearList, gearItems: GearItem[], categories: Category[]): GearList {
  if (list.status !== 'draft') return list;
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
  addCategory: (name: string) => void;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  addGearItem: (item: Omit<GearItem, 'id'>) => void;
  updateGearItem: (id: string, patch: Omit<GearItem, 'id'>) => void;
  deleteGearItem: (id: string) => void;
  createDraftList: (name: string) => string;
  addItemToList: (listId: string, gearItemId: string, quantity: number) => void;
  updateListItem: (
    listId: string,
    itemId: string,
    patch: Partial<Pick<GearListItem, 'quantity' | 'weightTypeOverride' | 'name' | 'categoryName' | 'weightGrams' | 'note'>>
  ) => void;
  removeListItem: (listId: string, itemId: string) => void;
  finalizeList: (listId: string) => void;
  duplicateListAsDraft: (sourceListId: string) => string;
  deleteList: (listId: string) => void;
  setUnitPreference: (pref: UnitPreference) => void;
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
      addCategory: (name) => dispatch({ type: 'ADD_CATEGORY', name }),
      renameCategory: (id, name) => dispatch({ type: 'RENAME_CATEGORY', id, name }),
      deleteCategory: (id) => dispatch({ type: 'DELETE_CATEGORY', id }),
      addGearItem: (item) => dispatch({ type: 'ADD_GEAR_ITEM', item }),
      updateGearItem: (id, patch) => dispatch({ type: 'UPDATE_GEAR_ITEM', id, patch }),
      deleteGearItem: (id) => dispatch({ type: 'DELETE_GEAR_ITEM', id }),
      createDraftList: (name) => {
        const id = newId('list');
        dispatch({ type: 'CREATE_DRAFT_LIST', id, name });
        return id;
      },
      addItemToList: (listId, gearItemId, quantity) =>
        dispatch({ type: 'ADD_ITEM_TO_LIST', listId, gearItemId, quantity }),
      updateListItem: (listId, itemId, patch) => dispatch({ type: 'UPDATE_LIST_ITEM', listId, itemId, patch }),
      removeListItem: (listId, itemId) => dispatch({ type: 'REMOVE_LIST_ITEM', listId, itemId }),
      finalizeList: (listId) => dispatch({ type: 'FINALIZE_LIST', listId }),
      duplicateListAsDraft: (sourceListId) => {
        const newListId = newId('list');
        dispatch({ type: 'DUPLICATE_LIST_AS_DRAFT', sourceListId, newListId });
        return newListId;
      },
      deleteList: (listId) => dispatch({ type: 'DELETE_LIST', listId }),
      setUnitPreference: (pref) => dispatch({ type: 'SET_UNIT_PREFERENCE', pref }),
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp musí být použito uvnitř <AppProvider>.');
  return ctx;
}

export { categoryNameFor };
