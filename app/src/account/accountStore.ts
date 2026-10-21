import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyOperation, applyOperations, OperationError, type Operation } from '../core/operations';
import { CURRENT_SCHEMA_VERSION, isEmptyState } from '../core/schema';
import { api, ApiError } from './api';
import { readAccountCache, writeAccountCache, type AccountCache, type PendingOp } from './accountCache';
import { newId } from '../utils/id';
import type { RichPart } from '../core/history';
import type { AppStore } from '../state/AppContext';
import type { AppState } from '../types';

/**
 * Signed in (PRD v33, FR-23/FR-24): the server's copy is the source of truth.
 *
 * Every change is applied here at once (instant UI, same operations layer as the server),
 * queued, and sent to /api/ops a moment later. The server applies the same operations, saves
 * them and answers with the account's state; the queue only shrinks once the server has the
 * change. The queue is kept in this browser (accountCache), so a lost connection, D1's daily
 * limit, a reload or a closed tab never loses a change — it is sent on the next try.
 */
export type SaveStatus =
  | { kind: 'loading' }
  | { kind: 'saved' }
  | { kind: 'saving' }
  | { kind: 'offline' }
  | { kind: 'limit' }
  | { kind: 'signedOut' }
  | { kind: 'outdated' }
  | { kind: 'error'; message: string };

interface ServerState {
  schemaVersion: number;
  version: number;
  state: AppState;
  rejected?: { index: number; message: string }[];
}

const SEND_DELAY_MS = 400;
const MAX_BATCH = 200;
const RETRY_MS: Partial<Record<ApiError['kind'], number>> = {
  offline: 10_000,
  rate_limited: 15_000,
  server: 30_000,
  daily_limit: 15 * 60_000,
};

export interface AccountSync {
  status: SaveStatus;
  /** True until the account's data is known (first load with nothing cached). */
  loading: boolean;
  /** No gear and no gearlists in the account (incl. unsent changes). */
  accountEmpty: boolean;
  /** A change the server refused (e.g. something was deleted on another device meanwhile). */
  notice: string | null;
  dismissNotice: () => void;
  /** "Try again" on the offline / error banners. */
  retry: () => void;
  /** FR-23 import, Import backup and demo data: sent right away, never queued. */
  importState: (state: AppState, mode: 'replace_empty' | 'as_new') => Promise<void>;
  /** FR-25: sends unsent changes first, then asks the server to undo. */
  undo: (target: UndoTargetRequest, mode: UndoMode) => Promise<UndoResponse>;
  /** Grows with every saved change — Activity reloads when it changes. */
  dataVersion: number;
}

export type UndoTargetRequest = { entryId: string; change?: number } | { day: { from: string; to: string } };
export type UndoMode = 'check' | 'auto' | 'all' | 'keep_later';
export interface UndoConflict {
  actor: 'you' | 'ai';
  client: string | null;
  at: string;
  text: RichPart[];
}
export type UndoResponse =
  | { applied: true }
  | { applied: false; count: number; conflicting: number; byClient: { client: string; count: number }[]; conflicts: UndoConflict[] };

