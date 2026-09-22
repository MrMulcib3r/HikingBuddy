import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { findAffectedDraftLists } from '../state/logic';
import type { GearItem } from '../types';
import { WEIGHT_TYPE_LABELS } from '../types';
import { formatWeight } from '../utils/weight';
import { ConfirmDialog } from './ConfirmDialog';
import { GearItemFormDialog } from './GearItemFormDialog';
import { CategoryManager } from './CategoryManager';

const UNCATEGORIZED_FILTER = '__uncategorized__';

export function GearVaultPanel() {
  const { state, addGearItem, updateGearItem, deleteGearItem } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GearItem | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{ id: string; patch: Omit<GearItem, 'id'>; affectedCount: number } | null>(
    null
  );
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; affectedCount: number } | null>(null);

  const filteredItems = useMemo(() => {
    return state.gearItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory =
        !categoryFilter ||
        (categoryFilter === UNCATEGORIZED_FILTER ? !item.categoryId : item.categoryId === categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [state.gearItems, search, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, GearItem[]>();
    for (const item of filteredItems) {
      const key = item.categoryId ?? UNCATEGORIZED_FILTER;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [filteredItems]);

  function categoryName(key: string): string {
    if (key === UNCATEGORIZED_FILTER) return 'Uncategorized';
    return state.categories.find((c) => c.id === key)?.name ?? 'Uncategorized';
  }

  function openAddForm() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEditForm(item: GearItem) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function handleFormSubmit(data: Omit<GearItem, 'id'>) {
    setFormOpen(false);
    if (editingItem) {
      const affected = findAffectedDraftLists(state, editingItem.id);
      if (affected.length > 0) {
        setPendingEdit({ id: editingItem.id, patch: data, affectedCount: affected.length });
        return;
      }
      updateGearItem(editingItem.id, data);
    } else {
      addGearItem(data);
    }
    setEditingItem(null);
  }

  function requestDelete(item: GearItem) {
    const affected = findAffectedDraftLists(state, item.id);
    setPendingDelete({ id: item.id, name: item.name, affectedCount: affected.length });
  }

  return (
    <section className="panel gear-vault-panel">
      <header className="panel-header">
        <h2>Gear Vault</h2>
        <div className="panel-header-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setCategoryManagerOpen(true)}>
            Kategorie
          </button>
          <button type="button" className="btn btn-primary btn-small" onClick={openAddForm}>
            + Přidat vybavení
          </button>
        </div>
      </header>

      <div className="vault-filters">
        <input
          type="search"
          placeholder="Hledat vybavení…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Všechny kategorie</option>
          {state.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={UNCATEGORIZED_FILTER}>Uncategorized</option>
        </select>
      </div>

      <div className="vault-list">
        {state.gearItems.length === 0 && (
          <p className="empty-hint">Gear Vault je zatím prázdný — přidej první vybavení.</p>
        )}
        {[...grouped.entries()].map(([key, items]) => (
          <div key={key} className="vault-category-group">
            <h3 className="vault-category-title">{categoryName(key)}</h3>
            {items.map((item) => (
              <div key={item.id} className="vault-item-row">
                <div className="vault-item-main">
                  <span className="vault-item-name">{item.name}</span>
                  {item.note && <span className="vault-item-note">{item.note}</span>}
                </div>
                <span className={`badge badge-${item.weightType}`}>{WEIGHT_TYPE_LABELS[item.weightType]}</span>
                <span className="vault-item-weight">{formatWeight(item.weightGrams, state.unitPreference)}</span>
                <span className="vault-item-qty">×{item.defaultQuantity}</span>
                <div className="vault-item-actions">
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => openEditForm(item)}>
                    Upravit
                  </button>
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => requestDelete(item)}>
                    Smazat
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {formOpen && (
        <GearItemFormDialog
          categories={state.categories}
          unitPreference={state.unitPreference}
          initial={editingItem}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditingItem(null);
          }}
        />
      )}

      {categoryManagerOpen && <CategoryManager onClose={() => setCategoryManagerOpen(false)} />}

      {pendingEdit && (
        <ConfirmDialog
          title="Upravit vybavení použité v rozpracovaných gearlistech"
          message={`Tahle položka je použitá v ${pendingEdit.affectedCount} rozpracovaném (Draft) gearlistu/gearlistech. Úprava se do nich promítne. Finalizovaných gearlistů se to netýká. Pokračovat?`}
          confirmLabel="Uložit úpravu"
          onConfirm={() => {
            updateGearItem(pendingEdit.id, pendingEdit.patch);
            setPendingEdit(null);
          }}
          onCancel={() => setPendingEdit(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Smazat vybavení z Gear Vaultu"
          danger
          message={
            pendingDelete.affectedCount > 0
              ? `"${pendingDelete.name}" je použitá v ${pendingDelete.affectedCount} rozpracovaném (Draft) gearlistu/gearlistech. Po smazání v nich položka zůstane s poslední známou hodnotou, ale přestane být propojená s Gear Vaultem. Pokračovat?`
              : `Opravdu chceš smazat "${pendingDelete.name}" z Gear Vaultu?`
          }
          confirmLabel="Smazat"
          onConfirm={() => {
            deleteGearItem(pendingDelete.id);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
}
