import { DEFAULT_CATEGORIES, LEGACY_STORAGE_KEYS, STORAGE_KEY } from './constants';
import { UNCATEGORIZED } from './types';
import type { AppState } from './types';

/**
 * Data migration policy (see PRD-MVP.md section 6): AppState's shape WILL change again as
 * the app grows. Every time it does:
 *   1. Bump CURRENT_SCHEMA_VERSION by 1.
 *   2. Add a migration function to MIGRATIONS, keyed by the version it migrates *from*,
 *      that transforms a payload of that version into the next version's shape.
 *   3. Never rename STORAGE_KEY and never ship a change that makes loadState() fall back
 *      to defaultState() just because the shape moved on — that silently deletes the
 *      user's data (this happened once, 2026-09-22, and must not happen again).
 * loadState() below applies every migration in sequence up to CURRENT_SCHEMA_VERSION, so a
 * user who hasn't opened the app in months still gets their data upgraded correctly.
 */
export const CURRENT_SCHEMA_VERSION = 7;

interface StoredPayload {
  schemaVersion: number;
  state: AppState;
}

type Migration = (state: unknown) => unknown;

/**
 * Schema 1 = the original Draft/Finalized gearlist model (weightType as a 3-way Vault-item
 * property, no snapshots). Schema 2 = the always-editable-gearlist + snapshot model (v7,
 * 2026-09-22) — Worn/Consumable moved to per-gearlist-item flags, Draft/Finalized removed.
 *
 * This migration is what makes it safe for a returning user's old data (or Martin's own
 * browser, which had schema-1 data sitting untouched under the old 'hikingbuddy-state-v1'
 * key while schema 2 shipped) to come back intact instead of silently starting empty:
 * a "Finalized" gearlist becomes a normal, still-editable gearlist whose current contents
 * are also saved as its snapshot — so the "this is what I actually packed" record a
 * Finalized list represented isn't lost, it just also becomes editable from now on.
 */
const migrateV1ToV2: Migration = (raw) => {
  const legacy = (raw ?? {}) as Record<string, any>;
  const categories = (Array.isArray(legacy.categories) ? legacy.categories : DEFAULT_CATEGORIES).map(
    (c: any, i: number) => ({ id: c.id, name: c.name, order: i })
  );
  const gearItems = (Array.isArray(legacy.gearItems) ? legacy.gearItems : []).map((g: any, i: number) => ({
    id: g.id,
    name: g.name,
    categoryId: g.categoryId ?? null,
    weightGrams: g.weightGrams ?? 0,
    defaultQuantity: g.defaultQuantity ?? 1,
    note: g.note ?? '',
    order: i,
  }));
  const gearLists = (Array.isArray(legacy.gearLists) ? legacy.gearLists : []).map((l: any, i: number) => {
    const items = (Array.isArray(l.items) ? l.items : []).map((it: any, j: number) => {
      const effectiveType = it.weightTypeOverride ?? it.weightType ?? 'base';
      return {
        id: it.id,
        gearItemId: it.gearItemId ?? null,
        name: it.name,
        categoryName: it.categoryName ?? UNCATEGORIZED,
        weightGrams: it.weightGrams ?? 0,
        quantity: it.quantity ?? 1,
        note: it.note ?? '',
        isWorn: effectiveType === 'worn',
        isConsumable: effectiveType === 'consumable',
        order: j,
      };
    });
    const snapshot =
      l.status === 'finalized'
        ? { savedAt: l.finalizedAt ?? l.createdAt ?? new Date().toISOString(), items: items.map((it: any) => ({ ...it })) }
        : null;
    return {
      id: l.id,
      name: l.name,
      createdAt: l.createdAt ?? new Date().toISOString(),
      items,
      snapshot,
      order: i,
    };
  });
  return {
    categories: categories.length ? categories : DEFAULT_CATEGORIES,
    gearItems,
    gearLists,
    unitPreference: legacy.unitPreference ?? 'metric',
  };
};

/**
 * Schema 3 = same shape as schema 2; the only change is content. "Backpack" joined the
 * default category template (FR-2) after Martin's first data was created, so data from
 * before that never got it. Adds it once, at the top (its place in the template), unless
 * a category with that name already exists. Runs only once per data set, so if the user
 * later deletes Backpack it stays deleted.
 */
