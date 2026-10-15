import { useApp } from '../state/AppContext';
import { findAffectedLists } from '../state/logic';
import type { GearListItem } from '../types';
import { formatWeight, fromGrams, toGrams } from '../utils/weight';
import { makeDragHandlers } from '../utils/dnd';
import { ItemFlagsToggle } from './ItemFlagsToggle';
import { InlineTextField, InlineNumberField } from './InlineField';
import { InlineCategorySelect } from './InlineCategorySelect';
import { ActionIcon } from './icons/actionIcons';
import { Badge, Icon, IconButton } from './ui';

interface GearListItemRowProps {
  listId: string;
  item: GearListItem;
  onRequestCoreEdit: (item: GearListItem, patch: { name?: string; categoryId?: string | null; weightGrams?: number }) => void;
  onReorder: (sourceId: string, targetId: string, after?: boolean) => void;
}

/**
 * One item row inside a gearlist — always editable, click any field to change it in place
 * (no separate "Edit" button/mode, matching lighterpack).
 *
 * - Linked items (gearItemId set): name/category/weight edits are "core" edits that also
 *   touch the Gear Vault item, so they're routed up to the same Cancel/Copy/Continue dialog
 *   used from the Gear Vault panel (FR-5).
 * - Unlinked items (gearItemId null — a detached or copied item): name/category/weight are
 *   fully independent, no dialog needed.
 * - Quantity, Worn, Consumable and the note are always purely per-gearlist and edit directly,
 *   with no dialog — they can never affect another gearlist.
 */
export function GearListItemRow({ listId, item, onRequestCoreEdit, onReorder }: GearListItemRowProps) {
  const { state, updateListItem, updateUnlinkedListItem, removeListItem } = useApp();
  const linked = item.gearItemId !== null;
  const vaultCategory = state.categories.find((c) => c.name === item.categoryName) ?? null;
  const dragProps = makeDragHandlers(item.id, onReorder, 'list-item');

  function handleNameCommit(name: string) {
    if (linked) onRequestCoreEdit(item, { name });
    else updateUnlinkedListItem(listId, item.id, { name });
  }

  /** The category of a row is local to this gearlist: no dialog, the Vault item and the other
   * gearlists keep theirs (Martin, 2026-10-15). Change the Vault item's category to change it
   * everywhere. */
  function handleCategoryChange(categoryId: string | null) {
    const name = categoryId ? state.categories.find((c) => c.id === categoryId)?.name ?? item.categoryName : 'Uncategorized';
    updateUnlinkedListItem(listId, item.id, { categoryName: name });
  }

  function handleWeightCommit(displayValue: number) {
    const grams = toGrams(displayValue, state.unitPreference);
    if (linked) onRequestCoreEdit(item, { weightGrams: grams });
    else updateUnlinkedListItem(listId, item.id, { weightGrams: grams });
  }

  return (
    <div className="list-item-row" {...dragProps}>
      <span className="drag-handle" title="Drag to reorder">
        <Icon icon={ActionIcon.drag} size={16} />
      </span>
      <div className="list-item-main">
        <InlineTextField className="list-item-name" value={item.name} onCommit={handleNameCommit} />
        {/* Second line: note · category (click to change, FR-12) · custom-entry badge. The
            category and an empty "Add a note…" appear only on row hover / focus (always on
            touch) — review 2026-10-14, points 7–8. */}
        <span className="row-meta">
          <InlineTextField
            className="list-item-note"
            value={item.note}
            placeholder="Add a note…"
            allowEmpty
            onCommit={(note) => updateListItem(listId, item.id, { note })}
          />
          <span className="row-category">
            <InlineCategorySelect
              categories={state.categories}
              categoryId={linked ? vaultCategory?.id ?? null : null}
              categoryName={item.categoryName}
              onChange={handleCategoryChange}
            />
          </span>
          {!linked && (
            <Badge tone="warning" tip="No longer linked to Gear Vault">
              custom entry
            </Badge>
          )}
        </span>
      </div>

      <ItemFlagsToggle isWorn={item.isWorn} isConsumable={item.isConsumable} onChange={(patch) => updateListItem(listId, item.id, patch)} />

      <InlineNumberField
        className="list-item-weight"
        value={fromGrams(item.weightGrams, state.unitPreference)}
        format={(v) => formatWeight(toGrams(v, state.unitPreference), state.unitPreference)}
        onCommit={handleWeightCommit}
      />

      <InlineNumberField
        className="list-item-qty"
        value={item.quantity}
        min={1}
        integer
        format={(v) => `×${v}`}
        onCommit={(quantity) => updateListItem(listId, item.id, { quantity })}
      />

      <span className="list-item-subtotal">{formatWeight(item.weightGrams * item.quantity, state.unitPreference)}</span>

      <div className="list-item-actions">
        <IconButton label="Remove" icon={ActionIcon.remove} small tipEnd onClick={() => removeListItem(listId, item.id)} />
      </div>
    </div>
  );
}

/** Helper re-exported for GearListDetail so the "core edit affects other lists too" dialog
 * message can name how many other gearlists share this item. */
export { findAffectedLists };
