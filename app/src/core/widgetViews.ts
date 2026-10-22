/**
 * What the in-chat widgets show (PRD v33, FR-27, MCP Apps). The MCP tools put one of these
 * views into a tool result's `structuredContent`; the widget bundle (app/widget) only draws it.
 * Pure data, no DOM: the server builds the views from AppState, the widget imports the types.
 * Weights are grams; the widget formats them in `unit` with the web's formatWeight.
 */
import { categoryNameFor, computeBreakdown } from '../state/logic';
import { categoryColorKey, categoryForName, type CategoryColorKey } from '../utils/categoryStyle';
import { packCategoriesFromItems } from '../utils/pack';
import { sortByOrder } from '../utils/reorder';
import type { AppState, GearItem, GearList, GearListItem, UnitPreference } from '../types';

export interface ViewBase {
  unit: UnitPreference;
  /** "Open in HikingBuddy" (opened through the host), or null for no link. */
  link: string | null;
}

export interface CategoryLook {
  name: string;
  colorKey: CategoryColorKey;
  /** Vault category id when known: a default category's icon. */
  iconId: string | null;
}

/** WidgetPackSummary: one gearlist's weights, compact pack and categories. */
export interface SummaryView extends ViewBase {
  view: 'summary';
  title: string;
  itemCount: number;
  isTemplate: boolean;
  base: number;
  consumable: number;
  worn: number;
  total: number;
  /** Categories in the pack (Base + Consumables), heaviest first. */
  categories: (CategoryLook & { grams: number })[];
}

export interface GearRowView {
  name: string;
  quantity: number;
  /** Weight of one piece. */
  grams: number;
  worn: boolean;
  consumable: boolean;
  note: string;
}

/** WidgetGearList: a gearlist's rows, the Gear Vault or search results, grouped by category. */
export interface GearView extends ViewBase {
  view: 'gear';
  source: 'gearlist' | 'snapshot' | 'vault' | 'search' | 'added';
  title: string;
  itemCount: number;
  totalGrams: number;
  groups: (CategoryLook & { grams: number; rows: GearRowView[] })[];
}

/** WidgetItemCard: one Gear Vault item, or one gearlist row. */
export interface ItemView extends ViewBase {
  view: 'item';
  name: string;
  category: CategoryLook;
  grams: number;
  note: string;
  /** Gearlists using the item (the template as "Template"). */
  inLists: string[];
  row: { listName: string; quantity: number; worn: boolean; consumable: boolean } | null;
}

export type StateKind = 'saved' | 'empty-vault' | 'limit' | 'error' | 'access';

/** WidgetStates: saved, empty, daily limit, error, access ended. */
export interface StateView extends ViewBase {
  view: 'state';
  state: StateKind;
  title: string;
  text: string;
}

/** A part of a change's detail line; `{ old }` is the old value, shown struck through. */
export type DetailPart = string | { old: string };

export interface ProposalChangeView {
  id: string;
  kind: 'add' | 'remove' | 'delete' | 'change';
  name: string;
  grams: number;
  detail: DetailPart[];
  reason: string;
  status: 'open' | 'confirmed' | 'rejected';
  /** The row needs the user's choice (FR-5) instead of a plain Confirm: a Vault item used in
   * other gearlists ("fr5": Create a copy / Update everywhere) or deleted from them ("delete":
   * Keep in gearlists / Delete everywhere). `lists` names those gearlists. */
  choice: { type: 'fr5' | 'delete'; lists: string[] } | null;
}

/** WidgetProposedChanges: what the AI wants to change, saved only after the user confirms. */
export interface ProposalView extends ViewBase {
  view: 'proposal';
  id: string;
  listName: string;
  /** open = buttons; stale = the gearlist changed meanwhile (out of date); done = all decided. */
  status: 'open' | 'stale' | 'done';
  /** Base weight when the proposal was made → with the open and confirmed changes. */
  impact: { before: number; after: number };
  changes: ProposalChangeView[];
}

export type WidgetView = SummaryView | GearView | ItemView | StateView | ProposalView;

// ---------------------------------------------------------------------------------------------
// Builders (server side)

/** Links into the web app: the app opens the gearlist / shows the Vault item (App.tsx). */
export const links = {
  app: (origin: string) => `${origin}/`,
  gearlist: (origin: string, listId: string) => `${origin}/#gearlist=${encodeURIComponent(listId)}`,
  item: (origin: string, itemId: string) => `${origin}/#item=${encodeURIComponent(itemId)}`,
};

function lookByName(state: AppState, name: string): CategoryLook {
  const cat = categoryForName(name, state.categories);
  return { name, colorKey: categoryColorKey(cat?.id, state.categories), iconId: cat?.id ?? null };
}

function lookById(state: AppState, categoryId: string | null): CategoryLook {
  const known = state.categories.some((c) => c.id === categoryId);
  return {
    name: categoryNameFor(categoryId, state.categories),
    colorKey: categoryColorKey(known ? categoryId : null, state.categories),
    iconId: known ? categoryId : null,
  };
}

