/**
 * PRD v33/v35, FR-25: the change history (Activity) and Undo. Pure functions, like the operations
 * layer they sit on: the server records and undoes with them; the browser only shows the result.
 *
 * How a change is recorded: every operation is applied on its own, and the state before and
 * after it is compared thing by thing (category, Gear Vault item, gearlist, gearlist row,
 * snapshot). For each thing that changed we keep only the fields that changed, before and after
 * ("weightGrams: 85 → 79"); a new thing keeps its whole value as "after", a deleted thing its whole
 * value as "before" — that is what makes a soft-deleted gearlist restorable from history.
 *
 * Undo: put the changed fields back to "before". If a field no longer has the "after" value,
 * something changed it later: that is a conflict, and the caller decides (Undo anyway / keep the
 * later change). Several changes are undone newest first, each on top of the previous result, so
 * changes inside one AI step never conflict with each other.
 */
import { applyOperation, OperationError, type Operation, type RestoreAction } from './operations';
import { stableStringify } from './schema';
import type { AppState, GearList, GearListItem } from '../types';

export type EntityKind = 'category' | 'gearItem' | 'list' | 'row' | 'snapshot';
type Obj = Record<string, unknown>;

/** One thing changed by one operation. b = before, a = after (only the changed fields when both
 * exist); b null = created, a null = deleted. `l` is the gearlist id of a row. */
export interface EntityDiff {
  k: EntityKind;
  id: string;
  l?: string;
  b: Obj | null;
  a: Obj | null;
}

/** Description text: plain strings, names in bold, deleted names struck through, and values the
 * browser formats itself (weights in the user's units, times in the user's time zone). */
export type RichPart = string | { b: string } | { del: string } | { w: number } | { time: string } | { date: string };
export type ChangeIcon = 'add' | 'edit' | 'delete' | 'remove' | 'snapshot' | 'template' | 'undo';

/** One operation = one single change in an entry. */
export interface HistoryChange {
  text: RichPart[];
  icon: ChangeIcon;
  diffs: EntityDiff[];
  /** A delete: the badge says until when it can be restored. */
  deleted?: boolean;
  undoneAt?: string | null;
  undoneBy?: string | null;
}

export interface UndoTarget {
  entryId: string;
  change: number;
}

export type Actor = 'you' | 'ai';

/** One entry = one web action, one AI step, one import or one Undo (FR-25: the Undo unit). */
export interface HistoryEntry {
  id: string;
  at: string;
  actor: Actor;
  /** The AI client's name as it registered ("Claude"); null for the user's own changes. */
  client: string | null;
  kind: 'change' | 'import' | 'undo' | 'redo';
  text: RichPart[];
  changes: HistoryChange[];
  /** Undo / redo entries: which changes they reverted. */
  undoes?: UndoTarget[];
  /** False when the before/after values were too large to keep (a huge import). */
  undoable: boolean;
}

/** History (and soft-deleted things) are kept this long (FR-25). */
export const HISTORY_DAYS = 30;
/** D1 rows can hold up to 2 MB; above this an entry is kept without before/after (no Undo). */
const MAX_ENTRY_JSON = 900_000;

// ---------------------------------------------------------------------------------------------
// Comparing two states

const eq = (x: unknown, y: unknown) => x === y || stableStringify(x) === stableStringify(y);

function fieldDiff(before: Obj, after: Obj): { b: Obj; a: Obj } | null {
  const b: Obj = {};
  const a: Obj = {};
  let changed = false;
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (eq(before[key], after[key])) continue;
    b[key] = before[key];
    a[key] = after[key];
    changed = true;
  }
  return changed ? { b, a } : null;
}

function diffById<T extends { id: string }>(k: EntityKind, before: T[], after: T[], out: EntityDiff[], l?: string) {
  const old = new Map(before.map((x) => [x.id, x]));
  for (const x of after) {
    const prev = old.get(x.id);
    old.delete(x.id);
    if (prev === x) continue;
    if (!prev) {
      out.push({ k, id: x.id, l, b: null, a: { ...x } as Obj });
      continue;
    }
    const d = fieldDiff(prev as unknown as Obj, x as unknown as Obj);
    if (d) out.push({ k, id: x.id, l, ...d });
  }
  for (const [id, prev] of old) out.push({ k, id, l, b: { ...prev } as Obj, a: null });
}