const migrateV2ToV3: Migration = (raw) => {
  const state = (raw ?? {}) as Record<string, any>;
  const categories: any[] = Array.isArray(state.categories) ? state.categories : [];
  const backpack = DEFAULT_CATEGORIES.find((c) => c.id === 'cat-backpack')!;
  const hasBackpack = categories.some(
    (c) => c.id === backpack.id || String(c.name).trim().toLowerCase() === backpack.name.toLowerCase()
  );
  if (hasBackpack || categories.length === 0) return state; // empty → normalizeState fills in defaults
  const sorted = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return {
    ...state,
    categories: [backpack, ...sorted].map((c, i) => ({ ...c, order: i })),
  };
};

/**
 * Schema 4 = same shape as schema 3; content only. The default "Shelter" category was
 * renamed to "Shelter System" (BACKLOG CR, 2026-09-24; done 2026-10-08) to match "Sleep
 * System". Existing data gets the same rename once — exactly what renaming it by hand would
 * do: the category's name changes, and live gearlist rows linked to Vault items in that
 * category show the new name. Unlinked custom rows and snapshots are left untouched
 * (snapshots are a frozen record and must never change). Skipped if the user has no
 * Shelter category or already has a "Shelter System" one. Runs once, so a later manual
 * rename back to "Shelter" sticks.
 */
const migrateV3ToV4: Migration = (raw) => {
  const state = (raw ?? {}) as Record<string, any>;
  const categories: any[] = Array.isArray(state.categories) ? state.categories : [];
  const NEW_NAME = 'Shelter System';
  const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
  if (categories.some((c) => norm(c?.name) === norm(NEW_NAME))) return state;
  const shelter =
    categories.find((c) => c?.id === 'cat-shelter' && norm(c?.name) === 'shelter') ??
    categories.find((c) => norm(c?.name) === 'shelter');
  if (!shelter) return state;

  const gearItems: any[] = Array.isArray(state.gearItems) ? state.gearItems : [];
  const shelterItemIds = new Set(gearItems.filter((g) => g?.categoryId === shelter.id).map((g) => g.id));
  const gearLists: any[] = Array.isArray(state.gearLists) ? state.gearLists : [];
  return {
    ...state,
    categories: categories.map((c) => (c === shelter ? { ...c, name: NEW_NAME } : c)),
    gearLists: gearLists.map((l) => ({
      ...l,
      items: (Array.isArray(l?.items) ? l.items : []).map((it: any) =>
        it?.gearItemId && shelterItemIds.has(it.gearItemId) ? { ...it, categoryName: NEW_NAME } : it
      ),
    })),
  };
};

/**
 * Schema 5 = Gearlist Template (PRD section 7, point 5). New fields `templates` (list of
 * templates, gearlist-shaped) and `templateBannerDismissed`. Existing data simply gets
 * "no template yet" and the banner not dismissed — nothing else changes.
 */
const migrateV4ToV5: Migration = (raw) => {
  const state = (raw ?? {}) as Record<string, any>;
  return {
    ...state,
    templates: Array.isArray(state.templates) ? state.templates : [],
    templateBannerDismissed: state.templateBannerDismissed === true,
  };
};

/**
 * Schema 6 = same shape as schema 5; content only. The category "Worn clothing" is renamed to
 * "Clothing" (BACKLOG 2026-10-14, Martin: "Worn" is a flag on a gearlist row, not a kind of
 * clothing). Same one-time rename as migrateV3ToV4: the category's name changes and live
 * gearlist/template rows linked to Vault items in it show the new name; unlinked custom rows
 * and snapshots stay as they are. Skipped when there is no such category or a "Clothing" one
 * already exists. Runs once, so a later manual rename sticks.
 */
const migrateV5ToV6: Migration = (raw) => {
  const state = (raw ?? {}) as Record<string, any>;
  const categories: any[] = Array.isArray(state.categories) ? state.categories : [];
  const OLD_NAME = 'worn clothing';
  const NEW_NAME = 'Clothing';
  const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
  if (categories.some((c) => norm(c?.name) === norm(NEW_NAME))) return state;
  const worn = categories.find((c) => norm(c?.name) === OLD_NAME);
  if (!worn) return state;

  const gearItems: any[] = Array.isArray(state.gearItems) ? state.gearItems : [];
  const itemIds = new Set(gearItems.filter((g) => g?.categoryId === worn.id).map((g) => g.id));
  const renameRows = (l: any) => ({
    ...l,
    items: (Array.isArray(l?.items) ? l.items : []).map((it: any) =>
      it?.gearItemId && itemIds.has(it.gearItemId) ? { ...it, categoryName: NEW_NAME } : it
    ),
  });
  return {
    ...state,
    categories: categories.map((c) => (c === worn ? { ...c, name: NEW_NAME } : c)),
    gearLists: (Array.isArray(state.gearLists) ? state.gearLists : []).map(renameRows),
    templates: (Array.isArray(state.templates) ? state.templates : []).map(renameRows),
  };
};

