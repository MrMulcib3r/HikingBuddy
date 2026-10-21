/**
 * HikingBuddy server (PRD v33, FR-23/FR-24): the same Cloudflare Worker that serves the static
 * app also answers /api (data of the signed-in user) and /auth (Google sign-in). Everything else
 * — the app itself and shared gearlist links (#share=…, FR-18) — is served as static files
 * before this code runs (wrangler.jsonc: assets.run_worker_first).
 */
import { Hono, type Context } from 'hono';
import type { Operation } from '../src/core/operations';
import {
  compareEntries,
  diffStates,
  entryFromGroup,
  entryUndoneAt,
  importEntry,
  laterChangesFor,
  recordOperations,
  setUndone,
  undoChanges,
  type Actor,
  type HistoryEntry,
  type RichPart,
  type UndoTarget,
} from '../src/core/history';
import { importIntoAccount } from '../src/core/importState';
import { CURRENT_SCHEMA_VERSION, isEmptyState, runMigrations } from '../src/core/schema';
import { insertEntryStatement, loadHistory, loadState, purgeOld, saveState, updateEntryStatement, upsertGoogleUser, VersionConflict } from './db';
import { endSession, sessionUser, startSession, verifyGoogleCredential } from './auth';
import { appStateSchema, importRequestSchema, opsRequestSchema, undoRequestSchema } from './schemas';
import { rateLimit } from './rateLimit';
import type { AppEnv, Env } from './env';
import type { AppState } from '../src/types';

const app = new Hono<AppEnv>();

type ErrorCode = 'unauthorized' | 'forbidden' | 'invalid' | 'rate_limited' | 'daily_limit' | 'app_outdated' | 'not_set_up' | 'server_error';

function fail(c: Context<AppEnv>, status: 400 | 401 | 403 | 409 | 429 | 500 | 503, error: ErrorCode, message: string) {
  return c.json({ error, message }, status);
}

/** D1 on the free plan fails every query after the daily row limit until 00:00 UTC (PRD 4a). */
function isDailyLimitError(err: unknown): boolean {
  const text = String(err);
  return /exceeded/i.test(text) && /(daily|free tier|limit)/i.test(text);
}

app.onError((err, c) => {
  if (isDailyLimitError(err)) return fail(c, 503, 'daily_limit', "HikingBuddy reached today's free limit, try again tomorrow.");
  console.error(err);
  return fail(c, 500, 'server_error', 'Something went wrong on the server. Your changes are kept in this browser.');
});

// Who is asking (cookie session), then the rate limit (per user, or per IP for guests).
app.use('/api/*', async (c, next) => {
  c.set('user', await sessionUser(c));
  return next();
});
app.use('/auth/*', async (c, next) => {
  c.set('user', null);
  return next();
});
app.use('*', async (c, next) => {
  const user = c.get('user');
  // Local automated tests run many browsers from one address; there each test browser may name
  // its own "address" (only with DEV_LOGIN on localhost — never in production).
  const testKey = isLocalDev(c) ? c.req.header('x-test-client') : undefined;
  const key = user ? `user:${user.id}` : `ip:${testKey ?? c.req.header('cf-connecting-ip') ?? 'local'}`;
  if (!(await rateLimit(c.env, key))) return fail(c, 429, 'rate_limited', 'Too many requests. Wait a minute and try again.');
  return next();
});
// Changes must come from our own page: a custom header can't be sent cross-site without CORS,
// which we never allow (CSRF protection on top of the SameSite cookie).
app.use('*', async (c, next) => {
  if (c.req.method !== 'GET' && c.req.header('x-hikingbuddy') !== '1') return fail(c, 403, 'forbidden', 'Missing request header.');
  return next();
});

// ---------------------------------------------------------------------------------------------
// /auth

app.get('/auth/config', (c) => c.json({ googleClientId: c.env.GOOGLE_CLIENT_ID || null }));

app.post('/auth/google', async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID) return fail(c, 503, 'not_set_up', "Sign-in isn't set up yet.");
  const body = await c.req.json<{ credential?: unknown }>().catch(() => ({}) as { credential?: unknown });
  if (typeof body.credential !== 'string') return fail(c, 400, 'invalid', 'Missing Google credential.');
  let profile;
  try {
    profile = await verifyGoogleCredential(body.credential, c.env.GOOGLE_CLIENT_ID);
  } catch {
    return fail(c, 401, 'unauthorized', 'Google sign-in could not be verified. Please try again.');
  }
  const user = await upsertGoogleUser(c.env.DB, profile, crypto.randomUUID());
  await startSession(c, user.id);
  return c.json({ user: publicUser(user) });
});

