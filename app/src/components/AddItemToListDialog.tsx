import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { formatWeight } from '../utils/weight';
import { sortByOrder } from '../utils/reorder';
import { categoryColor, categoryColorKey } from '../utils/categoryStyle';
import { UNCATEGORIZED } from '../types';
import type { GearItem } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { ActionIcon } from './icons/actionIcons';
import { Badge, Dialog, DialogActions, Icon } from './ui';

interface AddItemToListDialogProps {
  listId: string;
  onClose: () => void;
}

const NO_CATEGORY = '__none__';

/**
 * FR-4: add an item from Gear Vault into a gearlist (or the template), with a quantity.
 * Grouped by category like the Vault; items already in the list carry an "In list ×N" badge
 * (adding them again raises that quantity — no duplicate rows). Add is a secondary button:
 * one primary per dialog (review 2026-10-14, point 9).
 */
export function AddItemToListDialog({ listId, onClose }: AddItemToListDialogProps) {
  const { state, addItemToList } = useApp();
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const list = state.gearLists.find((l) => l.id === listId) ?? state.templates.find((t) => t.id === listId) ?? null;
  const inList = useMemo(() => {
    const qty = new Map<string, number>();
    for (const row of list?.items ?? []) if (row.gearItemId) qty.set(row.gearItemId, (qty.get(row.gearItemId) ?? 0) + row.quantity);
    return qty;
  }, [list]);

  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const byCategory = new Map<string, GearItem[]>();
    for (const g of sortByOrder(state.gearItems)) {
      if (!g.name.toLowerCase().includes(needle)) continue;
      const key = g.categoryId && state.categories.some((c) => c.id === g.categoryId) ? g.categoryId : NO_CATEGORY;
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(g);
    }
    const ordered = sortByOrder(state.categories)
      .filter((c) => byCategory.has(c.id))
      .map((c) => ({ id: c.id as string | null, name: c.name, items: byCategory.get(c.id)! }));
    if (byCategory.has(NO_CATEGORY)) ordered.push({ id: null, name: UNCATEGORIZED, items: byCategory.get(NO_CATEGORY)! });
    return ordered;
  }, [state.gearItems, state.categories, search]);

  function quantityFor(itemId: string, fallback: number): number {
    const raw = quantities[itemId];
    const parsed = raw !== undefined ? Number(raw) : fallback;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  return (
    <Dialog title="Add gear to this gearlist" wide labelledBy="add-to-list-title" onBackdropClick={onClose}>
      <div className="search">
        <Icon icon={ActionIcon.search} />
        <input
          type="search"
          className="search-input"
          placeholder="Search Gear Vault…"
          aria-label="Search Gear Vault"
          value={search}
          autoFocus
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="add-item-list">
        {state.gearItems.length === 0 && <p className="empty-hint">Gear Vault is empty — add some gear on the left first.</p>}
        {state.gearItems.length > 0 && groups.length === 0 && <p className="empty-hint">No gear matches your search.</p>}
        {groups.map((group) => (
          <div key={group.id ?? NO_CATEGORY} className="add-item-group">
            <h4 className="add-item-group-title">
              <span className="category-dot" style={{ background: categoryColor(categoryColorKey(group.id, state.categories)) }} aria-hidden="true" />
              <span className="category-heading-icon">
                <CategoryIcon id={group.id} name={group.name} size={16} />
              </span>
              <span className="category-heading-text">{group.name}</span>
            </h4>
            {group.items.map((item) => {
              const already = inList.get(item.id);
              return (
                <div key={item.id} className="add-item-row">
                  <span className="add-item-name">
                    {item.name}
                    {already !== undefined && (
                      <Badge tone="success" tip="Already in this gearlist — adding raises its quantity">
                        In list ×{already}
                      </Badge>
                    )}
                  </span>
                  <span className="add-item-weight">{formatWeight(item.weightGrams, state.unitPreference)}</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="add-item-qty"
                    aria-label={`Quantity of ${item.name}`}
                    value={quantities[item.id] ?? item.defaultQuantity}
                    onChange={(e) => setQuantities((q) => ({ ...q, [item.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => addItemToList(listId, item.id, quantityFor(item.id, item.defaultQuantity))}
                  >
                    <Icon icon={ActionIcon.add} />
                    Add
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <DialogActions>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </DialogActions>
    </Dialog>
  );
}