type ListKind = 'list' | 'template';
function listsById(state: AppState): Map<string, { list: GearList; kind: ListKind }> {
  const map = new Map<string, { list: GearList; kind: ListKind }>();
  for (const list of state.gearLists) map.set(list.id, { list, kind: 'list' });
  for (const list of state.templates) map.set(list.id, { list, kind: 'template' });
  return map;
}
const listHeader = (list: GearList, kind: ListKind): Obj => ({ id: list.id, kind, name: list.name, createdAt: list.createdAt, order: list.order });
const snapshotValue = (list: GearList): Obj | null => (list.snapshot ? { savedAt: list.snapshot.savedAt, items: list.snapshot.items } : null);

/** Everything that differs between two states, thing by thing (settings are not data: PRD v35 A). */
export function diffStates(before: AppState, after: AppState): EntityDiff[] {
  const out: EntityDiff[] = [];
  if (before.categories !== after.categories) diffById('category', before.categories, after.categories, out);
  if (before.gearItems !== after.gearItems) diffById('gearItem', before.gearItems, after.gearItems, out);
  const bl = listsById(before);
  const al = listsById(after);
  const ids = [...new Set([...bl.keys(), ...al.keys()])];
  const changedIds = ids.filter((id) => bl.get(id)?.list !== al.get(id)?.list);
  for (const id of changedIds) {
    const b = bl.get(id);
    const a = al.get(id);
    if (!b) out.push({ k: 'list', id, b: null, a: listHeader(a!.list, a!.kind) });
    else if (!a) out.push({ k: 'list', id, b: listHeader(b.list, b.kind), a: null });
    else {
      const d = fieldDiff(listHeader(b.list, b.kind), listHeader(a.list, a.kind));
      if (d) out.push({ k: 'list', id, ...d });
    }
  }
  for (const id of changedIds) {
    const b = bl.get(id)?.list;
    const a = al.get(id)?.list;
    if (b?.items !== a?.items) diffById('row', b?.items ?? [], a?.items ?? [], out, id);
  }
  for (const id of changedIds) {
    const b = bl.get(id)?.list;
    const a = al.get(id)?.list;
    if (b?.snapshot === a?.snapshot) continue;
    const sb = b ? snapshotValue(b) : null;
    const sa = a ? snapshotValue(a) : null;
    if (!sb && !sa) continue;
    if (!sb || !sa) out.push({ k: 'snapshot', id, b: sb, a: sa });
    else {
      const d = fieldDiff(sb, sa);
      if (d) out.push({ k: 'snapshot', id, ...d });
    }
  }
  return out;
}

/** The current value of one thing (null = it doesn't exist now). */
function currentValue(state: AppState, k: EntityKind, id: string, l?: string): Obj | null {
  switch (k) {
    case 'category':
      return (state.categories.find((c) => c.id === id) as unknown as Obj) ?? null;
    case 'gearItem':
      return (state.gearItems.find((g) => g.id === id) as unknown as Obj) ?? null;
    case 'list': {
      const found = listsById(state).get(id);
      return found ? listHeader(found.list, found.kind) : null;
    }
    case 'row': {
      const found = listsById(state).get(l ?? '');
      return (found?.list.items.find((i) => i.id === id) as unknown as Obj) ?? null;
    }
    case 'snapshot': {
      const found = listsById(state).get(id);
      return found ? snapshotValue(found.list) : null;
    }
  }
}

export const diffKey = (d: { k: EntityKind; id: string; l?: string }) => `${d.k}:${d.l ?? ''}:${d.id}`;

// ---------------------------------------------------------------------------------------------
// Recording

export interface RecordedGroup {
  action: string | undefined;
  changes: HistoryChange[];
  ops: Operation[];
}

/** Applies operations like `applyOperations`, and records what each one changed. Consecutive
 * operations with the same action id (one click on the web, one AI step) form one group. */
