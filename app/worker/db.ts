/**
 * D1 storage of one signed-in user's data (PRD v33, FR-24). The rest of the server works with
 * the same AppState shape as the browser; this file maps it to and from the tables in
 * ../migrations. Every statement is scoped by user_id.
 *
 * Saving writes only what changed: the operations layer produces the new state, `saveState`
 * compares it with the state it started from and upserts changed rows / soft-deletes removed
 * ones — a handful of statements per save, each handling many rows via json_each.
 */
import { DEFAULT_CATEGORIES } from '../src/constants';
import { stableStringify } from '../src/core/schema';
import type { AppState, GearList, GearListItem } from '../src/types';

export interface LoadedState {
  state: AppState;
  version: number;
}

export class VersionConflict extends Error {}

const nowIso = () => new Date().toISOString();

export async function loadState(db: D1Database, userId: string): Promise<LoadedState> {
  const [user, categories, gearItems, lists, rows, snapshots] = await db.batch([
    db.prepare('SELECT unit_preference, template_banner_dismissed, data_version FROM users WHERE id = ?').bind(userId),
    db.prepare('SELECT id, name, sort_order FROM categories WHERE user_id = ? AND deleted_at IS NULL ORDER BY sort_order').bind(userId),
    db
      .prepare('SELECT id, name, category_id, weight_grams, default_quantity, note, sort_order FROM gear_items WHERE user_id = ? AND deleted_at IS NULL ORDER BY sort_order')
      .bind(userId),
    db.prepare('SELECT id, kind, name, created_at, sort_order FROM gear_lists WHERE user_id = ? AND deleted_at IS NULL ORDER BY sort_order').bind(userId),
    db
      .prepare(
        'SELECT list_id, id, gear_item_id, name, category_name, weight_grams, quantity, note, is_worn, is_consumable, sort_order FROM gear_list_rows WHERE user_id = ? AND deleted_at IS NULL ORDER BY list_id, sort_order'
      )
      .bind(userId),
    db.prepare('SELECT list_id, saved_at, items_json FROM snapshots WHERE user_id = ? AND deleted_at IS NULL').bind(userId),
  ]);
  const u = user.results[0] as { unit_preference: string; template_banner_dismissed: number; data_version: number } | undefined;
  if (!u) throw new Error('User not found.');

  const rowsByList = new Map<string, GearListItem[]>();
  for (const r of rows.results as Record<string, unknown>[]) {
    const item: GearListItem = {
      id: r.id as string,
      gearItemId: (r.gear_item_id as string | null) ?? null,
      name: r.name as string,
      categoryName: r.category_name as string,
      weightGrams: r.weight_grams as number,
      quantity: r.quantity as number,
      note: r.note as string,
      isWorn: r.is_worn === 1,
      isConsumable: r.is_consumable === 1,
      order: r.sort_order as number,
    };
    const listId = r.list_id as string;
    rowsByList.set(listId, [...(rowsByList.get(listId) ?? []), item]);
  }
  const snapshotByList = new Map<string, GearList['snapshot']>();
  for (const s of snapshots.results as Record<string, unknown>[]) {
    snapshotByList.set(s.list_id as string, { savedAt: s.saved_at as string, items: JSON.parse(s.items_json as string) as GearListItem[] });
  }

  const gearLists: GearList[] = [];
  const templates: GearList[] = [];
  for (const l of lists.results as Record<string, unknown>[]) {
    const id = l.id as string;
    const list: GearList = {
      id,
      name: l.name as string,
      createdAt: l.created_at as string,
      items: rowsByList.get(id) ?? [],
      snapshot: l.kind === 'list' ? (snapshotByList.get(id) ?? null) : null,
      order: l.sort_order as number,
    };
    (l.kind === 'template' ? templates : gearLists).push(list);
  }

  return {
    version: u.data_version,
    state: {
      categories: (categories.results as Record<string, unknown>[]).map((c) => ({ id: c.id as string, name: c.name as string, order: c.sort_order as number })),
      gearItems: (gearItems.results as Record<string, unknown>[]).map((g) => ({
        id: g.id as string,
        name: g.name as string,
        categoryId: (g.category_id as string | null) ?? null,
        weightGrams: g.weight_grams as number,
        defaultQuantity: g.default_quantity as number,
        note: g.note as string,
        order: g.sort_order as number,
      })),
      gearLists,
      templates,
      templateBannerDismissed: u.template_banner_dismissed === 1,
      unitPreference: u.unit_preference === 'imperial' ? 'imperial' : 'metric',
    },
  };
}

/** Writes the difference between `before` (as loaded at `version`) and `after`. Throws
 * VersionConflict if someone else saved in between — nothing is written then. */
