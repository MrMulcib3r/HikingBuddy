import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import type { UserRow } from './db';

/** Cloudflare bindings and settings (app/wrangler.jsonc; secrets via `wrangler secret put` /
 * app/.dev.vars — none are needed so far). */
export interface Env {
  DB: D1Database;
  /** Workers Rate Limiting binding (FR-24). Optional: falls back to a D1 counter. */
  API_LIMITER?: RateLimit;
  /** FR-26: OAuth clients, grants and tokens of the MCP server (workers-oauth-provider). */
  OAUTH_KV: KVNamespace;
  /** Set by workers-oauth-provider on every request it passes on: the OAuth helpers. */
  OAUTH_PROVIDER: OAuthHelpers;
  /** Google OAuth client id — public, not a secret (it is in every page that shows the button). */
  GOOGLE_CLIENT_ID: string;
  /** "1" only in app/.dev.vars: enables /auth/dev-login on localhost for automated tests. */
  DEV_LOGIN?: string;
}

export interface AppEnv {
  Bindings: Env;
  Variables: { user: UserRow | null };
}

/** What a connected AI client's access token carries (stored by completeAuthorization). */
export interface McpProps {
  userId: string;
  /** The client's name for the Activity panel ("Claude", "ChatGPT"). */
  clientName: string;
}
