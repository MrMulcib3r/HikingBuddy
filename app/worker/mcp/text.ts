/**
 * Readable text for MCP tool answers (FR-26: every tool answers in text, so a client without
 * widgets still makes sense of it). Written for the model: names, weights in the user's units and
 * the ids it needs for the next call.
 */
import { categoryNameFor, computeBreakdown, findAffectedLists, findAffectedTemplates } from '../../src/state/logic';
import { formatWeight } from '../../src/utils/weight';
import { TIERS, tierOf } from '../../src/utils/pack';
import { sortByOrder } from '../../src/utils/reorder';
import { linkedRowCount } from '../../src/core/operations';
import type { RichPart } from '../../src/core/history';
import type { AppState, GearItem, GearList, GearListItem, UnitPreference } from '../../src/types';

export const day = (iso: string) => iso.slice(0, 10);

/** History descriptions (RichPart) as plain text. */
export function richText(parts: RichPart[], unit: UnitPreference): string {
  return parts
    .map((p) => {
      if (typeof p === 'string') return p;
      if ('b' in p) return p.b;
      if ('del' in p) return p.del;
      if ('w' in p) return formatWeight(p.w, unit);
      if ('time' in p) return `${p.time.slice(0, 16).replace('T', ' ')} UTC`;
      return day(p.date);
    })
    .join('');
}

export function breakdownLine(items: GearListItem[], unit: UnitPreference): string {
  const b = computeBreakdown(items);
  const tier = TIERS[tierOf(b.base)].name;
  return `Base ${formatWeight(b.base, unit)} · Consumables ${formatWeight(b.consumable, unit)} · Worn ${formatWeight(b.worn, unit)} · Total ${formatWeight(b.total, unit)} · pack class ${tier} (by base weight)`;
}

/** "Weekend Hikes, Kungsleden and the template" — where a Vault item is used (FR-5). */
export function usageText(state: AppState, gearItemId: string): string {
  const names = findAffectedLists(state, gearItemId).map((l) => `"${l.name}"`);
  if (findAffectedTemplates(state, gearItemId).length > 0) names.push('the template');
  return names.join(', ');
}

function itemLine(item: GearItem, state: AppState, unit: UnitPreference): string {
  const uses = linkedRowCount(state, item.id);
  const parts = [`- ${item.name} · ${formatWeight(item.weightGrams, unit)} · default qty ${item.defaultQuantity}`];
  if (uses > 0) parts.push(`used in ${usageText(state, item.id)}`);
  parts.push(`id ${item.id}`);
  return parts.join(' · ') + (item.note ? `\n  note: ${item.note}` : '');
}

export function vaultText(state: AppState, filter: { query?: string; categoryId?: string | null }): string {
  const unit = state.unitPreference;
  const q = filter.query?.trim().toLowerCase();
  const items = sortByOrder(state.gearItems).filter(
    (g) =>
      (!q || g.name.toLowerCase().includes(q) || g.note.toLowerCase().includes(q)) &&
      (filter.categoryId === undefined || g.categoryId === filter.categoryId)
  );
  const lines: string[] = [];
  const filtered = q !== undefined || filter.categoryId !== undefined;
  lines.push(
    filtered
      ? `Gear Vault: ${items.length} of ${state.gearItems.length} items match. Weights are per piece (units: ${unit}).`
      : `Gear Vault: ${items.length} items. Weights are per piece (units: ${unit}).`
  );
  const groups = [...sortByOrder(state.categories).map((c) => ({ id: c.id as string | null, name: c.name })), { id: null, name: 'Uncategorized' }];
  const empty: string[] = [];
  for (const group of groups) {
    const inGroup = items.filter((g) => (group.id === null ? !state.categories.some((c) => c.id === g.categoryId) : g.categoryId === group.id));
    if (inGroup.length === 0) {
      if (group.id !== null && !filtered) empty.push(`${group.name} (${group.id})`);
      continue;
    }
    lines.push('', `## ${group.name}${group.id ? ` (category id ${group.id})` : ''}`);
    for (const item of inGroup) lines.push(itemLine(item, state, unit));
  }
  if (empty.length > 0) lines.push('', `Empty categories: ${empty.join(', ')}.`);
  if (items.length === 0 && state.gearItems.length === 0) lines.push('', 'Gear Vault is empty. Gear can be added with add_gear_items (ask the user what they own first).');
  return lines.join('\n');
}

