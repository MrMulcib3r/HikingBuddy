import { useState, type FormEvent } from 'react';
import type { Category, GearItem, UnitPreference } from '../types';
import { inputUnitLabel, toGrams } from '../utils/weight';

interface GearItemFormDialogProps {
  categories: Category[];
  unitPreference: UnitPreference;
  onSubmit: (data: Omit<GearItem, 'id' | 'order'>) => void;
  onCancel: () => void;
  onCreateCategory: (name: string) => string;
}

const NEW_CATEGORY_VALUE = '__new__';

/** Form for adding a new Gear Vault item (FR-1). Editing an existing item happens inline
 * in the Gear Vault list itself, not through this dialog — this is add-only. */
export function GearItemFormDialog({ categories, unitPreference, onSubmit, onCancel, onCreateCategory }: GearItemFormDialogProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [weightInput, setWeightInput] = useState<string>('');
  const [defaultQuantity, setDefaultQuantity] = useState<string>('1');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  function handleCategorySelect(value: string) {
    if (value === NEW_CATEGORY_VALUE) {
      setCreatingCategory(true);
      return;
    }
    setCategoryId(value);
  }

  function confirmNewCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCreatingCategory(false);
      return;
    }
    const id = onCreateCategory(trimmed);
    setCategoryId(id);
    setNewCategoryName('');
    setCreatingCategory(false);
  }

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
    onSubmit({
      name: trimmedName,
      categoryId: categoryId || null,
      weightGrams: toGrams(weightValue, unitPreference),
      defaultQuantity: quantityValue,
      note: note.trim(),
    });
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>Add item to Gear Vault</h3>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Snickers" />
          </label>
          <label className="field">
            <span>Category</span>
            {creatingCategory ? (
              <div className="field-row">
                <input
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), confirmNewCategory())}
                />
                <button type="button" className="btn btn-primary btn-small" onClick={confirmNewCategory}>
                  Add
                </button>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => setCreatingCategory(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <select value={categoryId} onChange={(e) => handleCategorySelect(e.target.value)}>
                <option value="">(no category)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value={NEW_CATEGORY_VALUE}>+ Add new category…</option>
              </select>
            )}
          </label>
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
