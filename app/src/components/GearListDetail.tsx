import { useMemo, useState, type DragEvent } from 'react';
import { useApp } from '../state/AppContext';
import { computeBreakdown, describeUsage, findAffectedLists, findAffectedTemplates } from '../state/logic';
import { TEMPLATE_NAME } from '../constants';
import type { GearList, GearListItem } from '../types';
import { formatWeight } from '../utils/weight';
import { sortByOrder } from '../utils/reorder';
import { dragMime, isDragging } from '../utils/dnd';
import { AddItemToListDialog } from './AddItemToListDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { VaultEditDialog } from './VaultEditDialog';
import { GearListItemRow } from './GearListItemRow';
import { WeightSummary } from './WeightSummary';
import { InlineTextField } from './InlineField';
import { ShareDialog } from './ShareDialog';

interface GearListDetailProps {
  list: GearList;
  onDeleted: () => void;
  /** Showing the Gearlist Template (PRD 7.5, T-3): edited like a gearlist, but no snapshot,
   * no "Save as template", and Delete removes the template. */
  isTemplate?: boolean;
}

type CorePatch = { name?: string; categoryId?: string | null; weightGrams?: number };

interface PendingCoreEdit {
  item: GearListItem;
  patch: CorePatch;
  usage: string;
  affectedNames: string[];
}