export function recordOperations(
  state: AppState,
  ops: Operation[],
  actions?: (string | null | undefined)[]
): { state: AppState; rejected: { index: number; error: OperationError }[]; groups: RecordedGroup[] } {
  let current = state;
  const rejected: { index: number; error: OperationError }[] = [];
  const groups: RecordedGroup[] = [];
  ops.forEach((op, index) => {
    let next: AppState;
    try {
      next = applyOperation(current, op);
    } catch (err) {
      if (err instanceof OperationError) {
        rejected.push({ index, error: err });
        return;
      }
      throw err;
    }
    const diffs = diffStates(current, next);
    if (diffs.length > 0) {
      const action = actions?.[index] ?? undefined;
      const last = groups[groups.length - 1];
      const group = last && action !== undefined && last.action === action ? last : null;
      const change: HistoryChange = { ...describeOperation(op, current, next, diffs), diffs };
      if (group) {
        group.changes.push(change);
        group.ops.push(op);
      } else groups.push({ action, changes: [change], ops: [op] });
    }
    current = next;
  });
  return { state: current, rejected, groups };
}

/** Builds the entry for a recorded group (the caller adds id, time and who). */
export function entryFromGroup(group: RecordedGroup, base: Pick<HistoryEntry, 'id' | 'at' | 'actor' | 'client'>): HistoryEntry {
  return limitSize({ ...base, kind: 'change', text: summarizeGroup(group), changes: group.changes, undoable: true });
}

/** FR-23 import / Import backup / demo data while signed in: one entry, undoable (PRD v35 B). */
export function importEntry(before: AppState, after: AppState, base: Pick<HistoryEntry, 'id' | 'at' | 'actor' | 'client'>): HistoryEntry | null {
  const diffs = diffStates(before, after);
  if (diffs.length === 0) return null;
  const items = diffs.filter((d) => d.k === 'gearItem' && d.b === null).length;
  const lists = diffs.filter((d) => d.k === 'list' && d.b === null && d.a?.kind === 'list').length;
  const text: RichPart[] = [`Imported ${plural(items, 'item')} and ${plural(lists, 'gearlist')}`];
  return limitSize({ ...base, kind: 'import', text, changes: [{ text, icon: 'add', diffs }], undoable: true });
}

function limitSize(entry: HistoryEntry): HistoryEntry {
  if (JSON.stringify(entry).length <= MAX_ENTRY_JSON) return entry;
  return { ...entry, undoable: false, changes: entry.changes.map((c) => ({ ...c, diffs: [] })) };
}

// ---------------------------------------------------------------------------------------------
// Descriptions (English UI text, design system ActivityPanel: short, past tense, names in bold)

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function listName(state: AppState, id: string): string {
  return listsById(state).get(id)?.list.name ?? 'a gearlist';
}
function rowOf(state: AppState, listId: string, rowId: string): GearListItem | undefined {
  return listsById(state).get(listId)?.list.items.find((i) => i.id === rowId);
}
function gearName(state: AppState, id: string): string {
  return state.gearItems.find((g) => g.id === id)?.name ?? 'an item';
}
function categoryName(state: AppState, id: string | null): string {
  if (id === null) return 'Uncategorized';
  return state.categories.find((c) => c.id === id)?.name ?? 'a category';
}

