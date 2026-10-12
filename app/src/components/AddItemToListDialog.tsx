import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { formatWeight } from '../utils/weight';
import { ActionIcon } from './icons/actionIcons';
import { Dialog, DialogActions, Icon } from './ui';

interface AddItemToListDialogProps {
  listId: string;
  onClose: () => void;
}

/** FR-4: add an item from Gear Vault into a gearlist (or the template), with a quantity. */
export function AddItemToListDialog({ listId, onClose }: AddItemToListDialogProps) {
  const { state, addItemToList } = useApp();
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const filtered = useMemo(
    () => state.gearItems.filter((g) => g.name.toLowerCase().includes(search.trim().toLowerCase())),
    [state.gearItems, search]
  );

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
        {filtered.map((item) => (
          <div key={item.id} className="add-item-row">
            <span className="add-item-name">{item.name}</span>
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
              className="btn btn-primary btn-small"
              onClick={() => addItemToList(listId, item.id, quantityFor(item.id, item.defaultQuantity))}
            >
              <Icon icon={ActionIcon.add} />
              Add
            </button>
          </div>
        ))}
      </div>
      <DialogActions>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Done
        </button>
      </DialogActions>
    </Dialog>
  );
}
