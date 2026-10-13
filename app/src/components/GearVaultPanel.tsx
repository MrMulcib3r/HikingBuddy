import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { describeUsage, findAffectedLists, findAffectedTemplates } from '../state/logic';
import { TEMPLATE_NAME } from '../constants';
import type { GearItem } from '../types';
import { UNCATEGORIZED } from '../types';
import { fromGrams, formatWeight, toGrams } from '../utils/weight';
import { sortByOrder } from '../utils/reorder';
import { makeDragHandlers } from '../utils/dnd';
import { ConfirmDialog } from './ConfirmDialog';
import { plural } from '../utils/text';
import { VaultEditDialog } from './VaultEditDialog';
import { GearItemFormDialog } from './GearItemFormDialog';
import { CategoryManager } from './CategoryManager';
import { InlineTextField, InlineNumberField } from './InlineField';
import { InlineCategorySelect } from './InlineCategorySelect';
import { CategoryIcon } from './CategoryIcon';
import { ActionIcon } from './icons/actionIcons';
import { CarabinerIcon } from './icons/HikerIcons';
import { Badge, Icon, IconButton } from './ui';
import { categoryColor, categoryColorKey } from '../utils/categoryStyle';

const UNCATEGORIZED_FILTER = '__uncategorized__';

type CoreFieldPatch = Pick<GearItem, 'name' | 'categoryId' | 'weightGrams'>;

/** A pending edit to a "core" field (name/category/weight) that is used elsewhere and so
 * needs the Cancel / Create a copy / Continue dialog (FR-5). */
interface PendingCoreEdit {
  item: GearItem;
  patch: CoreFieldPatch;
  /** e.g. "2 gearlists and your template" */
  usage: string;
  affectedNames: string[];
}

interface PendingDelete {
  id: string;
  name: string;
  listCount: number;
  inTemplate: boolean;
  affectedNames: string[];
}