/**
 * Schema 7 = same shape; content only. The category "Consumables" is renamed to "Food"
 * (Martin, 2026-10-14: Consumable is a flag on a gearlist row, not a category). Same one-time
 * rename as migrateV5ToV6; skipped when "Food" already exists.
 */
const migrateV6ToV7: Migration = (raw) => {
  const state = (raw ?? {}) as Record<string, any>;
  const categories: any[] = Array.isArray(state.categories) ? state.categories : [];
  const NEW_NAME = 'Food';
  const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
  if (categories.some((c) => norm(c?.name) === norm(NEW_NAME))) return state;
  const old = categories.find((c) => norm(c?.name) === 'consumables');
  if (!old) return state;
  const gearItems: any[] = Array.isArray(state.gearItems) ? state.gearItems : [];
  const itemIds = new Set(gearItems.filter((g) => g?.categoryId === old.id).map((g) => g.id));
  const renameRows = (l: any) => ({
    ...l,
    items: (Array.isArray(l?.items) ? l.items : []).map((it: any) =>
      it?.gearItemId && itemIds.has(it.gearItemId) ? { ...it, categoryName: NEW_NAME } : it
    ),
  });
  return {
    ...state,
    categories: categories.map((c) => (c === old ? { ...c, name: NEW_NAME } : c)),
    gearLists: (Array.isArray(state.gearLists) ? state.gearLists : []).map(renameRows),
    templates: (Array.isArray(state.templates) ? state.templates : []).map(renameRows),
  };
};

const MIGRATIONS: Record<number, Migration> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
  4: migrateV4ToV5,
  5: migrateV5ToV6,
  6: migrateV6ToV7,
};

function runMigrations(state: unknown, fromVersion: number): AppState {
  let current = state;
  for (let v = fromVersion; v < CURRENT_SCHEMA_VERSION; v++) {
    const migrate = MIGRATIONS[v];
    if (!migrate) break; // no migration registered — treat as already current
    current = migrate(current);
  }
  return normalizeState(current);
}

/** Fills in any missing fields with safe defaults — belt-and-braces for hand-edited or
 * partially-migrated data, so a small gap never triggers a full reset to empty. */
function normalizeState(raw: unknown): AppState {
  const s = (raw ?? {}) as Partial<AppState>;
  return {
    categories: s.categories ?? DEFAULT_CATEGORIES,
    gearItems: s.gearItems ?? [],
    gearLists: s.gearLists ?? [],
    templates: Array.isArray(s.templates) ? s.templates : [],
    templateBannerDismissed: s.templateBannerDismissed === true,
    unitPreference: s.unitPreference ?? 'metric',
  };
}

function defaultState(): AppState {
  return {
    categories: DEFAULT_CATEGORIES,
    gearItems: [],
    gearLists: [],
    templates: [],
    templateBannerDismissed: false,
    unitPreference: 'metric',
  };
}

/**
 * MVP zatím nemá účet ani server (viz PRD sekce 2) — appka data ukládá jen do prohlížeče
 * (localStorage). To má jedno důležité omezení, které Martin správně pojmenoval: pokud si
 * uživatel v prohlížeči smaže data stránek ("clear browsing data"), localStorage zmizí
 * nenávratně spolu s ním — appka samotná to nemůže ovlivnit, protože jde o funkci
 * prohlížeče, ne appky. Proto appka navíc nabízí Export/Import zálohy do skutečného
 * souboru (viz BackupControls.tsx) — to je jediný způsob, jak mít v MVP (bez serveru) data
 * nezávislá na tom, že v prohlížeči zůstanou. Přechod na skutečnou databázi na serveru je
 * zdokumentovaný jako budoucí fáze v PRD sekci 7.
 */
/** True when a state has no user-entered content at all (no gear, no gearlists) — i.e. it
 * is indistinguishable from a just-created defaultState(). Categories don't count: the
 * default template categories are always present even in a genuinely empty vault. */