export function summaryView(state: AppState, list: GearList, origin: string): SummaryView {
  const b = computeBreakdown(list.items);
  const cats = packCategoriesFromItems(list.items, (name) => {
    const look = lookByName(state, name);
    return { colorKey: look.colorKey, iconId: look.iconId };
  })
    .filter((c) => c.grams > 0)
    .sort((a, z) => z.grams - a.grams);
  return {
    view: 'summary',
    unit: state.unitPreference,
    link: links.gearlist(origin, list.id),
    title: list.name,
    itemCount: list.items.length,
    isTemplate: state.templates.some((t) => t.id === list.id),
    base: b.base,
    consumable: b.consumable,
    worn: b.worn,
    total: b.total,
    categories: cats.map((c) => ({ name: c.name, colorKey: c.colorKey, iconId: c.iconId, grams: c.grams })),
  };
}

const rowView = (row: GearListItem): GearRowView => ({
  name: row.name,
  quantity: row.quantity,
  grams: row.weightGrams,
  worn: row.isWorn,
  consumable: row.isConsumable,
  note: row.note,
});

/** A gearlist's rows (or its snapshot's), grouped by category in the list's own order. */
export function listGearView(state: AppState, list: GearList, origin: string, snapshot = false): GearView {
  const items = snapshot && list.snapshot ? list.snapshot.items : list.items;
  const groups: GearView['groups'] = [];
  for (const row of sortByOrder(items)) {
    let group = groups.find((g) => g.name === row.categoryName);
    if (!group) {
      group = { ...lookByName(state, row.categoryName), grams: 0, rows: [] };
      groups.push(group);
    }
    group.rows.push(rowView(row));
    group.grams += row.weightGrams * row.quantity;
  }
  return {
    view: 'gear',
    unit: state.unitPreference,
    link: links.gearlist(origin, list.id),
    source: snapshot ? 'snapshot' : 'gearlist',
    title: snapshot ? `${list.name} · snapshot` : list.name,
    itemCount: items.length,
    totalGrams: computeBreakdown(items).total,
    groups,
  };
}

/** Gear Vault items grouped by category in the Vault's order (all, a search, or just added). */
export function vaultGearView(state: AppState, items: GearItem[], origin: string, source: 'vault' | 'search' | 'added', title: string): GearView {
  const ids = new Set(items.map((i) => i.id));
  const sorted = sortByOrder(state.gearItems).filter((g) => ids.has(g.id));
  const order = [...sortByOrder(state.categories).map((c) => c.id as string | null), null];
  const groups: GearView['groups'] = [];
  for (const catId of order) {
    const inGroup = sorted.filter((g) => (catId === null ? !state.categories.some((c) => c.id === g.categoryId) : g.categoryId === catId));
    if (inGroup.length === 0) continue;
    groups.push({
      ...lookById(state, catId),
      grams: inGroup.reduce((sum, g) => sum + g.weightGrams, 0),
      rows: inGroup.map((g) => ({ name: g.name, quantity: 1, grams: g.weightGrams, worn: false, consumable: false, note: g.note })),
    });
  }
  return {
    view: 'gear',
    unit: state.unitPreference,
    link: links.app(origin),
    source,
    title,
    itemCount: sorted.length,
    totalGrams: sorted.reduce((sum, g) => sum + g.weightGrams, 0),
    groups,
  };
}

/** Names of the gearlists (and "Template") a Vault item is used in. */
export function listsUsing(state: AppState, gearItemId: string, exceptListId?: string): string[] {
  const names = sortByOrder(state.gearLists)
    .filter((l) => l.id !== exceptListId && l.items.some((i) => i.gearItemId === gearItemId))
    .map((l) => l.name);
  if (state.templates.some((t) => t.id !== exceptListId && t.items.some((i) => i.gearItemId === gearItemId))) names.push('Template');
  return names;
}

export function itemView(state: AppState, item: GearItem, origin: string): ItemView {
  return {
    view: 'item',
    unit: state.unitPreference,
    link: links.item(origin, item.id),
    name: item.name,
    category: lookById(state, item.categoryId),
    grams: item.weightGrams,
    note: item.note,
    inLists: listsUsing(state, item.id),
    row: null,
  };
}

const STATES: Record<Exclude<StateKind, 'saved'>, { title: string; text: string }> = {
  'empty-vault': { title: 'Your Gear Vault is empty', text: 'Ask in the chat to add your gear, or add it in HikingBuddy.' },
  limit: { title: "HikingBuddy reached today's free limit", text: 'Try again tomorrow. Your gear is safe and nothing was changed.' },
  error: { title: "Couldn't reach HikingBuddy", text: 'Nothing was changed. Try again in a moment.' },
  access: { title: 'HikingBuddy is not connected', text: "Your access ended or was revoked. Reconnect HikingBuddy in your AI app's connector settings." },
};

export function stateView(state: Exclude<StateKind, 'saved'>, unit: UnitPreference, link: string | null = null): StateView {
  return { view: 'state', unit, link, state, ...STATES[state] };
}