/** Local automated tests only: signs in a fake account without Google. Works only when
 * app/.dev.vars sets DEV_LOGIN=1 AND the request is to localhost — never in production. */
app.post('/auth/dev-login', async (c) => {
  if (!isLocalDev(c)) return c.notFound();
  const body = await c.req.json<{ sub: string; name: string; email: string }>();
  const user = await upsertGoogleUser(c.env.DB, { sub: `dev-${body.sub}`, name: body.name, email: body.email, picture: null }, crypto.randomUUID());
  await startSession(c, user.id);
  return c.json({ user: publicUser(user) });
});

/** Local automated tests only: runs the daily cleanup as if it were `now`. */
app.post('/auth/dev-purge', async (c) => {
  if (!isLocalDev(c)) return c.notFound();
  const body = await c.req.json<{ now?: string }>().catch(() => ({}) as { now?: string });
  await purgeOld(c.env.DB, body.now ? new Date(body.now) : new Date());
  return c.json({ ok: true });
});

app.post('/auth/logout', async (c) => {
  await endSession(c);
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------------------------
// /api — always the signed-in user's own data, nothing else.

app.get('/api/me', (c) => {
  const user = c.get('user');
  return c.json({ user: user ? publicUser(user) : null });
});

app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/me') return next();
  if (!c.get('user')) return fail(c, 401, 'unauthorized', 'You are signed out. Sign in again to save your changes.');
  return next();
});

app.get('/api/state', async (c) => {
  const { state, version } = await loadState(c.env.DB, c.get('user')!.id);
  return c.json({ schemaVersion: CURRENT_SCHEMA_VERSION, version, state });
});

/** Applies the browser's queued changes through the operations layer and saves them. Answers
 * with the account's whole state, so the browser always ends up with exactly what is stored. */
app.post('/api/ops', async (c) => {
  const parsed = opsRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return fail(c, 400, 'invalid', 'The change could not be read.');
  if (parsed.data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return fail(c, 409, 'app_outdated', 'HikingBuddy was updated. Reload the page — your changes are kept.');
  }
  const userId = c.get('user')!.id;
  const ops = parsed.data.ops as Operation[];
  const who = actorOf(c);
  return c.json(
    await saveWithRetry(c.env.DB, userId, (state) => {
      // FR-25: every change is recorded; ops of one web action (same action id) are one entry.
      const recorded = recordOperations(state, ops, parsed.data.actions);
      const base = Date.now();
      const entries = recorded.groups.map((group, i) =>
        entryFromGroup(group, { id: crypto.randomUUID(), at: new Date(base + i).toISOString(), ...who })
      );
      return { state: recorded.state, rejected: recorded.rejected, entries };
    })
  );
});

/** FR-23 import (also Import backup and demo data while signed in). */
app.post('/api/import', async (c) => {
  const parsed = importRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return fail(c, 400, 'invalid', 'The data could not be read.');
  const local = appStateSchema.safeParse(runMigrations(parsed.data.state, parsed.data.schemaVersion));
  if (!local.success) return fail(c, 400, 'invalid', 'This data does not look like HikingBuddy data, or it is too large.');
  const mode = parsed.data.mode;
  const userId = c.get('user')!.id;
  const who = actorOf(c);
  let refused = false;
  const result = await saveWithRetry(c.env.DB, userId, (account) => {
    // "Replace" is only ever allowed into an empty account — never a silent overwrite.
    if (mode === 'replace_empty' && !isEmptyState(account)) {
      refused = true;
      return { state: account, rejected: [] };
    }
    const state = importIntoAccount(account, local.data as AppState, (prefix) => `${prefix}-${crypto.randomUUID()}`);
    // FR-25 (PRD v35 B): the whole import is one entry with Undo.
    const entry = importEntry(account, state, { id: crypto.randomUUID(), at: new Date().toISOString(), ...who });
    return { state, rejected: [], entries: entry ? [entry] : [] };
  });
  if (refused) return fail(c, 409, 'invalid', 'Your account already has data. Import it as new items and gearlists instead.');
  return c.json(result);
});

// ---------------------------------------------------------------------------------------------
// FR-25: Activity and Undo

