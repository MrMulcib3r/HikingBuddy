import { useState } from 'react';
import { useApp } from '../state/AppContext';
import type { GearListItem, WeightType } from '../types';
import { WEIGHT_TYPE_LABELS } from '../types';
import { formatWeight, fromGrams, toGrams } from '../utils/weight';

const WEIGHT_TYPES: WeightType[] = ['base', 'worn', 'consumable'];

interface GearListItemRowProps {
  listId: string;
  item: GearListItem;
  editable: boolean;
}

/**
 * Jeden řádek položky uvnitř gearlistu.
 * - editable=false (Finalized list): jen ke čtení.
 * - editable=true + item.gearItemId != null (linked v Draftu): jméno/kategorie/váha se
 *   zrcadlí z Gear Vaultu (needitovatelné tady), lze měnit jen množství a typ váhy (FR-9).
 * - editable=true + item.gearItemId == null (unlinked, např. po Duplicate as Draft): plně
 *   editovatelné napřímo, protože už žádný Vault záznam neexistuje k propojení.
 */
export function GearListItemRow({ listId, item, editable }: GearListItemRowProps) {
  const { state, updateListItem, removeListItem } = useApp();
  const linked = item.gearItemId !== null;
  const [editingUnlinked, setEditingUnlinked] = useState(false);

  const vaultItem = linked ? state.gearItems.find((g) => g.id === item.gearItemId) : undefined;
  const vaultDefaultType = vaultItem?.weightType;

  if (editingUnlinked) {
    return (
      <UnlinkedEditForm
        listId={listId}
        item={item}
        onDone={() => setEditingUnlinked(false)}
      />
    );
  }

  return (
    <div className="list-item-row">
      <div className="list-item-main">
        <span className="list-item-name">{item.name}</span>
        {item.note && <span className="list-item-note">{item.note}</span>}
        {!linked && editable && <span className="badge badge-unlinked">vlastní záznam</span>}
      </div>

      {editable ? (
        <select
          className="weight-type-select"
          value={item.weightTypeOverride ?? '__default__'}
          onChange={(e) => {
            const value = e.target.value;
            updateListItem(listId, item.id, {
              weightTypeOverride: value === '__default__' ? null : (value as WeightType),
            });
          }}
        >
          {linked && vaultDefaultType && (
            <option value="__default__">Dle Vaultu ({WEIGHT_TYPE_LABELS[vaultDefaultType]})</option>
          )}
          {WEIGHT_TYPES.map((t) => (
            <option key={t} value={t}>
              {WEIGHT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      ) : (
        <span className={`badge badge-${item.weightType}`}>{WEIGHT_TYPE_LABELS[item.weightType]}</span>
      )}

      <span className="list-item-weight">{formatWeight(item.weightGrams, state.unitPreference)}</span>

      {editable ? (
        <input
          type="number"
          min={1}
          step={1}
          className="list-item-qty-input"
          value={item.quantity}
          onChange={(e) => {
            const qty = Number(e.target.value);
            if (Number.isInteger(qty) && qty > 0) {
              updateListItem(listId, item.id, { quantity: qty });
            }
          }}
        />
      ) : (
        <span className="list-item-qty">×{item.quantity}</span>
      )}

      <span className="list-item-subtotal">{formatWeight(item.weightGrams * item.quantity, state.unitPreference)}</span>

      {editable && (
        <div className="list-item-actions">
          {!linked && (
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditingUnlinked(true)}>
              Upravit
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-small" onClick={() => removeListItem(listId, item.id)}>
            Odebrat
          </button>
        </div>
      )}
    </div>
  );
}

function UnlinkedEditForm({ listId, item, onDone }: { listId: string; item: GearListItem; onDone: () => void }) {
  const { state, updateListItem } = useApp();
  const [name, setName] = useState(item.name);
  const [categoryName, setCategoryName] = useState(item.categoryName);
  const [weightInput, setWeightInput] = useState(String(fromGrams(item.weightGrams, state.unitPreference)));
  const [note, setNote] = useState(item.note);

  function save() {
    const weightValue = Number(weightInput);
    updateListItem(listId, item.id, {
      name: name.trim() || item.name,
      categoryName: categoryName.trim() || 'Uncategorized',
      weightGrams: Number.isFinite(weightValue) && weightValue >= 0 ? toGrams(weightValue, state.unitPreference) : item.weightGrams,
      note: note.trim(),
    });
    onDone();
  }

  return (
    <div className="list-item-row list-item-row-editing">
      <input className="inline-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Název" />
      <input className="inline-input" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Kategorie" />
      <input
        className="inline-input inline-input-narrow"
        type="number"
        min={0}
        step="any"
        value={weightInput}
        onChange={(e) => setWeightInput(e.target.value)}
      />
      <input className="inline-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Poznámka" />
      <div className="list-item-actions">
        <button type="button" className="btn btn-primary btn-small" onClick={save}>
          Uložit
        </button>
        <button type="button" className="btn btn-ghost btn-small" onClick={onDone}>
          Zrušit
        </button>
      </div>
    </div>
  );
}
