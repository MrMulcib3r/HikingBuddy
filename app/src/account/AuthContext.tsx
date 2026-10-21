import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, type AccountUser } from './api';
import { clearAccountCache, hasPendingChanges } from './accountCache';

/**
 * PRD v33, FR-23: am I signed in? Guest mode (no account) works exactly as before; signing in
 * switches the app to the account's data on the server. The session itself is an HttpOnly
 * cookie the browser can't read — we ask the server (/api/me).
 *
 * Offline start: if the server can't be reached but this browser was signed in last time, the
 * app opens that account from its local copy (with unsaved changes) instead of jumping to guest
 * mode, so nothing seems lost.
 */
type AuthStatus = { kind: 'loading' } | { kind: 'guest' } | { kind: 'signedIn'; user: AccountUser };

interface AuthContextValue {
  status: AuthStatus;
  /** Google OAuth client id from the server (null = sign-in not set up yet). */
  googleClientId: string | null | undefined;
  /** Completes sign-in with the ID token from Google's button. */
  signInWithGoogle: (credential: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const LAST_USER_KEY = 'hikingbuddy-account-last-user';

function readLastUser(): AccountUser | null {
  try {
    const raw = window.localStorage.getItem(LAST_USER_KEY);
    return raw ? (JSON.parse(raw) as AccountUser) : null;
  } catch {
    return null;
  }
}
function writeLastUser(user: AccountUser | null) {
  try {
    if (user) window.localStorage.setItem(LAST_USER_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(LAST_USER_KEY);
  } catch {
    // storage blocked: only the offline start is affected
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>({ kind: 'loading' });
  const [googleClientId, setGoogleClientId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    // Too many requests / a passing server error: wait and ask again instead of falling back to
    // guest mode (which would hide the account's data for no reason).
    const withRetry = async <T,>(load: () => Promise<T>): Promise<T> => {
      for (let attempt = 0; ; attempt++) {
        try {
          return await load();
        } catch (err) {
          const transient = err instanceof ApiError && (err.kind === 'rate_limited' || err.kind === 'server');
          if (!transient || attempt >= 4 || cancelled) throw err;
          await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)));
        }
      }
    };
    withRetry(() => api<{ user: AccountUser | null }>('/api/me'))
      .then(({ user }) => {
        if (cancelled) return;
        writeLastUser(user);
        setStatus(user ? { kind: 'signedIn', user } : { kind: 'guest' });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const last = readLastUser();
        // Can't reach the server: reopen the last account from this browser's copy.
        if (last && err instanceof ApiError && err.kind !== 'unauthorized') setStatus({ kind: 'signedIn', user: last });
        else setStatus({ kind: 'guest' });
      });
    withRetry(() => api<{ googleClientId: string | null }>('/auth/config'))
      .then((c) => !cancelled && setGoogleClientId(c.googleClientId))
      .catch(() => !cancelled && setGoogleClientId(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithGoogle = useCallback(async (credential: string) => {
    const { user } = await api<{ user: AccountUser }>('/auth/google', { method: 'POST', body: { credential } });
    writeLastUser(user);
    setStatus({ kind: 'signedIn', user });
  }, []);

  const signOut = useCallback(async () => {
    const user = status.kind === 'signedIn' ? status.user : null;
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // Offline: the cookie stays until it expires, but this browser shows guest mode now.
    }
    // Leave nothing of the account in this browser — unless there are unsent changes, which are
    // kept and sent on the next sign-in.
    if (user && !hasPendingChanges(user.id)) clearAccountCache(user.id);
    writeLastUser(null);
    setStatus({ kind: 'guest' });
  }, [status]);

  const value = useMemo(
    () => ({ status, googleClientId, signInWithGoogle, signOut }),
    [status, googleClientId, signInWithGoogle, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}