export function isEmptyState(state: AppState): boolean {
  return state.gearItems.length === 0 && state.gearLists.length === 0;
}

/** Reads and migrates whichever legacy key (if any) holds real data. Returns null if none
 * of the legacy keys exist or none of them contain anything. */
function recoverFromLegacyKeys(): AppState | null {
  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    const legacyRaw = window.localStorage.getItem(legacyKey);
    if (!legacyRaw) continue;
    // hikingbuddy-state-v2 was already schema 2 (just not wrapped with a version yet);
    // hikingbuddy-state-v1 was schema 1 (the Draft/Finalized model).
    const fromVersion = legacyKey.endsWith('-v1') ? 1 : 2;
    const state = runMigrations(JSON.parse(legacyRaw), fromVersion);
    if (!isEmptyState(state)) return state;
  }
  return null;
}

export function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const payload = JSON.parse(raw) as Partial<StoredPayload>;
      const version = typeof payload.schemaVersion === 'number' ? payload.schemaVersion : CURRENT_SCHEMA_VERSION;
      const state = runMigrations(payload.state ?? payload, version);

      // Guard against the exact failure Martin hit on 2026-09-24: the app's own first
      // render after the v7 key rename wrote an empty default payload under STORAGE_KEY
      // (via the normal auto-save effect) *before* anyone had a chance to recover the old
      // data — so this key existing and being empty does NOT mean the user's data is
      // gone, it can just mean nobody has looked at the legacy keys yet. Whenever the
      // current key's data is empty, check the legacy keys for real content before
      // accepting "empty" as the answer.
      if (isEmptyState(state)) {
        const recovered = recoverFromLegacyKeys();
        if (recovered) {
          saveState(recovered);
          return recovered;
        }
      }

      if (version < CURRENT_SCHEMA_VERSION) saveState(state); // persist the upgraded shape right away
      return state;
    }

    // Nothing under the current key yet — check older keys before giving up, so a schema
    // change (or the key rename that happened once in the past) never looks like data loss.
    const recovered = recoverFromLegacyKeys();
    if (recovered) {
      saveState(recovered);
      return recovered;
    }

    return defaultState();
  } catch (err) {
    console.error('Nepodařilo se načíst uložená data, startuji s prázdným stavem.', err);
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  try {
    const payload: StoredPayload = { schemaVersion: CURRENT_SCHEMA_VERSION, state };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Nepodařilo se uložit data do prohlížeče.', err);
  }
}

export interface BackupFile {
  app: 'hikingbuddy';
  schemaVersion: number;
  exportedAt: string;
  state: AppState;
}

export function buildBackup(state: AppState): BackupFile {
  return { app: 'hikingbuddy', schemaVersion: CURRENT_SCHEMA_VERSION, exportedAt: new Date().toISOString(), state };
}

/** JSON with object keys sorted, so two states with the same content always produce the same
 * text no matter in which order their fields were created. Used to compare the app's data
 * with the data file's (FR-16) — never for storing. */
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v
  );
}

/** Short fingerprint of a state's content (cyrb53 hash of its stable JSON). The data file
 * (FR-16) remembers the fingerprint of what was last saved to / loaded from the file, so it
 * can tell later whether the browser's copy or the file changed since. */
export function stateFingerprint(state: AppState): string {
  const text = stableStringify(state);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)}:${text.length}`;
}

/** Parses an imported backup file's text, migrating it forward if it's from an older
 * version of the app, and normalizing it either way. Throws a plain-language Error if the
 * file doesn't look like a HikingBuddy backup at all. */
export function parseBackup(text: string): AppState {
  const parsed = JSON.parse(text);
  // Accept either a proper {app, schemaVersion, state} backup file, or a raw AppState-like
  // object (e.g. someone copy-pasted localStorage contents) — be lenient on import, since
  // the whole point of this feature is to not lose data over a formatting technicality.
  const looksLikeBackup = parsed && typeof parsed === 'object' && ('state' in parsed || 'gearItems' in parsed);
  if (!looksLikeBackup) {
    throw new Error('This file does not look like a HikingBuddy backup.');
  }
  const version = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : CURRENT_SCHEMA_VERSION;
  const rawState = 'state' in parsed ? parsed.state : parsed;
  return runMigrations(rawState, version);
}
