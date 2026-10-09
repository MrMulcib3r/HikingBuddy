import { buildBackup, parseBackup, stateFingerprint } from './storage';
import type { AppState } from './types';

/**
 * FR-16: auto-save to a data file on the user's disk ("local database"), via the browser's
 * File System Access API (Chrome / Edge on a computer only). This module is the low-level
 * part: picking the file, reading/writing it, and remembering which file it was.
 *
 * - The file has exactly the Export format (`{ app, schemaVersion, exportedAt, state }`), so
 *   reading it goes through parseBackup() and therefore through every schema migration
 *   (FR-15) — a file written by an older version of the app comes back in today's shape.
 * - The file handle (the browser's "pointer" to the file, plus the user's permission) can't
 *   be put into localStorage, so it's kept in IndexedDB. Clearing site data forgets the
 *   handle, never the file itself.
 */

// Parts of the File System Access API that TypeScript's DOM types don't include yet.
type PermissionMode = { mode: 'readwrite' };
interface PermissionedHandle extends FileSystemFileHandle {
  queryPermission(opts: PermissionMode): Promise<PermissionState>;
  requestPermission(opts: PermissionMode): Promise<PermissionState>;
}
interface PickerOptions {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
}
type PickerWindow = Window & {
  showSaveFilePicker?: (opts?: PickerOptions) => Promise<FileSystemFileHandle>;
  showOpenFilePicker?: (opts?: PickerOptions) => Promise<FileSystemFileHandle[]>;
};

const JSON_TYPES = [{ description: 'HikingBuddy data file', accept: { 'application/json': ['.json'] } }];
export const SUGGESTED_FILE_NAME = 'hikingbuddy-data.json';

export function isDataFileSupported(): boolean {
  const w = window as PickerWindow;
  return typeof w.showSaveFilePicker === 'function' && typeof w.showOpenFilePicker === 'function';
}

/** "Create new data file" — the browser's Save dialog. Choosing an existing file there is
 * fine too: nothing is written until the app has read the file and, if it holds data,
 * asked the user what to do. Returns null if the user closed the dialog. */
export async function pickNewDataFile(): Promise<FileSystemFileHandle | null> {
  try {
    return await (window as PickerWindow).showSaveFilePicker!({ suggestedName: SUGGESTED_FILE_NAME, types: JSON_TYPES });
  } catch (err) {
    if (isAbort(err)) return null;
    throw err;
  }
}

/** "Choose existing data file" — the browser's Open dialog. Returns null if closed. */
export async function pickExistingDataFile(): Promise<FileSystemFileHandle | null> {
  try {
    const [handle] = await (window as PickerWindow).showOpenFilePicker!({ types: JSON_TYPES, multiple: false });
    return handle ?? null;
  } catch (err) {
    if (isAbort(err)) return null;
    throw err;
  }
}

/** Whether the app may write to the file right now, without asking. */
export async function hasWritePermission(handle: FileSystemFileHandle): Promise<boolean> {
  const h = handle as PermissionedHandle;
  if (typeof h.queryPermission !== 'function') return true;
  return (await h.queryPermission({ mode: 'readwrite' })) === 'granted';
}

/** Asks the browser for write access (shows its own prompt). Must be called from a click. */
export async function requestWritePermission(handle: FileSystemFileHandle): Promise<boolean> {
  const h = handle as PermissionedHandle;
  if (typeof h.requestPermission !== 'function') return true;
  return (await h.requestPermission({ mode: 'readwrite' })) === 'granted';
}

export type FileContents = { kind: 'empty' } | { kind: 'data'; state: AppState };

/** Reads and migrates the file. An empty (0-byte or whitespace) file is a fresh file the app
 * may fill. Throws NotHikingBuddyFileError if the file holds something else, so the app
 * never overwrites an unrelated file. Other errors (file gone, no permission) pass through. */
export async function readDataFile(handle: FileSystemFileHandle): Promise<FileContents> {
  const file = await handle.getFile();
  const text = await file.text();
  if (text.trim() === '') return { kind: 'empty' };
  try {
    return { kind: 'data', state: parseBackup(text) };
  } catch {
    throw new NotHikingBuddyFileError(handle.name);
  }
}

export async function writeDataFile(handle: FileSystemFileHandle, state: AppState): Promise<void> {
  const writable = await handle.createWritable();
  try {
    await writable.write(JSON.stringify(buildBackup(state), null, 2));
  } finally {
    await writable.close();
  }
}

export class NotHikingBuddyFileError extends Error {
  constructor(fileName: string) {
    super(`"${fileName}" isn't a HikingBuddy data file, so the app won't touch it. Pick an empty or new file, or one saved by HikingBuddy (an exported backup works too).`);
    this.name = 'NotHikingBuddyFileError';
  }
}

/** The file was moved, renamed or deleted since it was connected. */
export function isFileGone(err: unknown): boolean {
  return err instanceof DOMException && (err.name === 'NotFoundError' || err.name === 'NotReadableError');
}

export function isPermissionLost(err: unknown): boolean {
  return err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

// --- Remembering the connected file (IndexedDB) ---------------------------------------

/** What the app remembers about the connected file between visits. `syncedFingerprint` is
 * the stateFingerprint() of the data last saved to / loaded from the file — it tells, after
 * a browser restart, whether the browser's copy changed while the file wasn't connected. */
export interface RememberedFile {
  handle: FileSystemFileHandle;
  syncedFingerprint: string | null;
}

const DB_NAME = 'hikingbuddy-data-file';
const STORE = 'handles';
const KEY = 'current';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function loadRememberedFile(): Promise<RememberedFile | null> {
  try {
    const value = await withStore<RememberedFile | undefined>('readonly', (s) => s.get(KEY));
    return value?.handle ? { handle: value.handle, syncedFingerprint: value.syncedFingerprint ?? null } : null;
  } catch (err) {
    console.error('Could not read the remembered data file.', err);
    return null;
  }
}

export async function rememberFile(handle: FileSystemFileHandle, synced: AppState | null): Promise<void> {
  const value: RememberedFile = { handle, syncedFingerprint: synced ? stateFingerprint(synced) : null };
  try {
    await withStore('readwrite', (s) => s.put(value, KEY));
  } catch (err) {
    console.error('Could not remember the data file.', err);
  }
}

export async function forgetFile(): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.delete(KEY));
  } catch (err) {
    console.error('Could not forget the data file.', err);
  }
}
