import { useMemo, useState, type DragEvent, type ReactNode } from 'react';
import { useApp } from '../state/AppContext';
import { computeBreakdown, describeUsage, findAffectedLists, findAffectedTemplates } from '../state/logic';
import { TEMPLATE_NAME } from '../constants';
import type { GearList, GearListItem } from '../types';
import { formatWeight } from '../utils/weight';
import { formatDateTime, plural } from '../utils/text';
import { sortByOrder } from '../utils/reorder';
import { dragMime, isDragging } from '../utils/dnd';
import { categoryColor, categoryColorKey, categoryForName } from '../utils/categoryStyle';
import { AddItemToListDialog } from './AddItemToListDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { VaultEditDialog } from './VaultEditDialog';
import { GearListItemRow } from './GearListItemRow';
import { BackpackChart } from './BackpackChart';
import { packCategoriesFromItems } from '../utils/pack';
import { InlineTextField } from './InlineField';
import { ShareDialog } from './ShareDialog';
import { CategoryIcon } from './CategoryIcon';
import { ItemFlagsBadges } from './ItemFlagsToggle';
import { ActionIcon } from './icons/actionIcons';
import { Badge, Banner, Dialog, DialogActions, Icon, IconButton } from './ui';

interface GearListDetailProps {
  list: GearList;
  onDeleted: () => void;
  /** Showing the Gearlist Template (PRD 7.5, T-3): edited like a gearlist, but no snapshot,
   * no "Save as template", and Delete removes the template. */
  isTemplate?: boolean;
  /** The gearlist switcher (name + dropdown), shown at the start of the gearlist's own header. */
  switcher: ReactNode;
}

type CorePatch = { name?: string; categoryId?: string | null; weightGrams?: number };

interface PendingCoreEdit {
  item: GearListItem;
  patch: CorePatch;
  usage: string;
  affectedNames: string[];
}

