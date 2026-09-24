import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Category } from '../types';
import { sortByOrder } from '../utils/reorder';
import { CategoryIcon } from './CategoryIcon';

interface CategoryTilePickerProps {
  categories: Category[];
  categoryId: string;
  onChange: (categoryId: string) => void;
  onCreateCategory: (name: string) => string;
}

/**
 * Category choice as one-click icon tiles instead of a dropdown (saves a click and
 * scanning a menu). One tile per category in the user's order; clicking the selected tile
 * again clears it (category is optional, FR-8). "Other" creates a new category inline and
 * selects it right away.
 */
export function CategoryTilePicker({ categories, categoryId, onChange, onCreateCategory }: CategoryTilePickerProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  function confirmNewCategory() {
    const trimmed = newName.trim();
    if (trimmed) onChange(onCreateCategory(trimmed));
    setNewName('');
    setCreating(false);
  }

  return (
    <div className="category-tiles-wrap">
      <div className="category-tiles" role="group" aria-label="Category">
        {sortByOrder(categories).map((c) => {
          const selected = c.id === categoryId;
          return (
            <button
              key={c.id}
              type="button"
              className={`category-tile ${selected ? 'selected' : ''}`}
              aria-pressed={selected}
              title={selected ? `${c.name} (click again for no category)` : c.name}
              onClick={() => onChange(selected ? '' : c.id)}
            >
              <CategoryIcon category={c} />
              <span className="category-tile-label">{c.name}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`category-tile category-tile-other ${creating ? 'selected' : ''}`}
          aria-pressed={creating}
          title="Create a new category"
          onClick={() => setCreating(true)}
        >
          <Plus size={26} strokeWidth={1.75} aria-hidden="true" />
          <span className="category-tile-label">Other</span>
        </button>
      </div>

      {creating && (
        <div className="field-row category-tiles-new">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmNewCategory();
              }
              if (e.key === 'Escape') {
                e.stopPropagation();
                setCreating(false);
              }
            }}
          />
          <button type="button" className="btn btn-primary btn-small" onClick={confirmNewCategory}>
            Add
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setCreating(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
