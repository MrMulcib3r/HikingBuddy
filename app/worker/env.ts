import type { UserRow } from './db';

/** Cloudflare bindings and settings (app/wrangler.jsonc; secrets via `wrangler secret put` /
 * app/.dev.vars — none are needed in step 1). */
export interface Env {
  DB: D1Database;
  /** Workers Rate Limiting binding (FR-24). Optional: falls back to a D1 counter. */
  API_LIMITER?: RateLimit;
  /** Google OAuth client id — public, not a secret (it is in every page that shows the button). */
  GOOGLE_CLIENT_ID: string;
  /** "1" only in app/.dev.vars: enables /auth/dev-login on localhost for automated tests. */
  DEV_LOGIN?: string;
}

export interface AppEnv {
  Bindings: Env;
  Variables: { user: UserRow | null };
}