export async function saveState(db: D1Database, userId: string, version: number, before: AppState, after: AppState): Promise<number> {
  const now = nowIso();
  const statements: D1PreparedStatement[] = [
    // Guard first: aborts the whole batch (transaction) if data_version moved on.
    db.prepare('INSERT INTO version_guard (user_id, ok) VALUES (?1, (SELECT data_version = ?2 FROM users WHERE id = ?1))').bind(userId, version),
  ];

  const cat = diff(before.categories, after.categories, (c) => c.id);
  if (cat.upsert.length) {
    statements.push(
      db
        .prepare(
          `INSERT INTO categories (user_id, id, name, sort_order, deleted_at)
           SELECT ?1, value->>'id', value->>'name', value->>'order', NULL FROM json_each(?2) WHERE true
           ON CONFLICT (user_id, id) DO UPDATE SET name = excluded.name, sort_order = excluded.sort_order, deleted_at = NULL`
        )
        .bind(userId, JSON.stringify(cat.upsert))
    );
  }
  if (cat.remove.length) statements.push(softDelete(db, 'categories', 'id', userId, cat.remove, now));

  const gear = diff(before.gearItems, after.gearItems, (g) => g.id);
  if (gear.upsert.length) {
    statements.push(
      db
        .prepare(
          `INSERT INTO gear_items (user_id, id, name, category_id, weight_grams, default_quantity, note, sort_order, deleted_at)
           SELECT ?1, value->>'id', value->>'name', value->>'categoryId', value->>'weightGrams', value->>'defaultQuantity', value->>'note', value->>'order', NULL
           FROM json_each(?2) WHERE true
           ON CONFLICT (user_id, id) DO UPDATE SET name = excluded.name, category_id = excluded.category_id, weight_grams = excluded.weight_grams,
             default_quantity = excluded.default_quantity, note = excluded.note, sort_order = excluded.sort_order, deleted_at = NULL`
        )
        .bind(userId, JSON.stringify(gear.upsert))
    );
  }
  if (gear.remove.length) statements.push(softDelete(db, 'gear_items', 'id', userId, gear.remove, now));

  // Lists and the template share a table; a list's rows and snapshot hang off it.
  const listHeader = (l: GearList, kind: 'list' | 'template') => ({ id: l.id, kind, name: l.name, createdAt: l.createdAt, order: l.order });
  const headers = (s: AppState) => [...s.gearLists.map((l) => listHeader(l, 'list')), ...s.templates.map((t) => listHeader(t, 'template'))];
  const lists = diff(headers(before), headers(after), (l) => l.id);
  if (lists.upsert.length) {
    statements.push(
      db
        .prepare(
          `INSERT INTO gear_lists (user_id, id, kind, name, created_at, sort_order, deleted_at)
           SELECT ?1, value->>'id', value->>'kind', value->>'name', value->>'createdAt', value->>'order', NULL FROM json_each(?2) WHERE true
           ON CONFLICT (user_id, id) DO UPDATE SET kind = excluded.kind, name = excluded.name, created_at = excluded.created_at,
             sort_order = excluded.sort_order, deleted_at = NULL`
        )
        .bind(userId, JSON.stringify(lists.upsert))
    );
  }
  // A deleted list keeps its rows and snapshot as they were (hidden with it), so Undo (FR-25)
  // can bring the whole list back.
  if (lists.remove.length) statements.push(softDelete(db, 'gear_lists', 'id', userId, lists.remove, now));

  const allRows = (s: AppState) => [...s.gearLists, ...s.templates].flatMap((l) => l.items.map((i) => ({ ...i, listId: l.id })));
  const rowKey = (r: { listId: string; id: string }) => `${r.listId}\u001f${r.id}`;
  const removedLists = new Set(lists.remove);
  const rows = diff(allRows(before), allRows(after), rowKey);
  const rowsToRemove = rows.remove.filter((key) => !removedLists.has(key.split('\u001f')[0]));
  if (rows.upsert.length) {
    statements.push(
      db
        .prepare(
          `INSERT INTO gear_list_rows (user_id, list_id, id, gear_item_id, name, category_name, weight_grams, quantity, note, is_worn, is_consumable, sort_order, deleted_at)
           SELECT ?1, value->>'listId', value->>'id', value->>'gearItemId', value->>'name', value->>'categoryName', value->>'weightGrams',
             value->>'quantity', value->>'note', value->>'isWorn', value->>'isConsumable', value->>'order', NULL
           FROM json_each(?2) WHERE true
           ON CONFLICT (user_id, list_id, id) DO UPDATE SET gear_item_id = excluded.gear_item_id, name = excluded.name,
             category_name = excluded.category_name, weight_grams = excluded.weight_grams, quantity = excluded.quantity, note = excluded.note,
             is_worn = excluded.is_worn, is_consumable = excluded.is_consumable, sort_order = excluded.sort_order, deleted_at = NULL`
        )
        .bind(userId, JSON.stringify(rows.upsert))
    );
  }
  if (rowsToRemove.length) statements.push(softDelete(db, 'gear_list_rows', "list_id || char(31) || id", userId, rowsToRemove, now));

  const snaps = (s: AppState) => s.gearLists.filter((l) => l.snapshot).map((l) => ({ listId: l.id, savedAt: l.snapshot!.savedAt, items: l.snapshot!.items }));
  const snapshots = diff(snaps(before), snaps(after), (s) => s.listId);
  if (snapshots.upsert.length) {
    statements.push(
      db
        .prepare(
          `INSERT INTO snapshots (user_id, list_id, saved_at, items_json, deleted_at)
           SELECT ?1, value->>'listId', value->>'savedAt', json(value->'items'), NULL FROM json_each(?2) WHERE true
           ON CONFLICT (user_id, list_id) DO UPDATE SET saved_at = excluded.saved_at, items_json = excluded.items_json, deleted_at = NULL`
        )
        .bind(userId, JSON.stringify(snapshots.upsert))
    );
  }
  const snapshotsToRemove = snapshots.remove.filter((listId) => !removedLists.has(listId));
  if (snapshotsToRemove.length) statements.push(softDelete(db, 'snapshots', 'list_id', userId, snapshotsToRemove, now));

  statements.push(
    db
      .prepare('UPDATE users SET data_version = data_version + 1, unit_preference = ?2, template_banner_dismissed = ?3 WHERE id = ?1')
      .bind(userId, after.unitPreference, after.templateBannerDismissed ? 1 : 0),
    db.prepare('DELETE FROM version_guard WHERE user_id = ?').bind(userId)
  );

  try {
    const results = await db.batch(statements);
    // Visible in Cloudflare's logs: how many rows this save wrote (D1 free tier: 100k a day).
    console.log('saved', { rowsWritten: results.reduce((n, r) => n + (r.meta.rows_written ?? 0), 0) });
  } catch (err) {
    if (/CHECK constraint failed/i.test(String(err))) throw new VersionConflict();
    throw err;
  }
  return version + 1;
}