export function describeOperation(op: Operation, prev: AppState, next: AppState, diffs: EntityDiff[]): Omit<HistoryChange, 'diffs'> {
  switch (op.type) {
    case 'ADD_CATEGORY':
      return { icon: 'add', text: ['Added category ', { b: op.name.trim() }] };
    case 'RENAME_CATEGORY':
      return { icon: 'edit', text: ['Renamed category ', { b: categoryName(prev, op.id) }, ' to ', { b: op.name.trim() }] };
    case 'DELETE_CATEGORY':
      return { icon: 'delete', deleted: true, text: ['Deleted category ', { del: categoryName(prev, op.id) }] };
    case 'REORDER_CATEGORIES':
      return { icon: 'edit', text: ['Moved category ', { b: categoryName(prev, op.sourceId) }] };
    case 'ADD_GEAR_ITEM':
      return { icon: 'add', text: ['Added ', { b: op.item.name.trim() }, ' to Gear Vault'] };
    case 'UPDATE_GEAR_ITEM': {
      const before = prev.gearItems.find((g) => g.id === op.id);
      const after = next.gearItems.find((g) => g.id === op.id);
      if (!before || !after) return { icon: 'edit', text: ['Changed ', { b: op.patch.name }] };
      const fields: string[] = [];
      if (before.name !== after.name) fields.push('name');
      if (before.weightGrams !== after.weightGrams) fields.push('weight');
      if (before.categoryId !== after.categoryId) fields.push('category');
      if (before.note !== after.note) fields.push('note');
      if (before.defaultQuantity !== after.defaultQuantity) fields.push('default quantity');
      if (fields.length === 1) {
        switch (fields[0]) {
          case 'name':
            return { icon: 'edit', text: ['Renamed ', { b: before.name }, ' to ', { b: after.name }] };
          case 'weight':
            return { icon: 'edit', text: ['Changed weight of ', { b: after.name }, ': ', { w: before.weightGrams }, ' → ', { w: after.weightGrams }] };
          case 'category':
            return { icon: 'edit', text: ['Moved ', { b: after.name }, ' to category ', { b: categoryName(next, after.categoryId) }] };
          case 'note':
            return { icon: 'edit', text: ['Changed note of ', { b: after.name }] };
          default:
            return { icon: 'edit', text: ['Changed default quantity of ', { b: after.name }, `: ${before.defaultQuantity} → ${after.defaultQuantity}`] };
        }
      }
      return { icon: 'edit', text: ['Changed ', { b: after.name }, ` (${fields.join(', ')})`] };
    }
    case 'DELETE_GEAR_ITEM':
      return { icon: 'delete', deleted: true, text: ['Deleted ', { del: gearName(prev, op.id) }, ' from Gear Vault'] };
    case 'REORDER_GEAR_ITEMS': {
      const before = prev.gearItems.find((g) => g.id === op.sourceId);
      if (before && before.categoryId !== op.targetCategoryId) {
        return { icon: 'edit', text: ['Moved ', { b: before.name }, ' to category ', { b: categoryName(next, op.targetCategoryId) }] };
      }
      return { icon: 'edit', text: ['Moved ', { b: gearName(prev, op.sourceId) }, ' in Gear Vault'] };
    }
    case 'CREATE_LIST':
      return { icon: 'add', text: ['Created gearlist ', { b: op.name.trim() }] };
    case 'CREATE_LIST_FROM_TEMPLATE': {
      const rows = diffs.filter((d) => d.k === 'row' && d.b === null).length;
      return { icon: 'add', text: ['Created gearlist ', { b: op.name.trim() }, ` from the template with ${plural(rows, 'item')}`] };
    }
    case 'ADD_ITEM_TO_LIST': {
      const existing = listsById(prev).get(op.listId)?.list.items.find((i) => i.gearItemId === op.gearItemId);
      const name = gearName(prev, op.gearItemId);
      if (existing) {
        const now = rowOf(next, op.listId, existing.id);
        return { icon: 'edit', text: ['Changed quantity of ', { b: name }, ' in ', { b: listName(prev, op.listId) }, `: ${existing.quantity} → ${now?.quantity ?? existing.quantity}`] };
      }
      return { icon: 'add', text: ['Added ', { b: name }, ' to ', { b: listName(prev, op.listId) }] };
    }
    case 'UPDATE_LIST_ITEM':
    case 'UPDATE_UNLINKED_LIST_ITEM': {
      const before = rowOf(prev, op.listId, op.itemId);
      const after = rowOf(next, op.listId, op.itemId);
      const list = { b: listName(prev, op.listId) };
      if (!before || !after) return { icon: 'edit', text: ['Changed an item in ', list] };
      const name = { b: before.name };
      const parts: RichPart[][] = [];
      if (before.quantity !== after.quantity) parts.push(['Changed quantity of ', name, ' in ', list, `: ${before.quantity} → ${after.quantity}`]);
      if (before.isWorn !== after.isWorn) parts.push([after.isWorn ? 'Marked ' : 'Unmarked ', name, ' as Worn in ', list]);
      if (before.isConsumable !== after.isConsumable) parts.push([after.isConsumable ? 'Marked ' : 'Unmarked ', name, ' as Consumable in ', list]);
      if (before.name !== after.name) parts.push(['Renamed ', name, ' to ', { b: after.name }, ' in ', list]);
      if (before.weightGrams !== after.weightGrams) parts.push(['Changed weight of ', name, ' in ', list, ': ', { w: before.weightGrams }, ' → ', { w: after.weightGrams }]);
      if (before.categoryName !== after.categoryName) parts.push(['Moved ', name, ' to ', { b: after.categoryName }, ' in ', list]);
      if (before.note !== after.note) parts.push(['Changed note of ', name, ' in ', list]);
      if (parts.length === 1) return { icon: 'edit', text: parts[0] };
      return { icon: 'edit', text: ['Changed ', name, ' in ', list] };
    }
    case 'COPY_AND_RELINK_LIST_ITEM':
      return { icon: 'add', text: ['Created ', { b: op.item.name.trim() }, ' as a copy for ', { b: listName(prev, op.listId) }] };
    case 'REMOVE_LIST_ITEM':
      return { icon: 'remove', text: ['Removed ', { b: rowOf(prev, op.listId, op.itemId)?.name ?? 'an item' }, ' from ', { b: listName(prev, op.listId) }] };
    case 'REORDER_LIST_ITEMS':
      return { icon: 'edit', text: ['Moved ', { b: rowOf(prev, op.listId, op.sourceId)?.name ?? 'an item' }, ' in ', { b: listName(prev, op.listId) }] };
    case 'REORDER_LIST_CATEGORIES':
      return { icon: 'edit', text: ['Moved category ', { b: op.sourceName }, ' in ', { b: listName(prev, op.listId) }] };
    case 'SAVE_SNAPSHOT':
      return { icon: 'snapshot', text: ['Saved snapshot of ', { b: listName(prev, op.listId) }] };
    case 'REORDER_LISTS':
      return { icon: 'edit', text: ['Moved gearlist ', { b: listName(prev, op.sourceId) }] };
    case 'DELETE_LIST':
      return { icon: 'delete', deleted: true, text: ['Deleted gearlist ', { del: listName(prev, op.listId) }] };
    case 'SAVE_AS_TEMPLATE':
      return prev.templates.length > 0
        ? { icon: 'template', text: ['Updated the template from ', { b: listName(prev, op.listId) }] }
        : { icon: 'template', text: ['Saved ', { b: listName(prev, op.listId) }, ' as the template'] };
    case 'DELETE_TEMPLATE':
      return { icon: 'delete', deleted: true, text: ['Deleted the ', { del: 'Template' }] };
    case 'RESTORE':
      return { icon: 'undo', text: ['Restored earlier values'] };
    case 'DISMISS_TEMPLATE_BANNER':
    case 'SET_UNIT_PREFERENCE':
      return { icon: 'edit', text: ['Changed a setting'] };
  }
}

