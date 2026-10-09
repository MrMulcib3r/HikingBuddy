import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { UNCATEGORIZED } from './types';
import type { GearList, GearListItem, UnitPreference } from './types';
import { sortByOrder } from './utils/reorder';

/**
 * FR-18 — read-only gearlist sharing without a server. The gearlist is compressed into the
 * link itself, after `#` (that part of a URL is never sent to the hosting server):
 *
 *   https://…/#share=v1:<lz-string, URL-safe>
 *
 * The link format has its own version number (CLAUDE.md, data storage rule 7), separate
 * from the app's schemaVersion: every version ever published stays decodable here, so
 * links sent today keep opening after future data-model changes. Never change what `v1`
 * means — add `v2` with its own decoder instead.
 *
 * v1 payload (short keys / arrays to keep the link as short as possible):
 *   { n: gearlist name, u: 'm' | 'i' (sharer's units), c: [category names in display order],
 *     i: [[name, category index, grams per piece, quantity, note, flags]] }  flags: 1 = Worn, 2 = Consumable
 */

const PREFIX = '#share=';
const CURRENT_VERSION = 'v1';

/** What a shared gearlist page shows — a plain, self-contained copy of the gearlist. */
export interface SharedGearlist {
  name: string;
  unitPreference: UnitPreference;
  /** Items grouped by category, in the gearlist's display order. */
  categories: { name: string; items: SharedItem[] }[];
}

export interface SharedItem {
  name: string;
  weightGrams: number;
  quantity: number;
  note: string;
  isWorn: boolean;
  isConsumable: boolean;
}

type V1Item = [string, number, number, number, string, number];
interface V1Payload {
  n: string;
  u: 'm' | 'i';
  c: string[];
  i: V1Item[];
}

/** Builds the share link for a gearlist as it is right now. */
export function buildShareUrl(list: GearList, unit: UnitPreference): string {
  const categories: string[] = [];
  const items: V1Item[] = sortByOrder(list.items).map((it) => {
    const category = it.categoryName || UNCATEGORIZED;
    let index = categories.indexOf(category);
    if (index === -1) index = categories.push(category) - 1;
    const flags = (it.isWorn ? 1 : 0) | (it.isConsumable ? 2 : 0);
    return [it.name, index, it.weightGrams, it.quantity, it.note, flags];
  });
  const payload: V1Payload = { n: list.name, u: unit === 'imperial' ? 'i' : 'm', c: categories, i: items };
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

const DECODERS: Record<string, (raw: unknown) => SharedGearlist | null> = {
  v1: (raw) => {
    const p = (raw ?? {}) as Partial<V1Payload>;
    if (!Array.isArray(p.i)) return null;
    const names = Array.isArray(p.c) ? p.c.map((c) => String(c)) : [];
    const groups = names.map((name) => ({ name, items: [] as SharedItem[] }));
    const uncategorized = { name: UNCATEGORIZED, items: [] as SharedItem[] };
    for (const row of p.i) {
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
    return {
      name: String(p.n ?? 'Shared gearlist'),
      unitPreference: p.u === 'i' ? 'imperial' : 'metric',
      categories: groups.filter((g) => g.items.length > 0),
    };
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