function softDelete(db: D1Database, table: string, keyExpr: string, userId: string, keys: string[], now: string): D1PreparedStatement {
  return db
    .prepare(`UPDATE ${table} SET deleted_at = ?3 WHERE user_id = ?1 AND deleted_at IS NULL AND ${keyExpr} IN (SELECT value FROM json_each(?2))`)
    .bind(userId, JSON.stringify(keys), now);
}

/** Rows to write (new or changed) and keys that disappeared. */
function diff<T>(before: T[], after: T[], key: (x: T) => string): { upsert: T[]; remove: string[] } {
  // Key order doesn't matter (stableStringify), so unchanged rows are never rewritten — D1's
  // free tier counts written rows.
  const old = new Map(before.map((x) => [key(x), stableStringify(x)]));
  const upsert = after.filter((x) => old.get(key(x)) !== stableStringify(x));
  const kept = new Set(after.map(key));
  return { upsert, remove: [...old.keys()].filter((k) => !kept.has(k)) };
}

// ---------------------------------------------------------------------------------------------
// Users and sessions

export interface UserRow {
  id: string;
  email: string;
  name: string;
  picture_url: string | null;
}

/** Finds the user by Google id, or creates them with the default categories (FR-2). */
export async function upsertGoogleUser(
  db: D1Database,
  profile: { sub: string; email: string; name: string; picture: string | null },
  newUserId: string
): Promise<UserRow> {
  const now = nowIso();
  const existing = await db.prepare('SELECT id FROM users WHERE google_sub = ?').bind(profile.sub).first<{ id: string }>();
  if (existing) {
    await db
      .prepare('UPDATE users SET email = ?2, name = ?3, picture_url = ?4, last_login_at = ?5 WHERE id = ?1')
      .bind(existing.id, profile.email, profile.name, profile.picture, now)
      .run();
    return { id: existing.id, email: profile.email, name: profile.name, picture_url: profile.picture };
  }
  await db.batch([
    db
      .prepare('INSERT INTO users (id, google_sub, email, name, picture_url, created_at, last_login_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)')
      .bind(newUserId, profile.sub, profile.email, profile.name, profile.picture, now),
    db
      .prepare(
        `INSERT INTO categories (user_id, id, name, sort_order) SELECT ?1, value->>'id', value->>'name', value->>'order' FROM json_each(?2)`
      )
      .bind(newUserId, JSON.stringify(DEFAULT_CATEGORIES)),
  ]);
  return { id: newUserId, email: profile.email, name: profile.name, picture_url: profile.picture };
}

export async function createSession(db: D1Database, userId: string, tokenHash: string, maxAgeSeconds: number): Promise<void> {
  const now = new Date();
  await db
    .prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(tokenHash, userId, now.toISOString(), new Date(now.getTime() + maxAgeSeconds * 1000).toISOString())
    .run();
}

export async function findSessionUser(db: D1Database, tokenHash: string): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT u.id, u.email, u.name, u.picture_url FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`
    )
    .bind(tokenHash, nowIso())
    .first<UserRow>();
}

export async function deleteSession(db: D1Database, tokenHash: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}