/** The last 30 days, newest first, without the before/after values (only what the panel shows). */
app.get('/api/activity', async (c) => {
  const entries = (await loadHistory(c.env.DB, c.get('user')!.id)).reverse();
  return c.json({
    entries: entries.map((e) => ({
      id: e.id,
      at: e.at,
      actor: e.actor,
      client: e.client,
      kind: e.kind,
      text: e.text,
      undoable: e.undoable,
      undoneAt: entryUndoneAt(e),
      changes: e.changes.map((ch) => ({ text: ch.text, icon: ch.icon, deleted: ch.deleted ?? false, undoneAt: ch.undoneAt ?? null })),
    })),
  });
});

/**
 * Undo of one change, one entry (an AI step or one of your own edits), or all AI changes of a
 * day. mode "check" only reports what would happen (count, conflicts); "auto" undoes right away
 * unless there is a conflict; "all" overwrites later changes; "keep_later" skips them.
 */
app.post('/api/undo', async (c) => {
  const parsed = undoRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return fail(c, 400, 'invalid', 'The request could not be read.');
  const { target, mode } = parsed.data;
  const db = c.env.DB;
  const userId = c.get('user')!.id;
  const who = actorOf(c);

  for (let attempt = 0; ; attempt++) {
    const [loaded, history] = await Promise.all([loadState(db, userId), loadHistory(db, userId)]);
    const byId = new Map(history.map((e) => [e.id, e]));

    // Which changes to undo (already undone ones are not counted again).
    let picked: { entry: HistoryEntry; index: number }[];
    if ('entryId' in target) {
      const entry = byId.get(target.entryId);
      if (!entry) return fail(c, 400, 'invalid', 'This change is older than 30 days and can no longer be undone.');
      if (!entry.undoable) return fail(c, 400, 'invalid', 'This change is too large to undo.');
      const indices = target.change !== undefined ? [target.change] : entry.changes.map((_, i) => i);
      picked = indices.filter((i) => entry.changes[i] && !entry.changes[i].undoneAt).map((index) => ({ entry, index }));
    } else {
      picked = history
        .filter((e) => e.actor === 'ai' && e.undoable && e.kind === 'change' && e.at >= target.day.from && e.at < target.day.to)
        .flatMap((entry) => entry.changes.map((ch, index) => ({ entry, index, ch })).filter((x) => !x.ch.undoneAt));
    }
    if (picked.length === 0) return fail(c, 409, 'invalid', 'This was already undone.');

    const targets = picked.map(({ entry, index }) => ({ target: { entryId: entry.id, change: index } as UndoTarget, change: entry.changes[index] }));
    const result = undoChanges(loaded.state, targets, mode === 'keep_later' ? 'keep_later' : 'all');

    // Conflicts, as the later changes they would overwrite (design system: "Undo would overwrite 1 later change:").
    const first = picked[0];
    const exclude = new Set(picked.map(({ entry, index }) => `${entry.id}#${index}`));
    const isLater = (entry: HistoryEntry, index: number) => {
      const order = compareEntries(entry, first.entry);
      return order > 0 || (order === 0 && index > first.index);
    };
    const conflicts: { actor: Actor; client: string | null; at: string; text: RichPart[] }[] = laterChangesFor(history, isLater, result.conflicts, exclude).map(
      ({ entry, change }) => ({ actor: entry.actor, client: entry.client, at: entry.at, text: change.text })
    );
    // A conflict whose later change isn't in the history (older than 30 days): name the thing.
    if (result.conflicts.length > 0 && conflicts.length === 0) {
      for (const name of new Set(result.conflicts.map((x) => x.name))) conflicts.push({ actor: 'you', client: null, at: '', text: [{ b: name }, ' was changed later'] });
    }

    if (mode === 'check' || (mode === 'auto' && conflicts.length > 0)) {
      const byClient = new Map<string, number>();
      for (const { entry } of picked) {
        const name = entry.client ?? 'You';
        byClient.set(name, (byClient.get(name) ?? 0) + 1);
      }
      return c.json({
        applied: false,
        count: picked.length,
        conflicting: conflicts.length > 0 ? Math.max(1, result.conflicting) : 0,
        byClient: [...byClient].map(([client, count]) => ({ client, count })),
        conflicts,
      });
    }

    // The Undo is itself an entry, with its own Undo (= redo).
    const undone = 'entryId' in target ? byId.get(target.entryId)! : null;
    const at = new Date().toISOString();
    const text = undoText(target, first.entry, result.applied.length);
    const undoEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      at,
      ...who,
      kind: undone?.kind === 'undo' ? 'redo' : 'undo',
      text,
      changes: [{ text, icon: 'undo', diffs: diffStates(loaded.state, result.state) }],
      undoes: result.applied,
      undoable: true,
    };
    const touched = new Set<string>();
    for (const t of result.applied) setUndone(byId, t, true, undoEntry.id, at, touched);
    const statements = [insertEntryStatement(db, userId, undoEntry), ...[...touched].map((entryId) => updateEntryStatement(db, userId, byId.get(entryId)!))];
    try {
      const version = await saveState(db, userId, loaded.version, loaded.state, result.state, statements);
      return c.json({ applied: true, schemaVersion: CURRENT_SCHEMA_VERSION, version, state: result.state, rejected: [] });
    } catch (err) {
      if (err instanceof VersionConflict && attempt < 3) continue;
      throw err;
    }
  }
});

