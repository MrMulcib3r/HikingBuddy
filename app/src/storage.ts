import { LEGACY_STORAGE_KEYS, STORAGE_KEY } from './constants';
import { CURRENT_SCHEMA_VERSION, defaultState, isEmptyState, runMigrations, type StoredPayload } from './core/schema';
import type { AppState } from './types';

// Migrations live in core/schema.ts (shared with the server since PRD v33). Bump
// CURRENT_SCHEMA_VERSION and add to MIGRATIONS there — the policy in that file's header applies.
export { CURRENT_SCHEMA_VERSION, buildBackup, isEmptyState, parseBackup, stateFingerprint, type BackupFile } from './core/schema';

/**
 * Režim bez účtu (host) ukládá data jen do prohlížeče (localStorage); přihlášený uživatel má
 * data na serveru (PRD v33, FR-23/24) a tenhle klíč se pro něj nepoužívá ani nemění. To má jedno důležité omezení, které Martin správně pojmenoval: pokud si
 * uživatel v prohlížeči smaže data stránek ("clear browsing data"), localStorage zmizí
 * nenávratně spolu s ním — appka samotná to nemůže ovlivnit, protože jde o funkci
 * prohlížeče, ne appky. Proto appka navíc nabízí Export/Import zálohy do skutečného
 * souboru (viz BackupControls.tsx) — to je jediný způsob, jak mít v MVP (bez serveru) data
 * nezávislá na tom, že v prohlížeči zůstanou.
 */

/** Reads and migrates whichever legacy key (if any) holds real data. Returns null if none
 * of the legacy keys exist or none of them contain anything. */
function recoverFromLegacyKeys(): AppState | null {
  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    const legacyRaw = window.localStorage.getItem(legacyKey);
    if (!legacyRaw) continue;
    // hikingbuddy-state-v2 was already schema 2 (just not wrapped with a version yet);
    // hikingbuddy-state-v1 was schema 1 (the Draft/Finalized model).
    const fromVersion = legacyKey.endsWith('-v1') ? 1 : 2;
    const state = runMigrations(JSON.parse(legacyRaw), fromVersion);
    if (!isEmptyState(state)) return state;
  }
  return null;
}

export function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const payload = JSON.parse(raw) as Partial<StoredPayload>;
      const version = typeof payload.schemaVersion === 'number' ? payload.schemaVersion : CURRENT_SCHEMA_VERSION;
      const state = runMigrations(payload.state ?? payload, version);

      // Guard against the exact failure Martin hit on 2026-09-24: the app's own first
      // render after the v7 key rename wrote an empty default payload under STORAGE_KEY
      // (via the normal auto-save effect) *before* anyone had a chance to recover the old
      // data — so this key existing and being empty does NOT mean the user's data is
      // gone, it can just mean nobody has looked at the legacy keys yet. Whenever the
      // current key's data is empty, check the legacy keys for real content before
      // accepting "empty" as the answer.
      if (isEmptyState(state)) {
        const recovered = recoverFromLegacyKeys();
        if (recovered) {
          saveState(recovered);
          return recovered;
        }
      }

      if (version < CURRENT_SCHEMA_VERSION) saveState(state); // persist the upgraded shape right away
      return state;
    }

    // Nothing under the current key yet — check older keys before giving up, so a schema
    // change (or the key rename that happened once in the past) never looks like data loss.
    const recovered = recoverFromLegacyKeys();
    if (recovered) {
      saveState(recovered);
      return recovered;
    }

    return defaultState();
  } catch (err) {
    console.error('Nepodařilo se načíst uložená data, startuji s prázdným stavem.', err);
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  try {
    const payload: StoredPayload = { schemaVersion: CURRENT_SCHEMA_VERSION, state };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Nepodařilo se uložit data do prohlížeče.', err);
  }
}
