import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { computeBreakdown, findAffectedLists } from '../state/logic';
import type { GearList, GearListItem } from '../types';
import { formatWeight } from '../utils/weight';
import { sortByOrder } from '../utils/reorder';
import { AddItemToListDialog } from './AddItemToListDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { VaultEditDialog } from './VaultEditDialog';
import { GearListItemRow } from './GearListItemRow';

interface GearListDetailProps {
  list: GearList;
  onDeleted: () => void;
}

type CorePatch = { name?: string; categoryId?: string | null; weightGrams?: number };

interface PendingCoreEdit {
  item: GearListItem;
  patch: CorePatch;
  affectedCount: number;
}

export function GearListDetail({ list, onDeleted }: GearListDetailProps) {
  const { state, continueEditLinkedItem, copyAndRelinkListItem, saveSnapshot, deleteList, reorderListItems } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSnapshot, setConfirmSnapshot] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [pendingCoreEdit, setPendingCoreEdit] = useState<PendingCoreEdit | null>(null);

  const breakdown = useMemo(() => computeBreakdown(list.items), [list.items]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof list.items>();
    for (const item of sortByOrder(list.items)) {
      const key = item.categoryName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [list.items]);

  function requestCoreEdit(item: GearListItem, patch: CorePatch) {
    if (!item.gearItemId) return;
    const affected = findAffectedLists(state, item.gearItemId);
    // Editing directly touches only this row unless the shared Vault item is used
    // elsewhere too (including possibly more than once in this same list).
    const othersCount = affected.reduce((n, l) => n + l.items.filter((i) => i.gearItemId === item.gearItemId).length, 0) - 1;
    if (othersCount <= 0) {
      // Not shared anywhere else right now — just update the Vault item directly, no need
      // to ask Cancel/Copy/Continue since nothing else would be affected.
      continueEditLinkedItem(item.gearItemId, fullPatchFor(item, patch));
      return;
    }
    setPendingCoreEdit({ item, patch, affectedCount: othersCount });
  }

  function fullPatchFor(item: GearListItem, patch: CorePatch) {
    const vaultItem = state.gearItems.find((g) => g.id === item.gearItemId)!;
    return {
      name: patch.name ?? vaultItem.name,
      categoryId: patch.categoryId !== undefined ? patch.categoryId : vaultItem.categoryId,
      weightGrams: patch.weightGrams ?? vaultItem.weightGrams,
      defaultQuantity: vaultItem.defaultQuantity,
      note: vaultItem.note,
    };
  }

  return (
    <div className="list-detail">
      <header className="list-detail-header">
        <div>
          <h3>{list.name}</h3>
          <p className="list-detail-meta">
            Always editable — live-linked to Gear Vault. Save a snapshot below before a trip to keep a record of what you packed.
          </p>
        </div>
        <div className="list-detail-actions">
          <button type="button" className="btn btn-secondary btn-small" onClick={() => setConfirmSnapshot(true)} disabled={list.items.length === 0}>
            {list.snapshot ? 'Update snapshot' : 'Save snapshot'}
          </button>
          {list.snapshot && (
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setSnapshotOpen(true)}>
              View snapshot
            </button>
          )}
          <button type="button" className="btn btn-danger btn-small" onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        </div>
      </header>

      {list.snapshot && (
        <p className="snapshot-hint">
          Snapshot saved {new Date(list.snapshot.savedAt).toLocaleString('en-US')} — the live list above may have changed since.
        </p>
      )}

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

      <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(true)}>
        + Add item from Gear Vault
      </button>

      <div className="list-items">
        {list.items.length === 0 && <p className="empty-hint">This gearlist is empty so far.</p>}
        {[...grouped.entries()].map(([category, items]) => (
          <div key={category} className="list-category-group">
            <h4 className="list-category-title">{category}</h4>
            {items.map((item) => (
              <GearListItemRow
                key={item.id}
                listId={list.id}
                item={item}
                onRequestCoreEdit={requestCoreEdit}
                onReorder={(sourceId, targetId) => reorderListItems(list.id, sourceId, targetId)}
              />
            ))}
          </div>
        ))}
      </div>

      {addOpen && <AddItemToListDialog listId={list.id} onClose={() => setAddOpen(false)} />}

      {pendingCoreEdit && (
        <VaultEditDialog
          title="This item is used elsewhere too"
          message={`"${pendingCoreEdit.item.name}" is also used in ${pendingCoreEdit.affectedCount} other place(s) in your gearlists. Do you want to update it everywhere, or keep those unchanged and give this row its own copy?`}
          onCancel={() => setPendingCoreEdit(null)}
          onCopy={() => {
            copyAndRelinkListItem(list.id, pendingCoreEdit.item.id, fullPatchFor(pendingCoreEdit.item, pendingCoreEdit.patch));
            setPendingCoreEdit(null);
          }}
          onContinue={() => {
            continueEditLinkedItem(pendingCoreEdit.item.gearItemId!, fullPatchFor(pendingCoreEdit.item, pendingCoreEdit.patch));
            setPendingCoreEdit(null);
          }}
        />
      )}

      {confirmSnapshot && (
        <ConfirmDialog
          title={list.snapshot ? 'Update snapshot' : 'Save snapshot'}
          message={
            list.snapshot
              ? 'This replaces the previously saved snapshot with the current list — the old snapshot is not kept separately. Continue?'
              : "This saves a copy of the current list's contents and weights, separate from the live editable list above, so you have a record of exactly what you packed. Continue?"
          }
          confirmLabel={list.snapshot ? 'Update snapshot' : 'Save snapshot'}
          onConfirm={() => {
            saveSnapshot(list.id);
            setConfirmSnapshot(false);
          }}
          onCancel={() => setConfirmSnapshot(false)}
        />
      )}

      {snapshotOpen && list.snapshot && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setSnapshotOpen(false)}>
          <div className="dialog dialog-wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Snapshot — {list.name}</h3>
            <p className="dialog-hint">Saved {new Date(list.snapshot.savedAt).toLocaleString('en-US')}. Read-only.</p>
            <div className="list-items">
              {[...groupByCategory(list.snapshot.items).entries()].map(([category, items]) => (
                <div key={category} className="list-category-group">
                  <h4 className="list-category-title">{category}</h4>
                  {items.map((item) => (
                    <div key={item.id} className="list-item-row list-item-row-readonly">
                      <div className="list-item-main">
                        <span className="list-item-name">{item.name}</span>
                        {item.note && <span className="list-item-note">{item.note}</span>}
                      </div>
                      <span>{item.isConsumable ? 'Consumable' : item.isWorn ? 'Worn' : 'Base'}</span>
                      <span className="list-item-weight">{formatWeight(item.weightGrams, state.unitPreference)}</span>
                      <span className="list-item-qty">×{item.quantity}</span>
                      <span className="list-item-subtotal">{formatWeight(item.weightGrams * item.quantity, state.unitPreference)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="dialog-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setSnapshotOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete gearlist "${list.name}"`}
          danger
          message="Are you sure you want to delete this gearlist? This cannot be undone."
          confirmLabel="Delete"
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

function groupByCategory(items: GearListItem[]): Map<string, GearListItem[]> {
  const map = new Map<string, GearListItem[]>();
  for (const item of sortByOrder(items)) {
    if (!map.has(item.categoryName)) map.set(item.categoryName, []);
    map.get(item.categoryName)!.push(item);
  }
  return map;
}
