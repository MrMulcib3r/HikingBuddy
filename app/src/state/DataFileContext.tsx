import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useApp } from './AppContext';
import { stateFingerprint } from '../storage';
import {
  forgetFile,
  hasWritePermission,
  isDataFileSupported,
  isFileGone,
  isPermissionLost,
  loadRememberedFile,
  readDataFile,
  rememberFile,
  requestWritePermission,
  writeDataFile,
} from '../dataFile';
import type { AppState } from '../types';

/**
 * FR-16 — auto-save to a data file. Owns the "is a file connected, and is it saved?" state
 * machine; the low-level file work is in ../dataFile.ts and the UI in DataFileControls.tsx.
 *
 * Safety rules (CLAUDE.md, "Data storage"):
 * - Nothing is written to the file until the user has granted write access in this visit.
 * - A file that already holds data is never overwritten without the Cancel / Load data from
 *   file / Overwrite file dialog. That includes the file changing behind the app's back
 *   (e.g. edited on another computer through OneDrive) — checked before every save.
 * - Once connected, the file is the source of truth: if the browser's copy didn't change
 *   since the last sync but the file did, the file's data is loaded without asking.
 */

export type DataFileStatus =
  | { kind: 'unsupported' }
  | { kind: 'starting' }
  | { kind: 'none' }
  /** A file is remembered but the browser wants the user to confirm access again. */
  | { kind: 'reconnect'; fileName: string }
  /** The connected file can't be found (moved, renamed or deleted). */
  | { kind: 'missing'; fileName: string }
  /** File and app hold different data — the user picks which one wins. */
  | { kind: 'conflict'; fileName: string; fileState: AppState; reason: 'connect' | 'reconnect' }
  | { kind: 'connected'; fileName: string; save: 'saved' | 'saving' | 'error'; savedAt: Date | null; error?: string };

interface DataFileContextValue {
  status: DataFileStatus;
  /** True whenever a data file is connected or remembered — "Load demo data" is blocked then (FR-17). */
  fileInUse: boolean;
  /** One-off message to show the user (e.g. "Loaded newer data from the file"), or an error. */
  notice: { text: string; error: boolean } | null;
  dismissNotice: () => void;
  /** Connect a file the user just picked. */
  connect: (handle: FileSystemFileHandle) => Promise<void>;
  /** Re-grant access to the remembered file (must be called from a click). */
  reconnect: () => Promise<void>;
  disconnect: () => Promise<void>;
  resolveConflict: (choice: 'cancel' | 'load-file' | 'overwrite-file') => Promise<void>;
}

const DataFileContext = createContext<DataFileContextValue | null>(null);

const SAVE_DELAY_MS = 1000;

