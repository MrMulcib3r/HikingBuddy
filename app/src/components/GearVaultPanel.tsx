import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { findAffectedLists } from '../state/logic';
import type { GearItem } from '../types';
import { UNCATEGORIZED } from '../types';
import { fromGrams, formatWeight, toGrams } from '../utils/weight';
import { sortByOrder } from '../utils/reorder';
import { makeDragHandlers } from '../utils/dnd';
import { ConfirmDialog } from './ConfirmDialog';
import { VaultEditDialog } from './VaultEditDialog';
import { GearItemFormDialog } from './GearItemFormDialog';
import { CategoryManager } from './CategoryManager';
import { InlineTextField, InlineNumberField } from './InlineField';
import { InlineCategorySelect } from './InlineCategorySelect';

const UNCATEGORIZED_FILTER = '__uncategorized__';

type CoreFieldPatch = Pick<GearItem, 'name' | 'categoryId' | 'weightGrams'>;

/** A pending edit to a "core" field (name/category/weight) that is used elsewhere and so
 * needs the Cancel / Create a copy / Continue dialog (FR-5). */
interface PendingCoreEdit {
  item: GearItem;
  patch: CoreFieldPatch;
  affectedCount: number;
}

export function GearVaultPanel() {
  const { state, addGearItem, updateGearItem, deleteGearItem, addCategory, reorderGearItems, reorderCategories } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [pendingCoreEdit, setPendingCoreEdit] = useState<PendingCoreEdit | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; affectedCount: number } | null>(null);

  const filteredItems = useMemo(() => {
    return state.gearItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory =
        !categoryFilter || (categoryFilter === UNCATEGORIZED_FILTER ? !item.categoryId : item.categoryId === categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [state.gearItems, search, categoryFilter]);

  const sortedCategories = useMemo(() => sortByOrder(state.categories), [state.categories]);

  const grouped = useMemo(() => {
    const map = new Map<string, GearItem[]>();
    for (const item of sortByOrder(filteredItems)) {
      const key = item.categoryId ?? UNCATEGORIZED_FILTER;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [filteredItems]);

  const orderedGroupKeys = useMemo(() => {
    const keys = sortedCategories.map((c) => c.id).filter((id) => grouped.has(id));
    if (grouped.has(UNCATEGORIZED_FILTER)) keys.push(UNCATEGORIZED_FILTER);
    return keys;
  }, [sortedCategories, grouped]);

  function categoryName(key: string): string {
    if (key === UNCATEGORIZED_FILTER) return UNCATEGORIZED;
    return state.categories.find((c) => c.id === key)?.name ?? UNCATEGORIZED;
  }

  /** Any edit to name/category/weight goes through here — if the item isn't used in any
   * gearlist yet, it applies immediately; otherwise it opens the Cancel/Copy/Continue dialog. */
  function requestCoreEdit(item: GearItem, patch: Partial<CoreFieldPatch>) {
    const fullPatch: CoreFieldPatch = {
      name: patch.name ?? item.name,
      categoryId: patch.categoryId !== undefined ? patch.categoryId : item.categoryId,
      weightGrams: patch.weightGrams ?? item.weightGrams,
    };
    const affected = findAffectedLists(state, item.id);
    if (affected.length === 0) {
      updateGearItem(item.id, { ...fullPatch, defaultQuantity: item.defaultQuantity, note: item.note });
      return;
    }
    setPendingCoreEdit({ item, patch: fullPatch, affectedCount: affected.length });
  }

  function requestDelete(item: GearItem) {
    const affected = findAffectedLists(state, item.id);
    setPendingDelete({ id: item.id, name: item.name, affectedCount: affected.length });
  }

  return (
    <section className="panel gear-vault-panel">
      <header className="panel-header">
        <h2>Gear Vault</h2>
        <div className="panel-header-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setCategoryManagerOpen(true)}>
            Categories
          </button>
          <button type="button" className="btn btn-primary btn-small" onClick={() => setFormOpen(true)}>
            + Add item
          </button>
        </div>
      </header>

      <div className="vault-filters">
        <input
          type="search"
          placeholder="Search gear…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {sortedCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={UNCATEGORIZED_FILTER}>Uncategorized</option>
        </select>
      </div>

      <div className="vault-list">
        {state.gearItems.length === 0 && <p className="empty-hint">Gear Vault is empty — add your first item.</p>}
        {orderedGroupKeys.map((key) => {
          const items = grouped.get(key)!;
          const category = key === UNCATEGORIZED_FILTER ? null : state.categories.find((c) => c.id === key) ?? null;
          return (
            <div
              key={key}
              className="vault-category-group"
              {...(category ? makeDragHandlers(category.id, reorderCategories) : {})}
            >
              <h3 className="vault-category-title" title={category ? 'Drag to reorder categories' : undefined}>
                {category ? '⠿ ' : ''}
                {categoryName(key)}
              </h3>
              {items.map((item) => (
                <VaultItemRow
                  key={item.id}
                  item={item}
                  unitPreference={state.unitPreference}
                  categories={state.categories}
                  onCreateCategory={addCategory}
                  onEditCore={(patch) => requestCoreEdit(item, patch)}
                  onEditQuantity={(defaultQuantity) => updateGearItem(item.id, { ...item, defaultQuantity })}
                  onEditNote={(note) => updateGearItem(item.id, { ...item, note })}
                  onDelete={() => requestDelete(item)}
                  onReorder={(sourceId, targetId) => reorderGearItems(sourceId, targetId, item.categoryId)}
                />
              ))}
            </div>
          );
        })}
      </div>

      {formOpen && (
        <GearItemFormDialog
          categories={state.categories}
          unitPreference={state.unitPreference}
          onSubmit={(data) => {
            addGearItem(data);
            setFormOpen(false);
          }}
          onCreateCategory={addCategory}
          onCancel={() => setFormOpen(false)}
        />
      )}

      {categoryManagerOpen && <CategoryManager onClose={() => setCategoryManagerOpen(false)} />}

      {pendingCoreEdit && (
        <VaultEditDialog
          title="This item is used in existing gearlists"
          message={`"${pendingCoreEdit.item.name}" is used in ${pendingCoreEdit.affectedCount} gearlist(s). Do you want to update it everywhere it's used, or keep those unchanged and create a separate copy with the new values?`}
          onCancel={() => setPendingCoreEdit(null)}
          onCopy={() => {
            addGearItem({
              ...pendingCoreEdit.patch,
              defaultQuantity: pendingCoreEdit.item.defaultQuantity,
              note: pendingCoreEdit.item.note,
            });
            setPendingCoreEdit(null);
          }}
          onContinue={() => {
            updateGearItem(pendingCoreEdit.item.id, {
              ...pendingCoreEdit.patch,
              defaultQuantity: pendingCoreEdit.item.defaultQuantity,
              note: pendingCoreEdit.item.note,
            });
            setPendingCoreEdit(null);
          }}
        />
      )}

      {/* Deleting an item that gearlists use is the same kind of change as editing it
          (FR-5): blocking 3-way choice, never silent. */}
      {pendingDelete && pendingDelete.affectedCount > 0 && (
        <VaultEditDialog
          title="This item is used in existing gearlists"
          message={`"${pendingDelete.name}" is used in ${pendingDelete.affectedCount} gearlist(s). Do you want to remove it from those gearlists too, or keep it there as a custom entry that is no longer linked to Gear Vault? Saved snapshots are never changed.`}
          copyLabel="Keep in gearlists"
          continueLabel="Delete everywhere"
          continueDanger
          onCancel={() => setPendingDelete(null)}
          onCopy={() => {
            deleteGearItem(pendingDelete.id, false);
            setPendingDelete(null);
          }}
          onContinue={() => {
            deleteGearItem(pendingDelete.id, true);
            setPendingDelete(null);
          }}
        />
      )}

      {pendingDelete && pendingDelete.affectedCount === 0 && (
        <ConfirmDialog
          title="Delete item from Gear Vault"
          danger
          message={`Delete "${pendingDelete.name}" from Gear Vault?`}
          confirmLabel="Delete"
          onConfirm={() => {
            deleteGearItem(pendingDelete.id, false);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
}

interface VaultItemRowProps {
  item: GearItem;
  unitPreference: import('../types').UnitPreference;
  categories: import('../types').Category[];
  onCreateCategory: (name: string) => string;
  onEditCore: (patch: Partial<CoreFieldPatch>) => void;
  onEditQuantity: (quantity: number) => void;
  onEditNote: (note: string) => void;
  onDelete: () => void;
  onReorder: (sourceId: string, targetId: string) => void;
}

function VaultItemRow({ item, unitPreference, categories, onCreateCategory, onEditCore, onEditQuantity, onEditNote, onDelete, onReorder }: VaultItemRowProps) {
  const dragProps = makeDragHandlers(item.id, onReorder);
  const categoryName = categories.find((c) => c.id === item.categoryId)?.name ?? UNCATEGORIZED;

  return (
    <div className="vault-item-row" {...dragProps}>
      <span className="drag-handle" title="Drag to reorder">
        ⠿
      </span>
      <div className="vault-item-main">
        <InlineTextField className="vault-item-name" value={item.name} onCommit={(name) => onEditCore({ name })} />
        <InlineTextField
          className="vault-item-note"
          value={item.note}
          placeholder="Add a note…"
          allowEmpty
          onCommit={onEditNote}
        />
      </div>
      <div className="vault-item-props">
        <InlineCategorySelect
          categories={categories}
          categoryId={item.categoryId}
          categoryName={categoryName}
          onChange={(categoryId) => onEditCore({ categoryId })}
          onCreateCategory={onCreateCategory}
        />
        <InlineNumberField
          className="vault-item-weight"
          value={fromGrams(item.weightGrams, unitPreference)}
          format={(v) => formatWeight(toGrams(v, unitPreference), unitPreference)}
          onCommit={(v) => onEditCore({ weightGrams: toGrams(v, unitPreference) })}
        />
        <InlineNumberField
          className="vault-item-qty"
          value={item.defaultQuantity}
          min={1}
          integer
          format={(v) => `×${v}`}
          onCommit={onEditQuantity}
        />
      </div>
      <div className="vault-item-actions">
        <button type="button" className="btn btn-ghost btn-small" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
