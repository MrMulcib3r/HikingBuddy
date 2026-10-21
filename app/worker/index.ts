/**
 * HikingBuddy server (PRD v33, FR-23/FR-24): the same Cloudflare Worker that serves the static
 * app also answers /api (data of the signed-in user) and /auth (Google sign-in). Everything else
 * — the app itself and shared gearlist links (#share=…, FR-18) — is served as static files
 * before this code runs (wrangler.jsonc: assets.run_worker_first).
 */
import { Hono, type Context } from 'hono';
import { applyOperations, type Operation } from '../src/core/operations';
import { importIntoAccount } from '../src/core/importState';
import { CURRENT_SCHEMA_VERSION, isEmptyState, runMigrations } from '../src/core/schema';
import { loadState, saveState, upsertGoogleUser, VersionConflict } from './db';
import { endSession, sessionUser, startSession, verifyGoogleCredential } from './auth';
import { appStateSchema, importRequestSchema, opsRequestSchema } from './schemas';
import { rateLimit } from './rateLimit';
import type { AppEnv } from './env';
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
  const key = user ? `user:${user.id}` : `ip:${c.req.header('cf-connecting-ip') ?? 'local'}`;
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
  const host = new URL(c.req.url).hostname;
  if (c.env.DEV_LOGIN !== '1' || !['localhost', '127.0.0.1'].includes(host)) return c.notFound();
  const body = await c.req.json<{ sub: string; name: string; email: string }>();
  const user = await upsertGoogleUser(c.env.DB, { sub: `dev-${body.sub}`, name: body.name, email: body.email, picture: null }, crypto.randomUUID());
  await startSession(c, user.id);
  return c.json({ user: publicUser(user) });
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
  return c.json(await saveWithRetry(c.env.DB, userId, (state) => applyOperations(state, ops)));
});

/** FR-23 import (also Import backup and demo data while signed in). */
app.post('/api/import', async (c) => {
  const parsed = importRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return fail(c, 400, 'invalid', 'The data could not be read.');
  const local = appStateSchema.safeParse(runMigrations(parsed.data.state, parsed.data.schemaVersion));
  if (!local.success) return fail(c, 400, 'invalid', 'This data does not look like HikingBuddy data, or it is too large.');
  const mode = parsed.data.mode;
  const userId = c.get('user')!.id;
  let refused = false;
  const result = await saveWithRetry(c.env.DB, userId, (account) => {
    // "Replace" is only ever allowed into an empty account — never a silent overwrite.
    if (mode === 'replace_empty' && !isEmptyState(account)) {
      refused = true;
      return { state: account, rejected: [] };
    }
    return { state: importIntoAccount(account, local.data as AppState, (prefix) => `${prefix}-${crypto.randomUUID()}`), rejected: [] };
  });
  if (refused) return fail(c, 409, 'invalid', 'Your account already has data. Import it as new items and gearlists instead.');
  return c.json(result);
});

async function saveWithRetry(
  db: D1Database,
  userId: string,
  change: (state: AppState) => { state: AppState; rejected: { index: number; error: Error }[] }
) {
  for (let attempt = 0; ; attempt++) {
    const loaded = await loadState(db, userId);
    const { state, rejected } = change(loaded.state);
    const rejectedOut = rejected.map((r) => ({ index: r.index, message: r.error.message }));
    if (state === loaded.state) return { schemaVersion: CURRENT_SCHEMA_VERSION, version: loaded.version, state, rejected: rejectedOut };
    try {
      const version = await saveState(db, userId, loaded.version, loaded.state, state);
      return { schemaVersion: CURRENT_SCHEMA_VERSION, version, state, rejected: rejectedOut };
    } catch (err) {
      // Another device saved in between: start over from its result (ops are intents, so they
      // re-apply cleanly on top).
      if (err instanceof VersionConflict && attempt < 3) continue;
      throw err;
    }
  }
}

function publicUser(u: { id: string; email: string; name: string; picture_url: string | null }) {
  return { id: u.id, email: u.email, name: u.name, picture: u.picture_url };
}

app.all('/api/*', (c) => fail(c, 400, 'invalid', 'Unknown address.'));
app.all('/auth/*', (c) => fail(c, 400, 'invalid', 'Unknown address.'));

export default app;
