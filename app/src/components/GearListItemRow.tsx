import { useApp } from '../state/AppContext';
import { findAffectedLists } from '../state/logic';
import type { GearListItem } from '../types';
import { formatWeight, fromGrams, toGrams } from '../utils/weight';
import { makeDragHandlers } from '../utils/dnd';
import { ItemFlagsToggle } from './ItemFlagsToggle';
import { InlineTextField, InlineNumberField } from './InlineField';
import { InlineCategorySelect } from './InlineCategorySelect';

interface GearListItemRowProps {
  listId: string;
  item: GearListItem;
  onRequestCoreEdit: (item: GearListItem, patch: { name?: string; categoryId?: string | null; weightGrams?: number }) => void;
  onReorder: (sourceId: string, targetId: string) => void;
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
  const dragProps = makeDragHandlers(item.id, onReorder);

  function handleNameCommit(name: string) {
    if (linked) onRequestCoreEdit(item, { name });
    else updateUnlinkedListItem(listId, item.id, { name });
  }

  function handleCategoryChange(categoryId: string | null) {
    if (linked) {
      onRequestCoreEdit(item, { categoryId });
      return;
    }
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
        ⠿
      </span>
      <div className="list-item-main">
        <InlineTextField className="list-item-name" value={item.name} onCommit={handleNameCommit} />
        <InlineTextField
          className="list-item-note"
          value={item.note}
          placeholder="Add a note…"
          allowEmpty
          onCommit={(note) => updateListItem(listId, item.id, { note })}
        />
        {!linked && <span className="badge badge-unlinked">custom entry</span>}
      </div>

      <InlineCategorySelect
        categories={state.categories}
        categoryId={linked ? vaultCategory?.id ?? null : null}
        categoryName={item.categoryName}
        onChange={handleCategoryChange}
      />

      <InlineNumberField
        className="list-item-weight"
        value={fromGrams(item.weightGrams, state.unitPreference)}
        format={(v) => formatWeight(toGrams(v, state.unitPreference), state.unitPreference)}
        onCommit={handleWeightCommit}
      />

      <ItemFlagsToggle
        isWorn={item.isWorn}
        isConsumable={item.isConsumable}
        onChange={(patch) => updateListItem(listId, item.id, patch)}
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
        <button type="button" className="btn btn-ghost btn-small" onClick={() => removeListItem(listId, item.id)}>
          Remove
        </button>
      </div>
    </div>
  );
}

/** Helper re-exported for GearListDetail so the "core edit affects other lists too" dialog
 * message can name how many other gearlists share this item. */
export { findAffectedLists };
