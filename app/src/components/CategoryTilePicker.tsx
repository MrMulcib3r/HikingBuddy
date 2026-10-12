import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { isTemplateCategory } from '../constants';
import { ConfirmDialog } from './ConfirmDialog';
import type { Category } from '../types';
import { sortByOrder } from '../utils/reorder';
import { CategoryIcon } from './CategoryIcon';
import { categoryColor, categoryColorKey } from '../utils/categoryStyle';

interface CategoryTilePickerProps {
  categories: Category[];
  categoryId: string;
  onChange: (categoryId: string) => void;
  onCreateCategory: (name: string) => string;
  /** "Other" (= new category) mode. Controlled by the parent form so that a typed but not yet
   * confirmed new category name isn't lost when the whole form is submitted. */
  creating: boolean;
  onCreatingChange: (creating: boolean) => void;
  newName: string;
  onNewNameChange: (name: string) => void;
  /** Focus the new-category input when it appears. Off when "Other" is preselected on open,
   * so the cursor starts in the item Name field. */
  autoFocusNewName?: boolean;
  /** Deleting a category the user created themselves (via "Other") — template categories
   * have no delete button here. How many Vault items use each category, for the warning. */
  onDeleteCategory?: (categoryId: string) => void;
  itemCounts?: Record<string, number>;
}


/**
 * Category choice as one-click icon tiles instead of a dropdown (saves a click and
 * scanning a menu). One tile per category in the user's order; clicking the selected tile
 * again clears it (category is optional, FR-8). "Other" creates a new category inline and
 * selects it right away.
 *
 * Exactly one tile can be active at a time: picking a category closes "Other", and picking
 * "Other" clears the chosen category (bug fixed 2026-10-08 — both could look selected).
 */
export function CategoryTilePicker({
  categories,
  categoryId,
  onChange,
  onCreateCategory,
  creating,
  onCreatingChange,
  newName,
  onNewNameChange,
  autoFocusNewName = true,
  onDeleteCategory,
  itemCounts = {},
}: CategoryTilePickerProps) {
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  function confirmNewCategory() {
    const trimmed = newName.trim();
    if (trimmed) onChange(onCreateCategory(trimmed));
    onNewNameChange('');
    onCreatingChange(false);
  }

  return (
    <div className="category-tiles-wrap">
      <div className="category-tiles" role="group" aria-label="Category">
        {sortByOrder(categories).map((c) => {
          const selected = !creating && c.id === categoryId;
          const deletable = onDeleteCategory && !isTemplateCategory(c.id);
          return (
            <div key={c.id} className="category-tile-wrap">
            <button
              type="button"
              className={`category-tile ${selected ? 'selected' : ''}`}
              aria-pressed={selected}
              title={selected ? `${c.name} (click again for no category)` : c.name}
              onClick={() => {
                onCreatingChange(false);
                onChange(selected ? '' : c.id);
              }}
            >
              <span className="category-dot" style={{ background: categoryColor(categoryColorKey(c.id, categories)) }} aria-hidden="true" />
              <CategoryIcon id={c.id} name={c.name} />
              <span className="category-tile-label">{c.name}</span>
            </button>
            {deletable && (
              <button
                type="button"
                className="category-tile-delete"
                aria-label={`Delete category ${c.name}`}
                data-tip={`Delete category "${c.name}"`}
                onClick={() => setPendingDelete(c)}
              >
                <X size={12} strokeWidth={2.5} aria-hidden="true" />
              </button>
            )}
            </div>
          );
        })}
        <button
          type="button"
          className={`category-tile category-tile-other ${creating ? 'selected' : ''}`}
          aria-pressed={creating}
          title={creating ? 'Click again to cancel the new category' : 'Create a new category'}
          onClick={() => {
            onChange('');
            onCreatingChange(!creating);
          }}
        >
          <Plus size={24} strokeWidth={1.75} aria-hidden="true" />
          <span className="category-tile-label">Other</span>
        </button>
      </div>

      {creating && (
        <div className="field-row category-tiles-new">
          <input
            autoFocus={autoFocusNewName}
            value={newName}
            onChange={(e) => onNewNameChange(e.target.value)}
            placeholder="New category name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmNewCategory();
              }
              if (e.key === 'Escape') {
                e.stopPropagation();
                onCreatingChange(false);
              }
            }}
          />
          <button type="button" className="btn btn-secondary btn-small" onClick={confirmNewCategory}>
            Add
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => onCreatingChange(false)}>
            Cancel
          </button>
        </div>
      )}

      {pendingDelete && onDeleteCategory && (
        <ConfirmDialog
          title="Delete category"
          danger
          message={
            (itemCounts[pendingDelete.id] ?? 0) > 0
              ? `Delete "${pendingDelete.name}"? ${itemCounts[pendingDelete.id]} item(s) in Gear Vault use it and will become Uncategorized (the items themselves stay).`
              : `Delete "${pendingDelete.name}"? No items use it.`
          }
          confirmLabel="Delete"
          onConfirm={() => {
            onDeleteCategory(pendingDelete.id);
            if (pendingDelete.id === categoryId) onChange('');
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