export function GearListDetail({ list, onDeleted, isTemplate = false }: GearListDetailProps) {
  const {
    state,
    continueEditLinkedItem,
    copyAndRelinkListItem,
    saveSnapshot,
    deleteList,
    reorderListItems,
    saveAsTemplate,
    deleteTemplate,
    dismissTemplateBanner,
    addItemToList,
  } = useApp();
  const [confirmTemplate, setConfirmTemplate] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSnapshot, setConfirmSnapshot] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [dropActive, setDropActive] = useState(false);

  // Drag a gear item from Gear Vault onto the gearlist (or template) to add it — same as
  // "+ Add item from Gear Vault" with the item's default quantity; an item already in the
  // list just gets its quantity raised (FR-4). The button stays for touch screens, where
  // drag & drop doesn't work.
  const dropHandlers = {
    onDragOver: (e: DragEvent) => {
      if (!isDragging(e, 'gear')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (!dropActive) setDropActive(true);
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropActive(false);
    },
    onDrop: (e: DragEvent) => {
      if (!isDragging(e, 'gear')) return;
      e.preventDefault();
      setDropActive(false);
      const gearItem = state.gearItems.find((g) => g.id === e.dataTransfer.getData(dragMime('gear')));
      if (gearItem) addItemToList(list.id, gearItem.id, gearItem.defaultQuantity);
    },
  };
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
    const gearItemId = item.gearItemId;
    // Gearlists and the template both count as places where the Vault item is used (T-5).
    const places = [...findAffectedTemplates(state, gearItemId), ...findAffectedLists(state, gearItemId)];
    const rowsIn = (l: GearList) => l.items.filter((i) => i.gearItemId === gearItemId).length;
    // Editing directly touches only this row unless the shared Vault item is used
    // elsewhere too (including possibly more than once in this same list).
    const othersCount = places.reduce((n, l) => n + rowsIn(l), 0) - 1;
    if (othersCount <= 0) {
      // Not shared anywhere else right now — just update the Vault item directly, no need
      // to ask Cancel/Copy/Continue since nothing else would be affected.
      continueEditLinkedItem(item.gearItemId, fullPatchFor(item, patch));
      return;
    }
    // Lists where the change would show up besides this row: other gearlists, plus this one
    // if the same Vault item sits in it more than once.
    const isTemplateId = (id: string) => state.templates.some((t) => t.id === id);
    const others = places.filter((l) => l.id !== list.id || rowsIn(l) > 1);
    const affectedNames = others.map((l) => {
      const name = isTemplateId(l.id) ? TEMPLATE_NAME : l.name;
      return l.id === list.id ? `${name} (this ${isTemplate ? 'template' : 'gearlist'})` : name;
    });
    const otherLists = others.filter((l) => !isTemplateId(l.id)).length;
    const otherTemplates = others.length - otherLists;
    setPendingCoreEdit({ item, patch, usage: describeUsage(otherLists, otherTemplates), affectedNames });
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

  const hasTemplate = state.templates.length > 0;
  const customEntryCount = list.items.filter((i) => !i.gearItemId).length;
  // T-2: offer the template once there's a gearlist with something in it, until the user
  // creates one or closes the banner.
  const showTemplateBanner = !isTemplate && !hasTemplate && !state.templateBannerDismissed && list.items.length > 0;

  return (
    <div className={`list-detail ${dropActive ? 'list-detail-drop-active' : ''}`} {...dropHandlers}>
      {dropActive && (
        <div className="list-drop-hint" aria-hidden="true">
          <span>Drop to add to {isTemplate ? 'the template' : `"${list.name}"`}</span>
        </div>
      )}
      <header className="list-detail-header">
        <div>
          <p className="list-detail-meta">
            {isTemplate
              ? 'Your template — "+ New gearlist" → "From template" starts a new gearlist with these items. Changes here never affect existing gearlists.'
              : 'Always editable — live-linked to Gear Vault. Save a snapshot below before a trip to keep a record of what you packed.'}
          </p>
        </div>
        <div className="list-detail-actions">
          {!isTemplate && (
            <>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => setConfirmSnapshot(true)} disabled={list.items.length === 0}>
                {list.snapshot ? 'Update snapshot' : 'Save snapshot'}
              </button>
              {list.snapshot && (
                <button type="button" className="btn btn-ghost btn-small" onClick={() => setSnapshotOpen(true)}>
                  View snapshot
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={() => setShareOpen(true)}
                disabled={list.items.length === 0}
                title="Get a read-only link to this gearlist"
              >
                Share
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={() => setConfirmTemplate(true)}
                disabled={list.items.length === customEntryCount}
                title={hasTemplate ? "Replace your template's items with this gearlist's items" : "Use this gearlist's items as the starting point for new gearlists"}
              >
                {hasTemplate ? 'Update template' : 'Save as template'}
              </button>
            </>
          )}
          <button type="button" className="btn btn-danger btn-small" onClick={() => setConfirmDelete(true)}>
            {isTemplate ? 'Delete template' : 'Delete'}
          </button>
        </div>
      </header>

      {showTemplateBanner && (
        <div className="template-banner" role="note">
          <span>Use this gearlist as your template? New gearlists can then start with these items already in.</span>
          <button type="button" className="btn btn-primary btn-small" onClick={() => setConfirmTemplate(true)}>
            Create template
          </button>
          <button type="button" className="template-banner-close" aria-label="Don't show again" title="Don't show again" onClick={dismissTemplateBanner}>
            ×
          </button>
        </div>
      )}

      {list.snapshot && (
        <p className="snapshot-hint">
          Snapshot saved {new Date(list.snapshot.savedAt).toLocaleString('en-US')} — the live list above may have changed since.
        </p>
      )}

      <WeightSummary breakdown={breakdown} unit={state.unitPreference} />

      <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(true)}>
        + Add item from Gear Vault
      </button>

      <div className="list-items">
        {list.items.length === 0 && (
          <p className="empty-hint">{isTemplate
              ? 'The template is empty — drag the gear you take on most trips here from Gear Vault, or use the button above.'
              : 'This gearlist is empty so far — drag gear here from Gear Vault, or use the button above.'}</p>
        )}
        {[...grouped.entries()].map(([category, items]) => (
          <div key={category} className="list-category-group">
            <h4 className="list-category-title">
              <ListCategoryName name={category} items={items} />
              {/* Category subtotal (PRD section 5) — every row's weight × quantity. */}
              <span className="list-category-total">
                {formatWeight(items.reduce((sum, i) => sum + i.weightGrams * i.quantity, 0), state.unitPreference)}
              </span>
            </h4>
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

      {shareOpen && <ShareDialog list={list} onClose={() => setShareOpen(false)} />}

      {addOpen && <AddItemToListDialog listId={list.id} onClose={() => setAddOpen(false)} />}

      {pendingCoreEdit && (
        <VaultEditDialog
          title="This item is used elsewhere too"
          message={`"${pendingCoreEdit.item.name}" is also used in ${pendingCoreEdit.usage}. Do you want to update it everywhere, or keep those unchanged and give this row its own copy?`}
          affectedLists={pendingCoreEdit.affectedNames}
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

      {confirmTemplate && (
        <ConfirmDialog
          title={hasTemplate ? 'Update template' : 'Create template'}
          message={[
            hasTemplate
              ? `This replaces your current template with the items of "${list.name}" (quantities and Worn/Consumable included). Gearlists already created from it don't change. Tip: to change just a few items, open 📋 Template in the gearlist menu and edit it directly. Continue?`
              : `This saves the items of "${list.name}" (quantities and Worn/Consumable included) as your template. New gearlists can then start from it. Continue?`,
            customEntryCount > 0
              ? `${customEntryCount} custom entr${customEntryCount === 1 ? 'y' : 'ies'} no longer linked to Gear Vault will be skipped.`
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          confirmLabel={hasTemplate ? 'Update template' : 'Create template'}
          onConfirm={() => {
            saveAsTemplate(list.id);
            setConfirmTemplate(false);
          }}
          onCancel={() => setConfirmTemplate(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={isTemplate ? 'Delete template' : `Delete gearlist "${list.name}"`}
          danger
          message={
            isTemplate
              ? 'Delete your template? Gearlists created from it are not affected. This cannot be undone.'
              : 'Are you sure you want to delete this gearlist? This cannot be undone.'
          }
          confirmLabel="Delete"
          onConfirm={() => {
            if (isTemplate) deleteTemplate(list.id);
            else deleteList(list.id);
            setConfirmDelete(false);
            onDeleted();
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

/** Group title in a gearlist. Click to rename the category — the same rename as in Gear
 * Vault (FR-2): it renames the Vault category, so every Vault-linked row in every gearlist
 * follows. Only offered when the group holds Vault-linked rows of an existing category;
 * "Uncategorized" and groups of custom entries (no longer linked) stay plain text. */
function ListCategoryName({ name, items }: { name: string; items: GearListItem[] }) {
  const { state, renameCategory } = useApp();
  const category = items.some((i) => i.gearItemId) ? state.categories.find((c) => c.name === name) : undefined;
  if (!category) return <>{name}</>;
  return <InlineTextField className="list-category-name" value={category.name} onCommit={(newName) => renameCategory(category.id, newName)} />;
}

function groupByCategory(items: GearListItem[]): Map<string, GearListItem[]> {
  const map = new Map<string, GearListItem[]>();
  for (const item of sortByOrder(items)) {
    if (!map.has(item.categoryName)) map.set(item.categoryName, []);
    map.get(item.categoryName)!.push(item);
  }
  return map;
}