/** One sentence for an entry with several changes ("Created gearlist X with 25 items."). */
function summarizeGroup(group: RecordedGroup): RichPart[] {
  const { ops, changes } = group;
  if (changes.length === 1) return changes[0].text;
  const first = ops[0];
  const rest = ops.slice(1);
  // A new gearlist filled in the same step (possibly with new Gear Vault items for it).
  if (
    (first.type === 'CREATE_LIST' || first.type === 'CREATE_LIST_FROM_TEMPLATE') &&
    rest.every((o) => (o.type === 'ADD_ITEM_TO_LIST' && o.listId === first.id) || o.type === 'ADD_GEAR_ITEM' || o.type === 'ADD_CATEGORY')
  ) {
    const rows = changes.flatMap((c) => c.diffs).filter((d) => d.k === 'row' && d.b === null && d.l === first.id).length;
    const newItems = rest.filter((o) => o.type === 'ADD_GEAR_ITEM').length;
    return ['Created gearlist ', { b: first.name.trim() }, ` with ${plural(rows, 'item')}${newItems ? ` (${newItems} new in Gear Vault)` : ''}`];
  }
  if (ops.every((o) => o.type === 'ADD_ITEM_TO_LIST' && o.listId === (first as { listId?: string }).listId)) {
    const name = changes[0].text.find((p): p is { b: string } => typeof p === 'object' && 'b' in p);
    const list = changes[0].text.filter((p): p is { b: string } => typeof p === 'object' && 'b' in p)[1];
    if (name && list) return ['Added ', name, ` and ${plural(ops.length - 1, 'more item')} to `, list];
  }
  if (ops.every((o) => o.type === 'REMOVE_LIST_ITEM' && o.listId === (first as { listId?: string }).listId)) {
    const list = changes[0].text.filter((p): p is { b: string } => typeof p === 'object' && 'b' in p)[1];
    if (list) return [`Removed ${ops.length} items from `, list];
  }
  return [...changes[0].text, ` and ${plural(changes.length - 1, 'more change')}`];
}

