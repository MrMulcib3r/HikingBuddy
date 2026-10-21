/**
 * Sign-in with Google (PRD v33, FR-23). The browser shows Google's own "Sign in with Google"
 * button (Google Identity Services). Google hands the browser a signed ID token; we check the
 * signature against Google's published keys (library `jose`, nothing hand-made), then start our
 * own session: a random token in an HttpOnly + Secure + SameSite=Lax cookie, only its SHA-256
 * stored in D1.
 *
 * Step 3 (MCP, FR-26) reuses this: workers-oauth-provider's authorize page will look at the
 * same session cookie, and show the same Google button if there is none.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Context } from 'hono';
import { createSession, deleteSession, findSessionUser, type UserRow } from './db';
import type { AppEnv } from './env';

export const SESSION_COOKIE = 'hb_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
}

/** Checks a Google ID token (signature, issuer, audience = our client id, expiry, verified e-mail). */
export async function verifyGoogleCredential(credential: string, clientId: string): Promise<GoogleProfile> {
  const { payload } = await jwtVerify(credential, googleKeys, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: clientId,
  });
  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string' || payload.email_verified !== true) {
    throw new Error('Google did not confirm this e-mail address.');
  }
  const name = typeof payload.name === 'string' && payload.name ? payload.name : payload.email.split('@')[0];
  return { sub: payload.sub, email: payload.email, name, picture: typeof payload.picture === 'string' ? payload.picture : null };
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function startSession(c: Context<AppEnv>, userId: string): Promise<void> {
  const token = randomToken();
  await createSession(c.env.DB, userId, await sha256(token), SESSION_MAX_AGE);
  setCookie(c, SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: SESSION_MAX_AGE });
}

export async function endSession(c: Context<AppEnv>): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) await deleteSession(c.env.DB, await sha256(token));
  deleteCookie(c, SESSION_COOKIE, { path: '/', secure: true });
}

/** The signed-in user for this request, or null. */
export async function sessionUser(c: Context<AppEnv>): Promise<UserRow | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  return findSessionUser(c.env.DB, await sha256(token));
}