function rowLine(row: GearListItem, unit: UnitPreference): string {
  const flags = [row.isWorn ? 'worn' : '', row.isConsumable ? 'consumable' : ''].filter(Boolean);
  const each = row.quantity === 1 ? '' : ` (${formatWeight(row.weightGrams, unit)} each)`;
  const parts = [`- ${row.name} × ${row.quantity} · ${formatWeight(row.weightGrams * row.quantity, unit)}${each}`];
  if (flags.length) parts.push(flags.join(', '));
  parts.push(`row id ${row.id}`);
  parts.push(row.gearItemId ? `vault id ${row.gearItemId}` : 'custom entry, not linked to Gear Vault');
  return parts.join(' · ') + (row.note ? `\n  note: ${row.note}` : '');
}

/** Rows grouped by category in the list's own order (a gearlist orders its categories by its rows). */
function rowsText(items: GearListItem[], unit: UnitPreference): string[] {
  const groups: { name: string; rows: GearListItem[] }[] = [];
  for (const row of sortByOrder(items)) {
    const group = groups.find((g) => g.name === row.categoryName);
    if (group) group.rows.push(row);
    else groups.push({ name: row.categoryName, rows: [row] });
  }
  const lines: string[] = [];
  for (const g of groups) {
    lines.push('', `## ${g.name}`);
    for (const row of g.rows) lines.push(rowLine(row, unit));
  }
  return lines;
}

export function isTemplate(state: AppState, listId: string): boolean {
  return state.templates.some((t) => t.id === listId);
}

export function gearlistText(state: AppState, list: GearList, view: 'current' | 'snapshot'): string {
  const unit = state.unitPreference;
  const template = isTemplate(state, list.id);
  if (view === 'snapshot') {
    if (!list.snapshot) return `"${list.name}" has no snapshot.`;
    return [
      `Snapshot of gearlist "${list.name}" saved ${day(list.snapshot.savedAt)} (read-only copy; id ${list.id}).`,
      breakdownLine(list.snapshot.items, unit),
      ...rowsText(list.snapshot.items, unit),
    ].join('\n');
  }
  const head = template
    ? `Template (id ${list.id}): ${list.items.length} items. New gearlists can start from it (create_gearlist with from_template). Changes to it don't reach existing gearlists.`
    : `Gearlist "${list.name}" (id ${list.id}), created ${day(list.createdAt)}: ${list.items.length} rows.`;
  const lines = [head, breakdownLine(list.items, unit)];
  if (list.snapshot) lines.push(`Snapshot saved ${day(list.snapshot.savedAt)} (view="snapshot" shows it).`);
  if (list.items.length === 0) lines.push('', 'No items yet.');
  lines.push(...rowsText(list.items, unit));
  return lines.join('\n');
}

export function gearlistsText(state: AppState): string {
  const unit = state.unitPreference;
  const lines = [`Gearlists: ${state.gearLists.length}.`];
  for (const list of sortByOrder(state.gearLists)) {
    const b = computeBreakdown(list.items);
    lines.push(
      `- "${list.name}" (id ${list.id}) · ${list.items.length} rows · base ${formatWeight(b.base, unit)} · total ${formatWeight(b.total, unit)}${list.snapshot ? ` · snapshot ${day(list.snapshot.savedAt)}` : ''}`
    );
  }
  const template = state.templates[0];
  if (template) {
    const b = computeBreakdown(template.items);
    lines.push('', `Template (id ${template.id}) · ${template.items.length} rows · base ${formatWeight(b.base, unit)} · total ${formatWeight(b.total, unit)}`);
  } else lines.push('', 'No template.');
  return lines.join('\n');
}

export function categoryList(state: AppState): string {
  return sortByOrder(state.categories)
    .map((c) => `${c.name} (${c.id})`)
    .join(', ');
}

export { categoryNameFor };
