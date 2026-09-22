import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { formatWeight } from '../utils/weight';

interface AddItemToListDialogProps {
  listId: string;
  onClose: () => void;
}

/** FR-4: přidání položky z Gear Vaultu do Draft gearlistu, s možností nastavit množství. */
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
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog dialog-wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>Přidat vybavení do gearlistu</h3>
        <input
          type="search"
          className="search-input"
          placeholder="Hledat v Gear Vaultu…"
          value={search}
          autoFocus
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="add-item-list">
          {state.gearItems.length === 0 && <p className="empty-hint">Gear Vault je prázdný — nejdřív přidej vybavení vlevo.</p>}
          {filtered.map((item) => (
            <div key={item.id} className="add-item-row">
              <span className="add-item-name">{item.name}</span>
              <span className="add-item-weight">{formatWeight(item.weightGrams, state.unitPreference)}</span>
              <input
                type="number"
                min={1}
                step={1}
                className="add-item-qty"
                value={quantities[item.id] ?? item.defaultQuantity}
                onChange={(e) => setQuantities((q) => ({ ...q, [item.id]: e.target.value }))}
              />
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => addItemToList(listId, item.id, quantityFor(item.id, item.defaultQuantity))}
              >
                Přidat
              </button>
            </div>
          ))}
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Hotovo
          </button>
        </div>
      </div>
    </div>
  );
}
