import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Category, GearItem, UnitPreference } from '../types';
import { inputUnitLabel, toGrams } from '../utils/weight';
import { CategoryTilePicker } from './CategoryTilePicker';

interface GearItemFormDialogProps {
  categories: Category[];
  unitPreference: UnitPreference;
  onSubmit: (data: Omit<GearItem, 'id' | 'order'>) => void;
  onCancel: () => void;
  onCreateCategory: (name: string) => string;
  /** Category to preselect — set when the form is opened from a category's own
   * "+ Add item" button in the Gear Vault list. */
  initialCategoryId?: string | null;
  /** Open with the "Other" (new category) tile active — used by the general "+ Add gear"
   * button, which isn't tied to any existing category (PRD v13). */
  startWithNewCategory?: boolean;
  /** Delete a user-created category from the tile grid (BACKLOG, 2026-10-08). */
  onDeleteCategory?: (categoryId: string) => void;
  itemCounts?: Record<string, number>;
}

/** Form for adding a new Gear Vault item (FR-1). Editing an existing item happens inline
 * in the Gear Vault list itself, not through this dialog — this is add-only. */
export function GearItemFormDialog({ categories, unitPreference, onSubmit, onCancel, onCreateCategory, initialCategoryId, startWithNewCategory = false, onDeleteCategory, itemCounts }: GearItemFormDialogProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId ?? '');
  const [weightInput, setWeightInput] = useState<string>('');
  const [defaultQuantity, setDefaultQuantity] = useState<string>('1');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(startWithNewCategory);
  const [newCategoryName, setNewCategoryName] = useState('');
  // When "Other" is preselected on open, the cursor should start in Name, not in the new
  // category field; once the user toggles "Other" themselves, focus its field as usual.
  const [focusNewCategory, setFocusNewCategory] = useState(!startWithNewCategory);

  // Escape closes the form wherever focus is (e.g. after a nested confirm closed and focus
  // fell back to the page). Ignored while a nested dialog (category delete confirm) is open
  // on top — Escape there shouldn't throw away the whole form.
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (dialogRef.current?.querySelector('.dialog')) return;
      onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const weightValue = Number(weightInput);
    const quantityValue = Number(defaultQuantity);
    if (!trimmedName) {
      setError('Enter an item name.');
      return;
    }
    if (!Number.isFinite(weightValue) || weightValue < 0) {
      setError('Weight must be a positive number.');
      return;
    }
    if (!Number.isInteger(quantityValue) || quantityValue < 1) {
      setError('Default quantity must be a whole number of at least 1.');
      return;
    }
    // "Other" is active and a new category name was typed but not confirmed with its own
    // Add button — create it now instead of silently saving the item without a category.
    let finalCategoryId = categoryId || null;
    if (creatingCategory && newCategoryName.trim()) {
      finalCategoryId = onCreateCategory(newCategoryName.trim());
    }
    onSubmit({
      name: trimmedName,
      categoryId: finalCategoryId,
      weightGrams: toGrams(weightValue, unitPreference),
      defaultQuantity: quantityValue,
      note: note.trim(),
    });
  }

  return (
    // Clicking outside the form intentionally does NOT close it — that used to throw away
    // everything typed so far (BACKLOG bug, 2026-09-24). Close with Cancel or Escape.
    <div className="dialog-backdrop" role="presentation">
      <div ref={dialogRef} className="dialog dialog-wide" role="dialog" aria-modal="true">
        <h3>Add item to Gear Vault</h3>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Snickers" />
          </label>
          <div className="field">
            <span>Category</span>
            <CategoryTilePicker
              categories={categories}
              categoryId={categoryId}
              onChange={setCategoryId}
              onCreateCategory={onCreateCategory}
              creating={creatingCategory}
              onCreatingChange={(v) => {
                setFocusNewCategory(true);
                setCreatingCategory(v);
              }}
              newName={newCategoryName}
              onNewNameChange={setNewCategoryName}
              autoFocusNewName={focusNewCategory}
              onDeleteCategory={onDeleteCategory}
              itemCounts={itemCounts}
            />
          </div>
          <div className="field-row">
            <label className="field">
              <span>Weight ({inputUnitLabel(unitPreference)}/unit)</span>
              <input
                type="number"
                min={0}
                step="any"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="60"
              />
            </label>
            <label className="field">
              <span>Default quantity</span>
              <input
                type="number"
                min={1}
                step={1}
                value={defaultQuantity}
                onChange={(e) => setDefaultQuantity(e.target.value)}
              />
            </label>
          </div>
          <label className="field">
            <span>Note (optional)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. white chocolate" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