// ---------------------------------------------------------------------------------------------
// Undo

export type UndoMode = 'all' | 'keep_later';

export interface Conflict {
  /** Things whose later changes would be overwritten (to find those changes in the history). */
  keys: { key: string; fields: string[] | null }[];
  /** Name of the thing, for a message when the later change isn't in the history. */
  name: string;
}

export interface UndoPlanResult {
  state: AppState;
  conflicts: Conflict[];
  /** Targets that were reverted (fully skipped ones stay active). */
  applied: UndoTarget[];
  /** How many of the targets conflict with later changes. */
  conflicting: number;
}

/** Undoes the given changes, newest first, each on top of the previous result. */
export function undoChanges(state: AppState, targets: { target: UndoTarget; change: HistoryChange }[], mode: UndoMode): UndoPlanResult {
  let current = state;
  const conflicts: Conflict[] = [];
  const applied: UndoTarget[] = [];
  let conflicting = 0;
  for (const { target, change } of [...targets].reverse()) {
    const plan = planChange(current, change.diffs, mode);
    conflicts.push(...plan.conflicts);
    if (plan.conflicts.length > 0) conflicting++;
    if (plan.actions.length > 0) current = applyOperation(current, { type: 'RESTORE', actions: plan.actions });
    if (plan.actions.length > 0 || plan.conflicts.length === 0) applied.push(target);
  }
  return { state: current, conflicts, applied: applied.reverse(), conflicting };
}

const nameOf = (...values: (Obj | null | undefined)[]) => {
  for (const v of values) if (v && typeof v.name === 'string') return v.name;
  return 'An item';
};

/** The restore actions for one change, and its conflicts with what happened later. */
function planChange(state: AppState, diffs: EntityDiff[], mode: UndoMode): { actions: RestoreAction[]; conflicts: Conflict[] } {
  const actions: RestoreAction[] = [];
  const conflicts: Conflict[] = [];
  const deleting = new Set(diffs.filter((d) => d.b === null).map(diffKey));
  const creating = new Set(diffs.filter((d) => d.a === null).map(diffKey));

  for (const d of diffs) {
    const cur = currentValue(state, d.k, d.id, d.l);
    const key = diffKey(d);
    if (d.b === null) {
      // Undo of "created": delete it — unless it was changed later, or later things depend on it.
      if (!cur) continue;
      const changed = Object.keys(d.a!).filter((f) => !eq(cur[f], d.a![f]));
      const dependents = dependentsOf(state, d, deleting);
      if (changed.length || dependents.length) {
        conflicts.push({ keys: [...(changed.length ? [{ key, fields: changed }] : []), ...dependents.map((k) => ({ key: k, fields: null }))], name: nameOf(cur, d.a) });
        if (mode === 'keep_later') continue;
      }
      actions.push({ k: d.k, id: d.id, l: d.l, set: null });
    } else if (d.a === null) {
      // Undo of "deleted": bring it back (if it isn't back already and its gearlist still exists).
      if (cur) continue;
      if (d.k === 'row' || d.k === 'snapshot') {
        const listId = d.k === 'row' ? d.l! : d.id;
        if (!currentValue(state, 'list', listId) && !creating.has(diffKey({ k: 'list', id: listId }))) {
          conflicts.push({ keys: [{ key: diffKey({ k: 'list', id: listId }), fields: null }], name: nameOf(d.b) });
          continue;
        }
      }
      if (d.k === 'list' && d.b.kind === 'template' && state.templates.length > 0) {
        conflicts.push({ keys: [{ key: diffKey({ k: 'list', id: state.templates[0].id }), fields: null }], name: 'Template' });
        continue;
      }
      actions.push({ k: d.k, id: d.id, l: d.l, set: d.b, whole: true });
    } else {
      // Undo of "changed": put the changed fields back.
      if (!cur) {
        conflicts.push({ keys: [{ key, fields: null }], name: nameOf(d.b, d.a) });
        continue;
      }
      const fields = Object.keys(d.b);
      const changed = fields.filter((f) => !eq(cur[f], d.a![f]));
      if (changed.length) conflicts.push({ keys: [{ key, fields: changed }], name: nameOf(cur) });
      const restore = mode === 'keep_later' ? fields.filter((f) => !changed.includes(f)) : fields;
      if (restore.length) actions.push({ k: d.k, id: d.id, l: d.l, set: Object.fromEntries(restore.map((f) => [f, d.b![f]])) });
    }
  }
  return { actions, conflicts };
}

