import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { newId } from '../utils/id';
import { categoryNameFor } from './logic';
import type { GearItemPatch, ListItemEditablePatch, Operation, UnlinkedItemPatch } from '../core/operations';
import type { AppState, UnitPreference } from '../types';

/** Where the app's data lives: in this browser (guest, PRD FR-14–FR-17) or in the user's
 * account on the server (signed in, FR-23/FR-24). Either way every change is an Operation
 * from the shared operations layer (src/core/operations.ts). */
export interface AppStore {
  state: AppState;
  dispatch: (op: Operation) => void;
  /** Wholesale swap: guest Import backup, demo data, data file (FR-14, FR-16, FR-17). */
  replaceState: (state: AppState) => void;
}

interface AppContextValue {
  state: AppState;
  addCategory: (name: string) => string;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (sourceId: string, targetId: string, after?: boolean) => void;
  addGearItem: (item: GearItemPatch) => string;
  /** choice: 'update_everywhere' when the user picked Continue in the FR-5 dialog. */
  updateGearItem: (id: string, patch: GearItemPatch, choice?: 'update_everywhere') => void;
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

export function AppProvider({ store, children }: { store: AppStore; children: ReactNode }) {
  const { state, dispatch, replaceState } = store;
  const now = () => new Date().toISOString();

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
      updateGearItem: (id, patch, choice) => dispatch({ type: 'UPDATE_GEAR_ITEM', id, patch, choice }),
      deleteGearItem: (id, removeFromLists) => dispatch({ type: 'DELETE_GEAR_ITEM', id, removeFromLists }),
      reorderGearItems: (sourceId, targetId, targetCategoryId, after) =>
        dispatch({ type: 'REORDER_GEAR_ITEMS', sourceId, targetId, targetCategoryId, after }),
      createList: (name) => {
        const id = newId('list');
        dispatch({ type: 'CREATE_LIST', id, name, createdAt: now() });
        return id;
      },
      addItemToList: (listId, gearItemId, quantity) => dispatch({ type: 'ADD_ITEM_TO_LIST', listId, gearItemId, quantity, rowId: newId('li') }),
      updateListItem: (listId, itemId, patch) => dispatch({ type: 'UPDATE_LIST_ITEM', listId, itemId, patch }),
      updateUnlinkedListItem: (listId, itemId, patch) => dispatch({ type: 'UPDATE_UNLINKED_LIST_ITEM', listId, itemId, patch }),
      // Called after the user chose Continue, or when the row is the item's only use (FR-5).
      continueEditLinkedItem: (gearItemId, patch) => dispatch({ type: 'UPDATE_GEAR_ITEM', id: gearItemId, patch, choice: 'update_everywhere' }),
      copyAndRelinkListItem: (listId, itemId, patch) =>
        dispatch({ type: 'COPY_AND_RELINK_LIST_ITEM', listId, itemId, newGearItemId: newId('gear'), item: patch }),
      removeListItem: (listId, itemId) => dispatch({ type: 'REMOVE_LIST_ITEM', listId, itemId }),
      reorderListItems: (listId, sourceId, targetId, after) => dispatch({ type: 'REORDER_LIST_ITEMS', listId, sourceId, targetId, after }),
      reorderListCategories: (listId, sourceName, targetName, after) =>
        dispatch({ type: 'REORDER_LIST_CATEGORIES', listId, sourceName, targetName, after }),
      // The UI has already asked (ConfirmDialog), so overwriting an existing snapshot is confirmed.
      saveSnapshot: (listId) => dispatch({ type: 'SAVE_SNAPSHOT', listId, savedAt: now(), overwrite: true }),
      reorderLists: (sourceId, targetId, after) => dispatch({ type: 'REORDER_LISTS', sourceId, targetId, after }),
      deleteList: (listId) => dispatch({ type: 'DELETE_LIST', listId }),
      saveAsTemplate: (listId) =>
        dispatch({ type: 'SAVE_AS_TEMPLATE', listId, templateId: newId('tpl'), createdAt: now(), rowIdPrefix: newId('ti'), replace: true }),
      deleteTemplate: (templateId) => dispatch({ type: 'DELETE_TEMPLATE', templateId }),
      createListFromTemplate: (name, templateId) => {
        const id = newId('list');
        dispatch({ type: 'CREATE_LIST_FROM_TEMPLATE', id, name, templateId, createdAt: now(), rowIdPrefix: newId('li') });
        return id;
      },
      dismissTemplateBanner: () => dispatch({ type: 'DISMISS_TEMPLATE_BANNER' }),
      setUnitPreference: (pref) => dispatch({ type: 'SET_UNIT_PREFERENCE', pref }),
      replaceState,
    }),
    [state, dispatch, replaceState]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>.');
  return ctx;
}

export { categoryNameFor };
