import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { isTemplateCategory } from '../constants';
import { ConfirmDialog } from './ConfirmDialog';
import { plural } from '../utils/text';
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
  /** "Choose a category." — shown under the tiles, the tile group gets the error border. */
  error?: string | null;
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
 * At most one tile is selected (design system CategoryTile, Martin 2026-10-14). The dashed
 * "+ New category" tile (was "+ Other") is an action — it opens the "New category name" field with a single Add
 * button — never a selection and never preselected. Picking any other tile closes the field.
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
  error = null,
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
      <div className={`category-tiles ${error ? 'is-error' : ''}`} role="group" aria-label="Category" aria-invalid={error ? true : undefined}>
        {sortByOrder(categories).map((c) => {
          const selected = c.id === categoryId;
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
          className="category-tile category-tile-other"
          aria-expanded={creating}
          title="Create a new category"
          onClick={() => onCreatingChange(!creating)}
        >
          <Plus size={24} strokeWidth={1.75} aria-hidden="true" />
          {/* "New category", not "Other": a user category can itself be called Other (e.g. a renamed
              Misc from a LighterPack import), and two Other tiles were confusing (Martin, 2026-10-14). */}
          <span className="category-tile-label">New category</span>
        </button>
      </div>

      {creating && (
        <div className="field-row category-tiles-new">
          <input
            autoFocus
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
        </div>
      )}

      {error && <p className="form-error category-tiles-error">{error}</p>}

      {pendingDelete && onDeleteCategory && (
        <ConfirmDialog
          title="Delete category"
          danger
          message={
            (itemCounts[pendingDelete.id] ?? 0) > 0
              ? `Delete "${pendingDelete.name}"? ${plural(itemCounts[pendingDelete.id], 'item')} in Gear Vault ${itemCounts[pendingDelete.id] === 1 ? 'uses' : 'use'} it and will become Uncategorized (the items themselves stay).`
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