/** Things that would be removed or altered with it: rows linked to a Vault item, items in a
 * category, rows of a gearlist — unless the same Undo removes them too. */
function dependentsOf(state: AppState, d: EntityDiff, deleting: Set<string>): string[] {
  const out: string[] = [];
  const lists = [...state.gearLists, ...state.templates];
  if (d.k === 'gearItem') {
    for (const list of lists) for (const row of list.items) if (row.gearItemId === d.id) out.push(diffKey({ k: 'row', id: row.id, l: list.id }));
  } else if (d.k === 'category') {
    for (const item of state.gearItems) if (item.categoryId === d.id) out.push(diffKey({ k: 'gearItem', id: item.id }));
  } else if (d.k === 'list') {
    const list = lists.find((l) => l.id === d.id);
    for (const row of list?.items ?? []) out.push(diffKey({ k: 'row', id: row.id, l: d.id }));
  }
  return out.filter((k) => !deleting.has(k));
}

/** Later changes (not undone, not part of this Undo) that touched the conflicting things.
 * `isLater` says whether change `index` of `entry` happened after the undone change(s). */
export function laterChangesFor(
  entries: HistoryEntry[],
  isLater: (entry: HistoryEntry, index: number) => boolean,
  conflicts: Conflict[],
  exclude: Set<string>
): { entry: HistoryEntry; change: HistoryChange; ref: string }[] {
  const found = new Map<string, { entry: HistoryEntry; change: HistoryChange; ref: string }>();
  for (const conflict of conflicts) {
    for (const { key, fields } of conflict.keys) {
      // Only the latest later change of each thing: the one whose value would be overwritten.
      let latest: { entry: HistoryEntry; change: HistoryChange; ref: string } | null = null;
      for (const entry of entries) {
        entry.changes.forEach((change, index) => {
          const ref = `${entry.id}#${index}`;
          if (exclude.has(ref) || change.undoneAt || !isLater(entry, index)) return;
          const touches = change.diffs.some(
            (d) => diffKey(d) === key && (fields === null || d.a === null || d.b === null || fields.some((f) => f in (d.a ?? {})))
          );
          if (touches) latest = { entry, change, ref };
        });
      }
      if (latest) found.set((latest as { ref: string }).ref, latest);
    }
  }
  return [...found.values()].sort((x, y) => compareEntries(x.entry, y.entry));
}

/** History order: by time, then by id (entries saved in one request share a millisecond). */
export function compareEntries(x: Pick<HistoryEntry, 'at' | 'id'>, y: Pick<HistoryEntry, 'at' | 'id'>): number {
  if (x.at !== y.at) return x.at < y.at ? -1 : 1;
  return x.id < y.id ? -1 : x.id > y.id ? 1 : 0;
}

/** Marks changes undone (or active again), following undo / redo chains: when an Undo entry is
 * itself undone, the changes it had reverted become active again — and the other way round. */
export function setUndone(byId: Map<string, HistoryEntry>, target: UndoTarget, undone: boolean, by: string, at: string, touched: Set<string>, depth = 0) {
  const entry = byId.get(target.entryId);
  const change = entry?.changes[target.change];
  if (!entry || !change || depth > 50) return;
  change.undoneAt = undone ? at : null;
  change.undoneBy = undone ? by : null;
  touched.add(entry.id);
  for (const t of entry.undoes ?? []) setUndone(byId, t, !undone, entry.id, entry.at, touched, depth + 1);
}

/** Whole entry undone = every change in it undone; the time of the last one. */
export function entryUndoneAt(entry: HistoryEntry): string | null {
  if (entry.changes.length === 0 || entry.changes.some((c) => !c.undoneAt)) return null;
  return entry.changes.map((c) => c.undoneAt!).sort().at(-1) ?? null;
}