export function GearVaultPanel() {
  const { state, addGearItem, updateGearItem, deleteGearItem, addCategory, renameCategory, deleteCategory, reorderGearItems, reorderCategories } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  // null = form closed. Otherwise the form is open: from a category's own "Add item" with
  // that category preselected, or from "+ Add gear" / the Uncategorized group with nothing
  // selected (Martin, 2026-10-14 — "+ Other" is never preselected any more).
  const [addForm, setAddForm] = useState<{ categoryId: string | null } | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [pendingCoreEdit, setPendingCoreEdit] = useState<PendingCoreEdit | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const filteredItems = useMemo(() => {
    return state.gearItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory =
        !categoryFilter || (categoryFilter === UNCATEGORIZED_FILTER ? !item.categoryId : item.categoryId === categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [state.gearItems, search, categoryFilter]);

  const itemCountsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of state.gearItems) if (g.categoryId) counts[g.categoryId] = (counts[g.categoryId] ?? 0) + 1;
    return counts;
  }, [state.gearItems]);

  const sortedCategories = useMemo(() => sortByOrder(state.categories), [state.categories]);

  /** Where each Vault item is used, for the "N lists" badge on rows (design system v2). The
   * template counts as one of the lists (Martin, 2026-10-13). */
  const usageByItem = useMemo(() => {
    const usage = new Map<string, Usage>();
    for (const g of state.gearItems) {
      const lists = findAffectedLists(state, g.id).length;
      const templates = findAffectedTemplates(state, g.id).length;
      if (lists + templates > 0) usage.set(g.id, { count: lists + templates, text: describeUsage(lists, templates) });
    }
    return usage;
  }, [state]);

  const grouped = useMemo(() => {
    const map = new Map<string, GearItem[]>();
    for (const item of sortByOrder(filteredItems)) {
      const key = item.categoryId ?? UNCATEGORIZED_FILTER;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [filteredItems]);

  /** Only categories that actually contain gear are shown (empty ones would just be noise).
   * Adding into a category that isn't in the Vault yet goes through "+ Add gear" in the
   * header, which is always visible. */
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
    const templates = findAffectedTemplates(state, item.id);
    // The template counts as "used elsewhere" too (T-5).
    if (affected.length === 0 && templates.length === 0) {
      updateGearItem(item.id, { ...fullPatch, defaultQuantity: item.defaultQuantity, note: item.note });
      return;
    }
    setPendingCoreEdit({
      item,
      patch: fullPatch,
      usage: describeUsage(affected.length, templates.length),
      affectedNames: [...templates.map(() => TEMPLATE_NAME), ...affected.map((l) => l.name)],
    });
  }

  function requestDelete(item: GearItem) {
    const affected = findAffectedLists(state, item.id);
    const templates = findAffectedTemplates(state, item.id);
    setPendingDelete({
      id: item.id,
      name: item.name,
      listCount: affected.length,
      inTemplate: templates.length > 0,
      affectedNames: [...templates.map(() => TEMPLATE_NAME), ...affected.map((l) => l.name)],
    });
  }

  return (
    <section className="panel gear-vault-panel">
      <header className="panel-header">
        <h2 className="panel-title">Gear Vault</h2>
        <div className="panel-header-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setCategoryManagerOpen(true)}>
            Categories
          </button>
        </div>
      </header>

      <div className="panel-body">
        <div className="vault-filters">
          <div className="search">
            <Icon icon={ActionIcon.search} />
            <input
              type="search"
              placeholder="Search gear…"
              aria-label="Search gear"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <select className="select" aria-label="Category filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
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
          {state.gearItems.length > 0 && orderedGroupKeys.length === 0 && <p className="empty-hint">No gear matches your search or filter.</p>}
          {orderedGroupKeys.map((key) => {
            const items = grouped.get(key) ?? [];
            const category = key === UNCATEGORIZED_FILTER ? null : state.categories.find((c) => c.id === key) ?? null;
            const total = items.reduce((sum, g) => sum + g.weightGrams * g.defaultQuantity, 0);
            return (
              <div key={key} className="vault-category-group" {...(category ? makeDragHandlers(category.id, reorderCategories, 'category') : {})}>
                <h3 className="vault-category-title">
                  {category && (
                    <span className="vault-category-handle" title="Drag to reorder categories">
                      <Icon icon={ActionIcon.drag} size={16} />
                    </span>
                  )}
                  <span className="category-dot" style={{ background: categoryColor(categoryColorKey(category?.id, state.categories)) }} aria-hidden="true" />
                  <span className="category-heading-icon">
                    <CategoryIcon id={category?.id} name={categoryName(key)} size={18} />
                  </span>
                  {/* Click the name to rename the category (FR-2) — same inline editing as
                      everywhere else; renaming updates every gearlist row linked to it. */}
                  {category ? (
                    <InlineTextField className="vault-category-name" value={category.name} onCommit={(name) => renameCategory(category.id, name)} />
                  ) : (
                    <span className="category-heading-text">{categoryName(key)}</span>
                  )}
                  <span className="category-total">{formatWeight(total, state.unitPreference)}</span>
                </h3>
                {items.map((item) => (
                  <VaultItemRow
                    key={item.id}
                    item={item}
                    usage={usageByItem.get(item.id) ?? null}
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
                <AddItemButton onClick={() => setAddForm({ categoryId: category?.id ?? null })} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Main "add gear" action: a big full-width button pinned to the bottom of the Gear
          Vault panel — always visible while scrolling, easy to hit, and where a thumb
          reaches on a phone (BACKLOG, 2026-10-08). Opens the form with "Other" preselected,
          for categories that aren't in the Vault yet or brand-new ones. */}
      <div className="vault-add-gear-bar">
        <button type="button" className="btn btn-primary btn-block vault-add-gear" onClick={() => setAddForm({ categoryId: null })}>
          <Icon icon={ActionIcon.add} />
          Add gear
        </button>
      </div>

      {addForm && (
        <GearItemFormDialog
          categories={state.categories}
          unitPreference={state.unitPreference}
          initialCategoryId={addForm.categoryId}
          onDeleteCategory={deleteCategory}
          itemCounts={itemCountsByCategory}
          onSubmit={(data) => {
            addGearItem(data);
            setAddForm(null);
          }}
          onCreateCategory={addCategory}
          onCancel={() => setAddForm(null)}
        />
      )}

      {categoryManagerOpen && <CategoryManager onClose={() => setCategoryManagerOpen(false)} />}

      {pendingCoreEdit && (
        <VaultEditDialog
          title="This item is used elsewhere"
          message={`"${pendingCoreEdit.item.name}" is used in ${pendingCoreEdit.usage}. Do you want to update it everywhere it's used, or keep those unchanged and create a separate copy with the new values?`}
          affectedLists={pendingCoreEdit.affectedNames}
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
      {pendingDelete && pendingDelete.listCount > 0 && (
        <VaultEditDialog
          title="This item is used in existing gearlists"
          message={`"${pendingDelete.name}" is used in ${plural(pendingDelete.listCount, 'gearlist')}. Do you want to remove it from those gearlists too, or keep it there as a custom entry that is no longer linked to Gear Vault? Saved snapshots are never changed.${
            pendingDelete.inTemplate ? ' In both cases it is also removed from your template.' : ''
          }`}
          affectedLists={pendingDelete.affectedNames}
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

      {/* T-6: only in the template → still always a warning, never a silent delete. */}
      {pendingDelete && pendingDelete.listCount === 0 && (
        <ConfirmDialog
          title={pendingDelete.inTemplate ? 'This item is in your template' : 'Delete item from Gear Vault'}
          danger
          message={
            pendingDelete.inTemplate
              ? `"${pendingDelete.name}" is in your template. Deleting it will also remove it from the template.`
              : `Delete "${pendingDelete.name}" from Gear Vault?`
          }
          confirmLabel="Delete"
          confirmIcon={ActionIcon.delete}
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

/** "+ Add item" at the end of a category group (like lighterpack.com) — opens the add form
 * with that category already selected, so the button sits right where the item will land. */
function AddItemButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="vault-add-item" onClick={onClick}>
      <Icon icon={ActionIcon.add} size={16} />
      Add item
    </button>
  );
}

/** "2 gearlists and your template" + how many lists that is. */
interface Usage {
  count: number;
  text: string;
}

interface VaultItemRowProps {
  item: GearItem;
  /** Where the item is used, or null when it isn't used anywhere. */
  usage: Usage | null;
  unitPreference: import('../types').UnitPreference;
  categories: import('../types').Category[];
  onCreateCategory: (name: string) => string;
  onEditCore: (patch: Partial<CoreFieldPatch>) => void;
  onEditQuantity: (quantity: number) => void;
  onEditNote: (note: string) => void;
  onDelete: () => void;
  onReorder: (sourceId: string, targetId: string) => void;
}

function VaultItemRow({ item, usage, unitPreference, categories, onCreateCategory, onEditCore, onEditQuantity, onEditNote, onDelete, onReorder }: VaultItemRowProps) {
  const dragProps = makeDragHandlers(item.id, onReorder, 'gear');
  const categoryName = categories.find((c) => c.id === item.categoryId)?.name ?? UNCATEGORIZED;

  return (
    <div className="vault-item-row" {...dragProps}>
      <span className="drag-handle" title="Drag to reorder, or onto a gearlist to add it">
        <Icon icon={ActionIcon.drag} size={16} />
      </span>
      <div className="vault-item-main">
        <InlineTextField className="vault-item-name" value={item.name} onCommit={(name) => onEditCore({ name })} />
        {/* Second line: category (click to change, FR-12) · note */}
        <span className="row-meta">
          <span className="row-category">
            <InlineCategorySelect
              categories={categories}
              categoryId={item.categoryId}
              categoryName={categoryName}
              onChange={(categoryId) => onEditCore({ categoryId })}
              onCreateCategory={onCreateCategory}
            />
          </span>
          <span className="row-meta-sep" aria-hidden="true">·</span>
          <InlineTextField className="vault-item-note" value={item.note} placeholder="Add a note…" allowEmpty onCommit={onEditNote} />
        </span>
      </div>
      <span className="row-badges">
        {usage && (
          <Badge tone="linked" icon={CarabinerIcon} tip={`Used in ${usage.text}. Editing it changes these too.`} tipEnd>
            {usage.count === 1 ? '1 list' : `${usage.count} lists`}
          </Badge>
        )}
      </span>
      <InlineNumberField
        className="vault-item-weight"
        value={fromGrams(item.weightGrams, unitPreference)}
        format={(v) => formatWeight(toGrams(v, unitPreference), unitPreference)}
        onCommit={(v) => onEditCore({ weightGrams: toGrams(v, unitPreference) })}
      />
      <InlineNumberField className="vault-item-qty" value={item.defaultQuantity} min={1} integer format={(v) => `×${v}`} onCommit={onEditQuantity} />
      <div className="vault-item-actions">
        <IconButton label="Delete" icon={ActionIcon.delete} danger small tipEnd onClick={onDelete} />
      </div>
    </div>
  );
}