export function GearListDetail({ list, onDeleted, isTemplate = false, switcher }: GearListDetailProps) {
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
  // "Add item from Gear Vault" with the item's default quantity; an item already in the
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

  const grouped = useMemo(() => groupByCategory(list.items), [list.items]);

  // FR-19 backpack: rows are grouped by category name; colour and icon come from the Vault
  // category of that name (none for Uncategorized / custom entries of a deleted category).
  const packCategories = useMemo(
    () =>
      packCategoriesFromItems(list.items, (name) => {
        const category = categoryForName(name, state.categories);
        return { colorKey: categoryColorKey(category?.id, state.categories), iconId: category?.id ?? null };
      }),
    [list.items, state.categories]
  );

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
  const isEmpty = list.items.length === 0;
  // T-2: offer the template once there's a gearlist with something in it, until the user
  // creates one or closes the banner.
  const showTemplateBanner = !isTemplate && !hasTemplate && !state.templateBannerDismissed && !isEmpty;

  return (
    <>
      {/* The gearlist's own header (design system v2): name with switcher, then its actions —
          icon + label for Snapshot / Share / Template (icons alone were not understood), icon
          only for Delete. */}
      <div className="gearlist-head list-detail-header">
        {switcher}
        <div className="gearlist-actions list-detail-actions">
          {!isTemplate && (
            <>
              <button type="button" className="btn btn-secondary btn-small" disabled={isEmpty} onClick={() => setConfirmSnapshot(true)}>
                <Icon icon={ActionIcon.saveSnapshot} />
                {list.snapshot ? 'Update snapshot' : 'Save snapshot'}
              </button>
              <button type="button" className="btn btn-secondary btn-small" disabled={isEmpty} onClick={() => setShareOpen(true)}>
                <Icon icon={ActionIcon.share} />
                Share
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                disabled={list.items.length === customEntryCount}
                onClick={() => setConfirmTemplate(true)}
              >
                <Icon icon={ActionIcon.template} />
                {hasTemplate ? 'Update template' : 'Save as template'}
              </button>
            </>
          )}
          <IconButton
            label={isTemplate ? 'Delete template' : 'Delete gearlist'}
            icon={ActionIcon.delete}
            variant="outlined"
            danger
            tipEnd
            onClick={() => setConfirmDelete(true)}
          />
        </div>
      </div>

      <div className="panel-body">
        <div className={`list-detail ${dropActive ? 'list-detail-drop-active' : ''}`} {...dropHandlers}>
          {dropActive && (
            <div className="list-drop-hint" aria-hidden="true">
              <span>Drop to add to {isTemplate ? 'the template' : `"${list.name}"`}</span>
            </div>
          )}

          {isTemplate && (
            <p className="list-detail-meta">New gearlists can start from this template. Changes here never affect existing gearlists.</p>
          )}
          {list.snapshot && (
            <p className="list-detail-meta snapshot-hint">
              <Badge tone="success" icon={ActionIcon.saveSnapshot}>
                Snapshot saved {formatDateTime(list.snapshot.savedAt)}
              </Badge>
              <span>The live list may have changed since.</span>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setSnapshotOpen(true)}>
                <Icon icon={ActionIcon.viewSnapshot} />
                View snapshot
              </button>
            </p>
          )}

          {showTemplateBanner && (
            <Banner
              icon={ActionIcon.template}
              role="note"
              onClose={dismissTemplateBanner}
              closeLabel="Don't show again"
              actions={
                <button type="button" className="btn btn-primary btn-small" onClick={() => setConfirmTemplate(true)}>
                  Create template
                </button>
              }
            >
              <strong>Use this gearlist as your template?</strong> New gearlists can then start with these items already in.
            </Banner>
          )}

          <div className="list-detail-overview">
            <BackpackChart categories={packCategories} consumable={breakdown.consumable} worn={breakdown.worn} unit={state.unitPreference} />
          </div>


          {/* Main add action: same look as "+ Add gear" (primary), but in its own place — right-
              aligned above the column header, normal size (Martin, 2026-10-14). */}
          <button type="button" className="btn btn-primary list-add-item" onClick={() => setAddOpen(true)}>
            <Icon icon={ActionIcon.add} />
            Add item from Gear Vault
          </button>
          <div className="list-items">
            {isEmpty && (
              <p className="empty-hint">
                {isTemplate
                  ? 'The template is empty — drag the gear you take on most trips here from Gear Vault, or use the button above.'
                  : 'This gearlist is empty so far — drag gear here from Gear Vault, or use the button above.'}
              </p>
            )}
            {/* Column header: names the icon-only Worn / Consumable toggles of every row. */}
            {!isEmpty && (
              <div className="list-head" aria-hidden="true">
                <span />
                <span>Item</span>
                <span className="list-head-flags">
                  <span>Worn</span>
                  <span>Cons.</span>
                </span>
                <span>Weight</span>
                <span>Qty</span>
                <span>Total</span>
                <span />
              </div>
            )}
            {[...grouped.entries()].map(([category, items]) => (
              <div key={category} className="list-category-group">
                <h4 className="list-category-title">
                  <CategoryHeading name={category} items={items} editable />
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
        </div>
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
          confirmIcon={ActionIcon.saveSnapshot}
          onConfirm={() => {
            saveSnapshot(list.id);
            setConfirmSnapshot(false);
          }}
          onCancel={() => setConfirmSnapshot(false)}
        />
      )}

      {snapshotOpen && list.snapshot && (
        <Dialog title={`Snapshot — ${list.name}`} titleIcon={ActionIcon.viewSnapshot} wide labelledBy="snapshot-title" onBackdropClick={() => setSnapshotOpen(false)}>
          <p className="dialog-hint">Saved {formatDateTime(list.snapshot.savedAt)}. Read-only.</p>
          <div className="list-items">
            {[...groupByCategory(list.snapshot.items).entries()].map(([category, items]) => (
              <div key={category} className="list-category-group">
                <h4 className="list-category-title">
                  <CategoryHeading name={category} items={items} />
                  <span className="list-category-total">
                    {formatWeight(items.reduce((sum, i) => sum + i.weightGrams * i.quantity, 0), state.unitPreference)}
                  </span>
                </h4>
                {items.map((item) => (
                  <div key={item.id} className={`list-item-row list-item-row-readonly ${item.quantity === 1 ? 'qty-one' : ''}`}>
                    <div className="list-item-main">
                      <span className="list-item-name">{item.name}</span>
                      {item.note && <span className="list-item-note">{item.note}</span>}
                    </div>
                    <ItemFlagsBadges isWorn={item.isWorn} isConsumable={item.isConsumable} />
                    <span className="list-item-weight">{formatWeight(item.weightGrams, state.unitPreference)}</span>
                    <span className="list-item-qty">×{item.quantity}</span>
                    <span className="list-item-subtotal">{formatWeight(item.weightGrams * item.quantity, state.unitPreference)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <DialogActions>
            <button type="button" className="btn btn-secondary" onClick={() => setSnapshotOpen(false)}>
              Close
            </button>
          </DialogActions>
        </Dialog>
      )}

      {confirmTemplate && (
        <ConfirmDialog
          title={hasTemplate ? 'Update template' : 'Create template'}
          danger={hasTemplate}
          confirmIcon={ActionIcon.template}
          message={[
            hasTemplate
              ? `This replaces everything in your current template (${plural(state.templates[0]?.items.length ?? 0, 'item')}) with the items of "${list.name}" (${plural(list.items.length - customEntryCount, 'item')}, quantities and Worn/Consumable included). The current template contents can't be restored. Gearlists already created from it don't change. Tip: to change just a few items, open Template in the gearlist menu and edit it directly. Continue?`
              : `This saves the items of "${list.name}" (quantities and Worn/Consumable included) as your template. New gearlists can then start from it. Continue?`,
            customEntryCount > 0
              ? `${customEntryCount} custom entr${customEntryCount === 1 ? 'y' : 'ies'} no longer linked to Gear Vault will be skipped.`
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          confirmLabel={hasTemplate ? 'Replace template' : 'Create template'}
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
          confirmIcon={ActionIcon.delete}
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
    </>
  );
}

/**
 * Group title in a gearlist: colour dot, category icon, name. With `editable`, a click on
 * the name renames the category — the same rename as in Gear Vault (FR-2): it renames the
 * Vault category, so every Vault-linked row in every gearlist follows. Only offered when the
 * group holds Vault-linked rows of an existing category; "Uncategorized" and groups of custom
 * entries (no longer linked) stay plain text.
 */
function CategoryHeading({ name, items, editable = false }: { name: string; items: GearListItem[]; editable?: boolean }) {
  const { state, renameCategory } = useApp();
  const vaultCategory = categoryForName(name, state.categories);
  const color = categoryColor(categoryColorKey(vaultCategory?.id, state.categories));
  const renamable = editable && vaultCategory && items.some((i) => i.gearItemId);
  return (
    <>
      <span className="category-dot" style={{ background: color }} aria-hidden="true" />
      <span className="category-heading-icon">
        <CategoryIcon id={vaultCategory?.id} name={name} size={18} />
      </span>
      {renamable ? (
        <InlineTextField
          className="list-category-name"
          value={vaultCategory.name}
          onCommit={(newName) => renameCategory(vaultCategory.id, newName)}
        />
      ) : (
        <span className="category-heading-text">{name}</span>
      )}
    </>
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
