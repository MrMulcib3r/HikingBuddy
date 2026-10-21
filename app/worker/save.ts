/**
 * Saving a change of one user's data, shared by the web API (/api) and the MCP server (/mcp, FR-26):
 * load → apply the change through the operations layer → write the changed rows and the history
 * entries in one transaction (FR-25). When another device saved in between, start over on its
 * result (operations are intents, so they re-apply cleanly).
 */
import { CURRENT_SCHEMA_VERSION } from '../src/core/schema';
import type { HistoryEntry } from '../src/core/history';
import type { AppState } from '../src/types';
import { insertEntryStatement, loadState, saveState, VersionConflict } from './db';

export interface SaveResult {
  schemaVersion: number;
  version: number;
  state: AppState;
  rejected: { index: number; message: string }[];
}

export async function saveWithRetry(
  db: D1Database,
  userId: string,
  change: (state: AppState) => { state: AppState; rejected: { index: number; error: Error }[]; entries?: HistoryEntry[] }
): Promise<SaveResult> {
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
      if (err instanceof VersionConflict && attempt < 3) continue;
      throw err;
    }
  }
}
