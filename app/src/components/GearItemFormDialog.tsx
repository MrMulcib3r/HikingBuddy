import { useState, type FormEvent } from 'react';
import type { Category, GearItem, UnitPreference, WeightType } from '../types';
import { WEIGHT_TYPE_LABELS } from '../types';
import { fromGrams, inputUnitLabel, toGrams } from '../utils/weight';

interface GearItemFormDialogProps {
  categories: Category[];
  unitPreference: UnitPreference;
  initial: GearItem | null;
  onSubmit: (data: Omit<GearItem, 'id'>) => void;
  onCancel: () => void;
}

const WEIGHT_TYPES: WeightType[] = ['base', 'worn', 'consumable'];

/** Formulář pro přidání/editaci položky v Gear Vaultu (FR-1). Příklad z PRD: Snickers,
 * kategorie Food, 60 g, quantity 5, typ Consumable, poznámka "bílá čokoláda". */
export function GearItemFormDialog({ categories, unitPreference, initial, onSubmit, onCancel }: GearItemFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? '');
  const [weightType, setWeightType] = useState<WeightType>(initial?.weightType ?? 'base');
  const [weightInput, setWeightInput] = useState<string>(
    initial ? String(roundForInput(fromGrams(initial.weightGrams, unitPreference))) : ''
  );
  const [defaultQuantity, setDefaultQuantity] = useState<string>(String(initial?.defaultQuantity ?? 1));
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const weightValue = Number(weightInput);
    const quantityValue = Number(defaultQuantity);
    if (!trimmedName) {
      setError('Zadej název položky.');
      return;
    }
    if (!Number.isFinite(weightValue) || weightValue < 0) {
      setError('Váha musí být kladné číslo.');
      return;
    }
    if (!Number.isInteger(quantityValue) || quantityValue < 1) {
      setError('Výchozí množství musí být celé číslo alespoň 1.');
      return;
    }
    onSubmit({
      name: trimmedName,
      categoryId: categoryId || null,
      weightType,
      weightGrams: toGrams(weightValue, unitPreference),
      defaultQuantity: quantityValue,
      note: note.trim(),
    });
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{initial ? 'Upravit vybavení' : 'Přidat vybavení do Gear Vaultu'}</h3>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Název</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="např. Snickers" />
          </label>
          <label className="field">
            <span>Kategorie</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">(bez kategorie)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="field-row">
            <label className="field">
              <span>Váha ({inputUnitLabel(unitPreference)}/ks)</span>
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
              <span>Výchozí množství</span>
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
            <span>Typ váhy</span>
            <select value={weightType} onChange={(e) => setWeightType(e.target.value as WeightType)}>
              {WEIGHT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {WEIGHT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Poznámka (nepovinné)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="např. bílá čokoláda" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Zrušit
            </button>
            <button type="submit" className="btn btn-primary">
              {initial ? 'Uložit změny' : 'Přidat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function roundForInput(value: number): number {
  return Math.round(value * 100) / 100;
}
