import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { computeBreakdown } from '../state/logic';
import type { GearList } from '../types';
import { formatWeight } from '../utils/weight';
import { AddItemToListDialog } from './AddItemToListDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { GearListItemRow } from './GearListItemRow';

interface GearListDetailProps {
  list: GearList;
  onDeleted: () => void;
  onDuplicated: (newListId: string | null) => void;
}

export function GearListDetail({ list, onDeleted, onDuplicated }: GearListDetailProps) {
  const { state, finalizeList, duplicateListAsDraft, deleteList } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);

  const isDraft = list.status === 'draft';
  const breakdown = useMemo(() => computeBreakdown(list.items), [list.items]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof list.items>();
    for (const item of list.items) {
      const key = item.categoryName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [list.items]);

  return (
    <div className="list-detail">
      <header className="list-detail-header">
        <div>
          <h3>
            {list.name} <span className={`status-badge status-${list.status}`}>{isDraft ? 'Draft' : 'Finalized 🔒'}</span>
          </h3>
          <p className="list-detail-meta">
            {isDraft
              ? 'Živě propojený s Gear Vaultem — editace vybavení se sem promítne (s potvrzením).'
              : `Zmrazeno ${new Date((list as Extract<GearList, { status: 'finalized' }>).finalizedAt).toLocaleString('cs-CZ')} — needitovatelné.`}
          </p>
        </div>
        <div className="list-detail-actions">
          {isDraft ? (
            <button type="button" className="btn btn-primary btn-small" onClick={() => setConfirmFinalize(true)} disabled={list.items.length === 0}>
              Finalize
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-small" onClick={() => setConfirmDuplicate(true)}>
              Duplicate as Draft
            </button>
          )}
          <button type="button" className="btn btn-danger btn-small" onClick={() => setConfirmDelete(true)}>
            Smazat
          </button>
        </div>
      </header>

      <div className="weight-summary">
        <div className="weight-tile">
          <span className="weight-tile-label">Base Weight</span>
          <span className="weight-tile-value">{formatWeight(breakdown.base, state.unitPreference)}</span>
        </div>
        <div className="weight-tile">
          <span className="weight-tile-label">Worn Weight</span>
          <span className="weight-tile-value">{formatWeight(breakdown.worn, state.unitPreference)}</span>
        </div>
        <div className="weight-tile">
          <span className="weight-tile-label">Consumables</span>
          <span className="weight-tile-value">{formatWeight(breakdown.consumable, state.unitPreference)}</span>
        </div>
        <div className="weight-tile weight-tile-total">
          <span className="weight-tile-label">Total</span>
          <span className="weight-tile-value">{formatWeight(breakdown.total, state.unitPreference)}</span>
        </div>
      </div>

      {isDraft && (
        <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(true)}>
          + Přidat vybavení z Gear Vaultu
        </button>
      )}

      <div className="list-items">
        {list.items.length === 0 && <p className="empty-hint">Gearlist je zatím prázdný.</p>}
        {[...grouped.entries()].map(([category, items]) => (
          <div key={category} className="list-category-group">
            <h4 className="list-category-title">{category}</h4>
            {items.map((item) => (
              <GearListItemRow key={item.id} listId={list.id} item={item} editable={isDraft} />
            ))}
          </div>
        ))}
      </div>

      {addOpen && <AddItemToListDialog listId={list.id} onClose={() => setAddOpen(false)} />}

      {confirmFinalize && (
        <ConfirmDialog
          title="Finalizovat gearlist"
          message="Po finalizaci se gearlist stane needitovatelným — od teď ho už úpravy v Gear Vaultu nijak neovlivní. Pokud ho budeš chtít později upravit, appka nabídne vytvoření nové editovatelné kopie. Pokračovat?"
          confirmLabel="Finalize"
          onConfirm={() => {
            finalizeList(list.id);
            setConfirmFinalize(false);
          }}
          onCancel={() => setConfirmFinalize(false)}
        />
      )}

      {confirmDuplicate && (
        <ConfirmDialog
          title="Vytvořit editovatelnou kopii"
          message={`Finalizovaný gearlist "${list.name}" nejde upravovat přímo. Vytvořit jeho kopii jako nový Draft gearlist, který půjde editovat?`}
          confirmLabel="Vytvořit kopii"
          onConfirm={() => {
            const newId = duplicateListAsDraft(list.id);
            setConfirmDuplicate(false);
            onDuplicated(newId);
          }}
          onCancel={() => setConfirmDuplicate(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Smazat gearlist "${list.name}"`}
          danger
          message={
            isDraft
              ? 'Opravdu chceš tento rozpracovaný gearlist smazat?'
              : 'Tohle je finalizovaný (zmrazený) gearlist — smazání je nevratné. Opravdu pokračovat?'
          }
          confirmLabel="Smazat"
          onConfirm={() => {
            deleteList(list.id);
            setConfirmDelete(false);
            onDeleted();
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
