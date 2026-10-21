import { useEffect, useMemo, useReducer } from 'react';
import { loadState, saveState } from '../storage';
import { applyOperation, OperationError, type Operation } from '../core/operations';
import type { AppState } from '../types';
import type { AppStore } from './AppContext';

type GuestAction = { kind: 'op'; op: Operation } | { kind: 'replace'; state: AppState };

function guestReducer(state: AppState, action: GuestAction): AppState {
  if (action.kind === 'replace') return action.state;
  try {
    return applyOperation(state, action.op);
  } catch (err) {
    // The UI only offers allowed changes, so this is a stale click (e.g. on something that
    // was just deleted). Nothing changes.
    if (err instanceof OperationError) {
      console.warn('Change not applied:', err.message);
      return state;
    }
    throw err;
  }
}

/** Guest mode: exactly as before v33 — data in localStorage (and the data file, FR-16). */
export function useGuestStore(): AppStore {
  const [state, send] = useReducer(guestReducer, undefined, loadState);
  useEffect(() => {
    saveState(state);
  }, [state]);
  return useMemo(
    () => ({ state, dispatch: (op) => send({ kind: 'op', op }), replaceState: (next) => send({ kind: 'replace', state: next }) }),
    [state]
  );
}