/** "Undid Claude's change from 14:02" · "Redid your change from 14:02" · "Undid 41 AI changes from Tue 21 Oct". */
function undoText(target: { entryId: string } | { day: { from: string } }, entry: HistoryEntry, count: number): RichPart[] {
  if ('day' in target) return ['Undid ', `${count === 1 ? '1 AI change' : `${count} AI changes`} from `, { date: target.day.from }];
  // Undoing an Undo: the same sentence with "Redid" (and back to "Undid" when undoing a redo).
  if (entry.kind === 'undo' || entry.kind === 'redo') {
    const [verb, ...rest] = entry.text;
    return [verb === 'Undid ' ? 'Redid ' : 'Undid ', ...rest];
  }
  const whose = entry.actor === 'ai' ? `${entry.client ?? 'AI'}'s` : 'your';
  return ['Undid ', `${whose} ${entry.kind === 'import' ? 'import' : 'change'} from `, { time: entry.at }];
}

/** Who made the change (FR-25): on the web always the user ("You"). The MCP server (step 3)
 * records the AI client. Local automated tests may act as an AI client (DEV_LOGIN only). */
function actorOf(c: Context<AppEnv>): { actor: Actor; client: string | null } {
  const testClient = isLocalDev(c) ? c.req.header('x-test-actor') : undefined;
  return testClient ? { actor: 'ai', client: testClient.slice(0, 60) } : { actor: 'you', client: null };
}

async function saveWithRetry(
  db: D1Database,
  userId: string,
  change: (state: AppState) => { state: AppState; rejected: { index: number; error: Error }[]; entries?: HistoryEntry[] }
) {
  for (let attempt = 0; ; attempt++) {
    const loaded = await loadState(db, userId);
    const { state, rejected, entries = [] } = change(loaded.state);
    const rejectedOut = rejected.map((r) => ({ index: r.index, message: r.error.message }));
    if (state === loaded.state && entries.length === 0) return { schemaVersion: CURRENT_SCHEMA_VERSION, version: loaded.version, state, rejected: rejectedOut };
    try {
      // The history entries are written in the same transaction as the change (FR-25).
      const version = await saveState(db, userId, loaded.version, loaded.state, state, entries.map((e) => insertEntryStatement(db, userId, e)));
      return { schemaVersion: CURRENT_SCHEMA_VERSION, version, state, rejected: rejectedOut };
    } catch (err) {
      // Another device saved in between: start over from its result (ops are intents, so they
      // re-apply cleanly on top).
      if (err instanceof VersionConflict && attempt < 3) continue;
      throw err;
    }
  }
}

/** app/.dev.vars sets DEV_LOGIN=1 and the request goes to localhost: local development only. */
function isLocalDev(c: Context<AppEnv>): boolean {
  return c.env.DEV_LOGIN === '1' && ['localhost', '127.0.0.1'].includes(new URL(c.req.url).hostname);
}

function publicUser(u: { id: string; email: string; name: string; picture_url: string | null }) {
  return { id: u.id, email: u.email, name: u.name, picture: u.picture_url };
}

app.all('/api/*', (c) => fail(c, 400, 'invalid', 'Unknown address.'));
app.all('/auth/*', (c) => fail(c, 400, 'invalid', 'Unknown address.'));

export default {
  fetch: app.fetch,
  // FR-25: daily cleanup of history and soft-deleted things older than 30 days (wrangler.jsonc triggers).
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(purgeOld(env.DB));
  },
} satisfies ExportedHandler<Env>;
