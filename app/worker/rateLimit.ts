import type { Env } from './env';

/** FR-24: 60 requests a minute per user (or per IP for guests). */
export const REQUESTS_PER_MINUTE = 60;

/** True if the request may go on. Uses the Workers Rate Limiting binding (configured in
 * wrangler.jsonc); without it, a per-minute counter in D1 (one small write per request). */
export async function rateLimit(env: Env, key: string): Promise<boolean> {
  if (env.API_LIMITER) {
    const { success } = await env.API_LIMITER.limit({ key });
    return success;
  }
  const window = Math.floor(Date.now() / 60_000);
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
     ON CONFLICT (key) DO UPDATE SET count = CASE WHEN window_start = ?2 THEN count + 1 ELSE 1 END, window_start = ?2
     RETURNING count`
  )
    .bind(key, window)
    .first<{ count: number }>();
  return (row?.count ?? 0) <= REQUESTS_PER_MINUTE;
}