export function useAccountStore(userId: string): { store: AppStore; sync: AccountSync } {
  // `data` drives rendering; `dataRef` is the same value for the async sending code.
  const [data, setData] = useState(() => readAccountCache(userId));
  const dataRef = useRef(data);
  const [status, setStatus] = useState<SaveStatus>(() => (data.confirmed ? { kind: 'saved' } : { kind: 'loading' }));
  const [notice, setNotice] = useState<string | null>(null);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Updates the working copy, keeps it in this browser and re-renders. */
  const commit = useCallback(
    (change: Partial<AccountCache>) => {
      const next = { ...dataRef.current, ...change, schemaVersion: CURRENT_SCHEMA_VERSION };
      dataRef.current = next;
      writeAccountCache(userId, next);
      setData(next);
    },
    [userId]
  );
  const acceptServerState = useCallback((res: ServerState, pending: PendingOp[]) => commit({ confirmed: res.state, version: res.version, pending }), [commit]);

  // `sync` and `schedule` call each other; the ref breaks the cycle for the linter.
  const syncRef = useRef<() => Promise<void>>(async () => {});
  const schedule = useCallback((delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void syncRef.current();
    }, delay);
  }, []);

  /** Sends the queue (or, with nothing queued, fetches the latest state). */
  const sync = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    let succeeded = false;
    setStatus((s) => (s.kind === 'loading' ? s : { kind: 'saving' }));
    try {
      while (true) {
        const batch = dataRef.current.pending.slice(0, MAX_BATCH);
        if (batch.length === 0) {
          const res = await api<ServerState>('/api/state');
          // Changes made while the request ran stay queued on top.
          acceptServerState(res, dataRef.current.pending);
          if (dataRef.current.pending.length === 0) break;
          continue;
        }
        let res: ServerState;
        try {
          res = await api<ServerState>('/api/ops', {
            method: 'POST',
            body: { schemaVersion: CURRENT_SCHEMA_VERSION, ops: batch.map((p) => p.op), actions: batch.map((p) => p.action) },
          });
        } catch (err) {
          // The server can't read this batch at all — it would never go through. Drop it and
          // reload the account rather than block every later change.
          if (err instanceof ApiError && err.kind === 'invalid') {
            commit({ pending: dataRef.current.pending.slice(batch.length) });
            setNotice('Some changes could not be saved and were undone.');
            continue;
          }
          throw err;
        }
        acceptServerState(res, dataRef.current.pending.slice(batch.length));
        if (res.rejected?.length) setNotice(`A change could not be saved: ${res.rejected[0].message}`);
        if (dataRef.current.pending.length === 0) break;
      }
      setStatus({ kind: 'saved' });
      succeeded = true;
    } catch (err) {
      const kind = err instanceof ApiError ? err.kind : 'server';
      if (kind === 'offline') setStatus({ kind: 'offline' });
      else if (kind === 'daily_limit') setStatus({ kind: 'limit' });
      // Signed out (elsewhere, or the session expired): changes stay queued until signing in again.
      else if (kind === 'unauthorized') setStatus({ kind: 'signedOut' });
      else if (kind === 'app_outdated') setStatus({ kind: 'outdated' });
      else if (kind === 'rate_limited') setStatus({ kind: 'saving' });
      else setStatus({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      const retryIn = RETRY_MS[kind];
      if (retryIn) schedule(retryIn);
    } finally {
      inFlight.current = false;
    }
    // A change made right at the end of the request, whose own timer found us busy.
    if (succeeded && dataRef.current.pending.length > 0 && !timer.current) schedule(SEND_DELAY_MS);
  }, [acceptServerState, commit, schedule]);
  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  // First load, back online, and back to the tab (picks up changes from other devices).
  useEffect(() => {
    const first = setTimeout(() => void sync(), 0);
    const onOnline = () => void sync();
    const onFocus = () => {
      if (dataRef.current.pending.length === 0 && !inFlight.current) void sync();
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
      clearTimeout(first);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [sync]);

  const state = useMemo(() => (data.confirmed ? applyOperations(data.confirmed, opsOf(data.pending)).state : null), [data]);

  // Changes dispatched in the same moment (one click) share an action id → one Activity entry.
  const currentAction = useRef<string | null>(null);

  const dispatch = useCallback(
    (op: Operation) => {
      const { confirmed, pending } = dataRef.current;
      const current = confirmed ? applyOperations(confirmed, opsOf(pending)).state : null;
      if (!current) return;
      try {
        applyOperation(current, op); // same rules as the server; a refused change is never queued
      } catch (err) {
        if (err instanceof OperationError) {
          console.warn('Change not applied:', err.message);
          return;
        }
        throw err;
      }
      if (!currentAction.current) {
        currentAction.current = newId('act');
        queueMicrotask(() => (currentAction.current = null));
      }
      commit({ pending: [...pending, { op, action: currentAction.current }] });
      setStatus((s) => (s.kind === 'saved' ? { kind: 'saving' } : s));
      schedule(SEND_DELAY_MS);
    },
    [commit, schedule]
  );

  const importState = useCallback(
    async (next: AppState, mode: 'replace_empty' | 'as_new') => {
      // Unsent changes first, so the import lands on top of everything the user did.
      if (dataRef.current.pending.length > 0) {
        await sync();
        if (dataRef.current.pending.length > 0) throw new ApiError('offline', 'Your earlier changes are not saved yet. Try again in a moment.');
      }
      setStatus({ kind: 'saving' });
      try {
        const res = await api<ServerState>('/api/import', { method: 'POST', body: { schemaVersion: CURRENT_SCHEMA_VERSION, state: next, mode } });
        acceptServerState(res, dataRef.current.pending);
        setStatus({ kind: 'saved' });
      } catch (err) {
        setStatus(err instanceof ApiError && err.kind === 'daily_limit' ? { kind: 'limit' } : { kind: 'saved' });
        throw err;
      }
    },
    [acceptServerState, sync]
  );

  const undo = useCallback(
    async (target: UndoTargetRequest, mode: UndoMode): Promise<UndoResponse> => {
      // Unsent changes first: Undo must see everything the user did.
      if (dataRef.current.pending.length > 0) {
        await sync();
        if (dataRef.current.pending.length > 0) throw new ApiError('offline', 'Your latest changes are not saved yet. Try again in a moment.');
      }
      const res = await api<UndoResponse & Partial<ServerState>>('/api/undo', { method: 'POST', body: { target, mode } });
      if (res.applied) acceptServerState(res as unknown as ServerState, dataRef.current.pending);
      return res;
    },
    [acceptServerState, sync]
  );

  const store = useMemo<AppStore>(
    () => ({
      state: state ?? EMPTY_PLACEHOLDER,
      dispatch,
      // Wholesale replace (Import backup, demo) goes through the import endpoint while signed in.
      replaceState: (next) => {
        void importState(next, state && isEmptyState(state) ? 'replace_empty' : 'as_new').catch((err) => setNotice(err instanceof Error ? err.message : String(err)));
      },
    }),
    [state, dispatch, importState]
  );

  const retry = useCallback(() => void sync(), [sync]);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const sync_ = useMemo<AccountSync>(
    () => ({
      status,
      loading: state === null,
      accountEmpty: state !== null && isEmptyState(state),
      notice,
      dismissNotice,
      retry,
      importState,
      undo,
      dataVersion: data.version,
    }),
    [status, state, notice, dismissNotice, retry, importState, undo, data.version]
  );

  return { store, sync: sync_ };
}

const opsOf = (pending: PendingOp[]): Operation[] => pending.map((p) => p.op);

/** Rendered only for the instant before the account's data arrives (the UI shows a loading card). */
const EMPTY_PLACEHOLDER: AppState = {
  categories: [],
  gearItems: [],
  gearLists: [],
  templates: [],
  templateBannerDismissed: true,
  unitPreference: 'metric',
};
