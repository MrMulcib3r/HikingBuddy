import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { DEFAULT_CATEGORIES } from './constants';
import { UNCATEGORIZED } from './types';
import type { Category, GearList, GearListItem, UnitPreference } from './types';
import { sortByOrder } from './utils/reorder';
import { categoryColorKey, categoryForName, isValidColorKey, type CategoryColorKey } from './utils/categoryStyle';

/**
 * FR-18 — read-only gearlist sharing without a server. The gearlist is compressed into the
 * link itself, after `#` (that part of a URL is never sent to the hosting server):
 *
 *   https://…/#share=v2:<lz-string, URL-safe>
 *
 * The link format has its own version number (CLAUDE.md, data storage rule 7), separate
 * from the app's schemaVersion: every version ever published stays decodable here, so
 * links sent earlier keep opening after data-model changes. Never change what a published
 * version means — add a new version with its own decoder instead.
 *
 * Payloads use short keys / arrays to keep the link as short as possible:
 *   v1 (2026-10-09): { n: gearlist name, u: 'm' | 'i' (sharer's units), c: [category names in
 *       display order], i: [[name, category index, grams per piece, quantity, note, flags]] }
 *       flags: 1 = Worn, 2 = Consumable
 *   v2 (2026-10-12, PRD v21): same, but each category is [name, colour key] so the shared page
 *       shows the category's colour and icon even when it was renamed or is the user's own
 *       (keys: utils/categoryStyle.ts — `shelter`, `custom-2`, `none`, …).
 */

const PREFIX = '#share=';
const CURRENT_VERSION = 'v2';

/** What a shared gearlist page shows — a plain, self-contained copy of the gearlist. */
export interface SharedGearlist {
  name: string;
  unitPreference: UnitPreference;
  /** Items grouped by category, in the gearlist's display order. */
  categories: SharedCategory[];
}

export interface SharedCategory {
  name: string;
  colorKey: CategoryColorKey;
  items: SharedItem[];
}

export interface SharedItem {
  name: string;
  weightGrams: number;
  quantity: number;
  note: string;
  isWorn: boolean;
  isConsumable: boolean;
}

type PayloadItem = [string, number, number, number, string, number];
interface V1Payload {
  n: string;
  u: 'm' | 'i';
  c: string[];
  i: PayloadItem[];
}
interface V2Payload {
  n: string;
  u: 'm' | 'i';
  c: [string, CategoryColorKey][];
  i: PayloadItem[];
}

/** Builds the share link for a gearlist as it is right now. */
export function buildShareUrl(list: GearList, unit: UnitPreference, vaultCategories: Category[]): string {
  const categories: [string, CategoryColorKey][] = [];
  const items: PayloadItem[] = sortByOrder(list.items).map((it) => {
    const category = it.categoryName || UNCATEGORIZED;
    let index = categories.findIndex(([name]) => name === category);
    if (index === -1) {
      const key = categoryColorKey(categoryForName(category, vaultCategories)?.id, vaultCategories);
      index = categories.push([category, key]) - 1;
    }
    const flags = (it.isWorn ? 1 : 0) | (it.isConsumable ? 2 : 0);
    return [it.name, index, it.weightGrams, it.quantity, it.note, flags];
  });
  const payload: V2Payload = { n: list.name, u: unit === 'imperial' ? 'i' : 'm', c: categories, i: items };
  const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}${PREFIX}${CURRENT_VERSION}:${encoded}`;
}

export function isShareHash(hash: string): boolean {
  return hash.startsWith(PREFIX);
}

/** Decodes `#share=…`. Returns null for a broken or unknown link (e.g. cut off when copied). */
export function parseShareHash(hash: string): SharedGearlist | null {
  if (!isShareHash(hash)) return null;
  const body = hash.slice(PREFIX.length);
  const colon = body.indexOf(':');
  if (colon === -1) return null;
  const version = body.slice(0, colon);
  const decoder = DECODERS[version];
  if (!decoder) return null;
  try {
    const json = decompressFromEncodedURIComponent(body.slice(colon + 1));
    if (!json) return null;
    return decoder(JSON.parse(json));
  } catch {
    return null;
  }
}

/** v1 links carry only category names: recognise the default categories by their default
 * name, give other categories the custom colours in order of appearance. */
function colorKeysForNames(names: string[]): CategoryColorKey[] {
  let custom = 0;
  return names.map((name) => {
    if (name === UNCATEGORIZED) return 'none';
    const preset = DEFAULT_CATEGORIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (preset) return preset.id.replace(/^cat-/, '');
    custom += 1;
    return `custom-${((custom - 1) % 4) + 1}`;
  });
}

function decodeItems(
  rawItems: unknown,
  groups: SharedCategory[]
): SharedGearlist['categories'] | null {
  if (!Array.isArray(rawItems)) return null;
  const uncategorized: SharedCategory = { name: UNCATEGORIZED, colorKey: 'none', items: [] };
  for (const row of rawItems) {
    if (!Array.isArray(row)) continue;
    const [name, catIndex, grams, qty, note, flags] = row;
    const item: SharedItem = {
      name: String(name ?? ''),
      weightGrams: Number(grams) || 0,
      quantity: Number(qty) || 1,
      note: String(note ?? ''),
      isWorn: (Number(flags) & 1) === 1,
      isConsumable: (Number(flags) & 2) === 2,
    };
    (groups[Number(catIndex)] ?? uncategorized).items.push(item);
  }
  if (uncategorized.items.length) groups.push(uncategorized);
  return groups.filter((g) => g.items.length > 0);
}

const DECODERS: Record<string, (raw: unknown) => SharedGearlist | null> = {
  v1: (raw) => {
    const p = (raw ?? {}) as Partial<V1Payload>;
    const names = Array.isArray(p.c) ? p.c.map((c) => String(c)) : [];
    const keys = colorKeysForNames(names);
    const categories = decodeItems(
      p.i,
      names.map((name, i) => ({ name, colorKey: keys[i], items: [] }))
    );
    if (!categories) return null;
    return { name: String(p.n ?? 'Shared gearlist'), unitPreference: p.u === 'i' ? 'imperial' : 'metric', categories };
  },
  v2: (raw) => {
    const p = (raw ?? {}) as Partial<V2Payload>;
    const cats = Array.isArray(p.c) ? p.c : [];
    const categories = decodeItems(
      p.i,
      cats.map((c) => {
        const [name, key] = Array.isArray(c) ? c : [c, 'none'];
        return { name: String(name ?? ''), colorKey: isValidColorKey(key) ? key : 'none', items: [] };
      })
    );
    if (!categories) return null;
    return { name: String(p.n ?? 'Shared gearlist'), unitPreference: p.u === 'i' ? 'imperial' : 'metric', categories };
  },
};

/** The shared items in the shape the weight math (computeBreakdown) expects. */
export function sharedItemsAsListItems(shared: SharedGearlist): GearListItem[] {
  return shared.categories.flatMap((g, gi) =>
    g.items.map((it, ii) => ({
      ...it,
      id: `shared-${gi}-${ii}`,
      gearItemId: null,
      categoryName: g.name,
      order: 0,
    }))
  );
}
