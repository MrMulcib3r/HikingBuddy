/**
 * Talking to our own server (/api, /auth — app/worker). Every failure becomes an ApiError with
 * a `kind` the UI can explain in plain words (FR-24: network errors and D1's daily limit must
 * be clear, and unsaved changes are never lost — the caller keeps them).
 */
export type ApiErrorKind =
  | 'offline' // no connection
  | 'daily_limit' // D1 / Workers free-tier limit for today
  | 'rate_limited' // too many requests this minute
  | 'unauthorized' // session expired / signed out elsewhere
  | 'app_outdated' // the server runs a newer data version: reload
  | 'invalid' // the server refused the request
  | 'not_set_up' // sign-in not configured yet
  | 'server'; // anything else

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, options: { method?: 'GET' | 'POST'; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: options.method ?? 'GET',
      credentials: 'same-origin',
      // x-hikingbuddy: our CSRF guard (worker/index.ts) — only our own page can send it.
      headers: { 'content-type': 'application/json', 'x-hikingbuddy': '1' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError('offline', 'You are offline.');
  }
  let data: { error?: string; message?: string } | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (res.ok && data) return data as T;

  const code = data?.error;
  // Cloudflare answers with its own (non-JSON) error page when the Workers daily request limit
  // is used up; treat that like D1's daily limit.
  const kind: ApiErrorKind =
    code === 'daily_limit' || (!data && (res.status === 429 || res.status === 503))
      ? 'daily_limit'
      : code === 'rate_limited'
        ? 'rate_limited'
        : res.status === 401
          ? 'unauthorized'
          : code === 'app_outdated'
            ? 'app_outdated'
            : code === 'not_set_up'
              ? 'not_set_up'
              : res.status === 400 || res.status === 409
                ? 'invalid'
                : 'server';
  throw new ApiError(kind, data?.message ?? `The server answered with an error (${res.status}).`);
}

export interface AccountUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
}
