import { CURRENT_SCHEMA_VERSION } from '../core/schema';
import type { Operation } from '../core/operations';
import type { AppState } from '../types';

/**
 * This browser's working copy of a signed-in account (PRD v33, FR-24): the last state the
 * server confirmed + the changes not sent yet. It lets the app open instantly and — the point —
 * keeps unsent changes through a lost connection, D1's daily limit, a closed tab or a reload.
 *
 * Its own key per account, separate from the guest data (`hikingbuddy-state`, which is never
 * touched by an account — CLAUDE.md "Data storage" rule 1). Removed on sign-out unless it still
 * holds unsent changes.
 */
export interface AccountCache {
  schemaVersion: number;
  version: number;
  confirmed: AppState | null;
  pending: PendingOp[];
}

/** A change not sent yet. `action`: changes from one click share it and become one entry in
 * Activity (FR-25). */
export interface PendingOp {
  op: Operation;
  action?: string;
}

/** Queues written before PRD v35 hold bare operations. */
function readPending(raw: unknown): PendingOp[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => ('op' in x && x.op && typeof x.op === 'object' ? { op: x.op as Operation, action: typeof x.action === 'string' ? x.action : undefined } : { op: x as unknown as Operation }));
}

const keyFor = (userId: string) => `hikingbuddy-account-${userId}`;

export function readAccountCache(userId: string): AccountCache {
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (raw) {
      const cache = JSON.parse(raw) as AccountCache;
      const pending = readPending(cache.pending);
      // A copy from an older app version is only a display hint — the server copy is reloaded
      // anyway; unsent changes are kept (operations, not data shapes).
      if (cache.schemaVersion !== CURRENT_SCHEMA_VERSION) return { schemaVersion: CURRENT_SCHEMA_VERSION, version: -1, confirmed: null, pending };
      return { ...cache, pending };
    }
  } catch {
    // unreadable → start from the server
  }
  return { schemaVersion: CURRENT_SCHEMA_VERSION, version: -1, confirmed: null, pending: [] };
}

export function writeAccountCache(userId: string, cache: AccountCache): void {
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(cache));
  } catch (err) {
    console.error('Could not keep a copy of the account in this browser.', err);
  }
}

export function clearAccountCache(userId: string): void {
  try {
    window.localStorage.removeItem(keyFor(userId));
  } catch {
    // nothing to do
  }
}

export function hasPendingChanges(userId: string): boolean {
  return readAccountCache(userId).pending.length > 0;
}