export function DataFileProvider({ children }: { children: ReactNode }) {
  const { state, replaceState } = useApp();
  const supported = isDataFileSupported();
  const [status, setStatus] = useState<DataFileStatus>(supported ? { kind: 'starting' } : { kind: 'unsupported' });
  const [notice, setNotice] = useState<DataFileContextValue['notice']>(null);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const handleRef = useRef<FileSystemFileHandle | null>(null);
  /** Handle picked for a conflict that hasn't been decided yet (not remembered until then). */
  const pendingHandleRef = useRef<FileSystemFileHandle | null>(null);
  /** stateFingerprint() of what was last written to / read from the file. */
  const syncedRef = useRef<string | null>(null);
  /** Status before the user picked a new file — restored if they cancel its conflict dialog. */
  const statusBeforeConnectRef = useRef<DataFileStatus>({ kind: 'none' });
  const writingRef = useRef(false);
  /** A change arrived while a save was running — save once more when it's done. */
  const writeAgainRef = useRef(false);
  const saveRef = useRef<() => Promise<void>>(async () => {});

  const markSynced = useCallback(async (handle: FileSystemFileHandle, synced: AppState) => {
    handleRef.current = handle;
    syncedRef.current = stateFingerprint(synced);
    await rememberFile(handle, synced);
  }, []);

  const handleFileError = useCallback((err: unknown, fileName: string) => {
    if (isFileGone(err)) {
      setStatus({ kind: 'missing', fileName });
    } else if (isPermissionLost(err)) {
      setStatus({ kind: 'reconnect', fileName });
    } else {
      console.error('Data file error.', err);
      setNotice({ text: err instanceof Error ? err.message : `Something went wrong with "${fileName}".`, error: true });
      setStatus({ kind: 'reconnect', fileName });
    }
  }, []);

  /** Reads the file and decides whether it can be used straight away or needs the dialog. */
  const attach = useCallback(
    async (handle: FileSystemFileHandle, reason: 'connect' | 'reconnect') => {
      const current = stateRef.current;
      const contents = await readDataFile(handle);
      if (contents.kind === 'empty') {
        await writeDataFile(handle, current);
        await markSynced(handle, current);
        setStatus({ kind: 'connected', fileName: handle.name, save: 'saved', savedAt: new Date() });
        return;
      }
      const fileFp = stateFingerprint(contents.state);
      const currentFp = stateFingerprint(current);
      if (fileFp === currentFp) {
        await markSynced(handle, contents.state);
        setStatus({ kind: 'connected', fileName: handle.name, save: 'saved', savedAt: null });
        return;
      }
      if (reason === 'reconnect' && syncedRef.current === currentFp) {
        // Nothing changed in this browser since the last sync, but the file did (e.g. it was
        // edited on another computer) — the file is the source of truth, take it.
        replaceState(contents.state);
        await markSynced(handle, contents.state);
        setNotice({ text: `Loaded the latest data from "${handle.name}".`, error: false });
        setStatus({ kind: 'connected', fileName: handle.name, save: 'saved', savedAt: null });
        return;
      }
      pendingHandleRef.current = handle;
      setStatus({ kind: 'conflict', fileName: handle.name, fileState: contents.state, reason });
    },
    [markSynced, replaceState]
  );

  // On start: is a file remembered from an earlier visit, and may we still write to it?
  const startedRef = useRef(false);
  useEffect(() => {
    if (!supported || startedRef.current) return;
    startedRef.current = true;
    (async () => {
      const remembered = await loadRememberedFile();
      if (!remembered) {
        setStatus({ kind: 'none' });
        return;
      }
      handleRef.current = remembered.handle;
      syncedRef.current = remembered.syncedFingerprint;
      const fileName = remembered.handle.name;
      try {
        if (await hasWritePermission(remembered.handle)) await attach(remembered.handle, 'reconnect');
        else setStatus({ kind: 'reconnect', fileName });
      } catch (err) {
        handleFileError(err, fileName);
      }
    })();
  }, [supported, attach, handleFileError]);

  const save = useCallback(async () => {
    const handle = handleRef.current;
    if (!handle) return;
    if (writingRef.current) {
      writeAgainRef.current = true;
      return;
    }
    const current = stateRef.current;
    const currentFp = stateFingerprint(current);
    if (currentFp === syncedRef.current) return;
    writingRef.current = true;
    setStatus((s) => (s.kind === 'connected' ? { ...s, save: 'saving' } : s));
    try {
      // Never overwrite changes someone else made to the file since our last sync.
      const contents = await readDataFile(handle);
      if (contents.kind === 'data') {
        const fileFp = stateFingerprint(contents.state);
        if (fileFp !== syncedRef.current && fileFp !== currentFp) {
          pendingHandleRef.current = handle;
          setStatus({ kind: 'conflict', fileName: handle.name, fileState: contents.state, reason: 'reconnect' });
          return;
        }
      }
      await writeDataFile(handle, current);
      await markSynced(handle, current);
      setStatus((s) => (s.kind === 'connected' ? { ...s, save: 'saved', savedAt: new Date(), error: undefined } : s));
    } catch (err) {
      if (isFileGone(err) || isPermissionLost(err)) {
        handleFileError(err, handle.name);
      } else {
        console.error('Saving to the data file failed.', err);
        const message = err instanceof Error ? err.message : String(err);
        setStatus((s) => (s.kind === 'connected' ? { ...s, save: 'error', error: message } : s));
      }
    } finally {
      writingRef.current = false;
      if (writeAgainRef.current) {
        writeAgainRef.current = false;
        void saveRef.current();
      }
    }
  }, [handleFileError, markSynced]);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Auto-save: ~1 s after the last change, so typing doesn't write on every key press.
  const connected = status.kind === 'connected';
  useEffect(() => {
    if (!connected) return;
    const timer = window.setTimeout(() => void save(), SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [state, connected, save]);

  const connect = useCallback(
    async (handle: FileSystemFileHandle) => {
      setNotice(null);
      statusBeforeConnectRef.current = status;
      try {
        if (!(await hasWritePermission(handle)) && !(await requestWritePermission(handle))) {
          setNotice({ text: `HikingBuddy wasn't allowed to save to "${handle.name}", so it isn't connected.`, error: true });
          return;
        }
        await attach(handle, 'connect');
      } catch (err) {
        console.error('Connecting the data file failed.', err);
        setNotice({ text: err instanceof Error ? err.message : `Couldn't open "${handle.name}".`, error: true });
      }
    },
    [attach, status]
  );

  const reconnect = useCallback(async () => {
    const handle = handleRef.current;
    if (!handle) return;
    setNotice(null);
    try {
      if (!(await requestWritePermission(handle))) {
        setNotice({ text: `Access to "${handle.name}" wasn't allowed — changes are still saved only in this browser.`, error: true });
        return;
      }
      await attach(handle, 'reconnect');
    } catch (err) {
      handleFileError(err, handle.name);
    }
  }, [attach, handleFileError]);

  const disconnect = useCallback(async () => {
    handleRef.current = null;
    pendingHandleRef.current = null;
    syncedRef.current = null;
    await forgetFile();
    setNotice(null);
    setStatus({ kind: 'none' });
  }, []);

  const resolveConflict = useCallback(
    async (choice: 'cancel' | 'load-file' | 'overwrite-file') => {
      if (status.kind !== 'conflict') return;
      const handle = pendingHandleRef.current;
      pendingHandleRef.current = null;
      if (!handle) return;
      if (choice === 'cancel') {
        // A newly picked file simply isn't connected; a remembered one stays paused, with
        // the reconnect banner, so nothing gets written until the user decides.
        setStatus(status.reason === 'connect' ? statusBeforeConnectRef.current : { kind: 'reconnect', fileName: handle.name });
        return;
      }
      try {
        if (choice === 'load-file') {
          replaceState(status.fileState);
          await markSynced(handle, status.fileState);
          setStatus({ kind: 'connected', fileName: handle.name, save: 'saved', savedAt: null });
        } else {
          const current = stateRef.current;
          await writeDataFile(handle, current);
          await markSynced(handle, current);
          setStatus({ kind: 'connected', fileName: handle.name, save: 'saved', savedAt: new Date() });
        }
      } catch (err) {
        handleFileError(err, handle.name);
      }
    },
    [status, replaceState, markSynced, handleFileError]
  );

  const value = useMemo<DataFileContextValue>(
    () => ({
      status,
      fileInUse: status.kind !== 'none' && status.kind !== 'unsupported',
      notice,
      dismissNotice: () => setNotice(null),
      connect,
      reconnect,
      disconnect,
      resolveConflict,
    }),
    [status, notice, connect, reconnect, disconnect, resolveConflict]
  );

  return <DataFileContext.Provider value={value}>{children}</DataFileContext.Provider>;
}

export function useDataFile(): DataFileContextValue {
  const ctx = useContext(DataFileContext);
  if (!ctx) throw new Error('useDataFile must be used inside <DataFileProvider>.');
  return ctx;
}
