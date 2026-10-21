/**
 * FR-25 Undo, shared by the web (/api/undo) and the MCP server (undo_last_ai_step, FR-26).
 * Undo of one change, one entry (an AI step or one of your own edits), or all AI changes of a
 * day. mode "check" only reports what would happen (count, conflicts); "auto" undoes right away
 * unless there is a conflict; "all" overwrites later changes; "keep_later" skips them.
 */
import {
  compareEntries,
  diffStates,
  laterChangesFor,
  setUndone,
  undoChanges,
  type Actor,
  type HistoryEntry,
  type RichPart,
  type UndoTarget,
} from '../src/core/history';
import { CURRENT_SCHEMA_VERSION } from '../src/core/schema';
import type { AppState } from '../src/types';
import { insertEntryStatement, loadHistory, loadState, saveState, updateEntryStatement, VersionConflict } from './db';

export type UndoRequestTarget = { entryId: string; change?: number } | { day: { from: string; to: string } };
export type UndoRequestMode = 'check' | 'auto' | 'all' | 'keep_later';

export interface UndoConflictOut {
  actor: Actor;
  client: string | null;
  at: string;
  text: RichPart[];
}

export type UndoOutcome =
  | { kind: 'error'; status: 400 | 409; message: string }
  | {
      kind: 'check';
      applied: false;
      count: number;
      conflicting: number;
      byClient: { client: string; count: number }[];
      conflicts: UndoConflictOut[];
    }
  | { kind: 'applied'; applied: true; schemaVersion: number; version: number; state: AppState; rejected: []; text: RichPart[]; count: number };

export async function runUndo(
  db: D1Database,
  userId: string,
  target: UndoRequestTarget,
  mode: UndoRequestMode,
  who: { actor: Actor; client: string | null }
): Promise<UndoOutcome> {
  for (let attempt = 0; ; attempt++) {
    const [loaded, history] = await Promise.all([loadState(db, userId), loadHistory(db, userId)]);
    const byId = new Map(history.map((e) => [e.id, e]));

    // Which changes to undo (already undone ones are not counted again).
    let picked: { entry: HistoryEntry; index: number }[];
    if ('entryId' in target) {
      const entry = byId.get(target.entryId);
      if (!entry) return { kind: 'error', status: 400, message: 'This change is older than 30 days and can no longer be undone.' };
      if (!entry.undoable) return { kind: 'error', status: 400, message: 'This change is too large to undo.' };
      const indices = target.change !== undefined ? [target.change] : entry.changes.map((_, i) => i);
      picked = indices.filter((i) => entry.changes[i] && !entry.changes[i].undoneAt).map((index) => ({ entry, index }));
    } else {
      picked = history
        .filter((e) => e.actor === 'ai' && e.undoable && e.kind === 'change' && e.at >= target.day.from && e.at < target.day.to)
        .flatMap((entry) => entry.changes.map((ch, index) => ({ entry, index, ch })).filter((x) => !x.ch.undoneAt));
    }
    if (picked.length === 0) return { kind: 'error', status: 409, message: 'This was already undone.' };

    const targets = picked.map(({ entry, index }) => ({ target: { entryId: entry.id, change: index } as UndoTarget, change: entry.changes[index] }));
    const result = undoChanges(loaded.state, targets, mode === 'keep_later' ? 'keep_later' : 'all');

    // Conflicts, as the later changes they would overwrite (design system: "Undo would overwrite 1 later change:").
    const first = picked[0];
    const exclude = new Set(picked.map(({ entry, index }) => `${entry.id}#${index}`));
    const isLater = (entry: HistoryEntry, index: number) => {
      const order = compareEntries(entry, first.entry);
      return order > 0 || (order === 0 && index > first.index);
    };
    const conflicts: UndoConflictOut[] = laterChangesFor(history, isLater, result.conflicts, exclude).map(({ entry, change }) => ({
      actor: entry.actor,
      client: entry.client,
      at: entry.at,
      text: change.text,
    }));
    // A conflict whose later change isn't in the history (older than 30 days): name the thing.
    if (result.conflicts.length > 0 && conflicts.length === 0) {
      for (const name of new Set(result.conflicts.map((x) => x.name))) conflicts.push({ actor: 'you', client: null, at: '', text: [{ b: name }, ' was changed later'] });
    }

    if (mode === 'check' || (mode === 'auto' && conflicts.length > 0)) {
      const byClient = new Map<string, number>();
      for (const { entry } of picked) {
        const name = entry.client ?? 'You';
        byClient.set(name, (byClient.get(name) ?? 0) + 1);
      }
      return {
        kind: 'check',
        applied: false,
        count: picked.length,
        conflicting: conflicts.length > 0 ? Math.max(1, result.conflicting) : 0,
        byClient: [...byClient].map(([client, count]) => ({ client, count })),
        conflicts,
      };
    }

    // The Undo is itself an entry, with its own Undo (= redo).
    const undone = 'entryId' in target ? byId.get(target.entryId)! : null;
    const at = new Date().toISOString();
    const text = undoText(target, first.entry, result.applied.length);
    const undoEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      at,
      ...who,
      kind: undone?.kind === 'undo' ? 'redo' : 'undo',
      text,
      changes: [{ text, icon: 'undo', diffs: diffStates(loaded.state, result.state) }],
      undoes: result.applied,
      undoable: true,
    };
    const touched = new Set<string>();
    for (const t of result.applied) setUndone(byId, t, true, undoEntry.id, at, touched);
    const statements = [insertEntryStatement(db, userId, undoEntry), ...[...touched].map((entryId) => updateEntryStatement(db, userId, byId.get(entryId)!))];
    try {
      const version = await saveState(db, userId, loaded.version, loaded.state, result.state, statements);
      return { kind: 'applied', applied: true, schemaVersion: CURRENT_SCHEMA_VERSION, version, state: result.state, rejected: [], text, count: result.applied.length };
    } catch (err) {
      if (err instanceof VersionConflict && attempt < 3) continue;
      throw err;
    }
  }
}

/** "Undid Claude's change from 14:02" · "Redid your change from 14:02" · "Undid 41 AI changes from Tue 21 Oct". */
function undoText(target: UndoRequestTarget, entry: HistoryEntry, count: number): RichPart[] {
  if ('day' in target) return ['Undid ', `${count === 1 ? '1 AI change' : `${count} AI changes`} from `, { date: target.day.from }];
  // Undoing an Undo: the same sentence with "Redid" (and back to "Undid" when undoing a redo).
  if (entry.kind === 'undo' || entry.kind === 'redo') {
    const [verb, ...rest] = entry.text;
    return [verb === 'Undid ' ? 'Redid ' : 'Undid ', ...rest];
  }
  const whose = entry.actor === 'ai' ? `${entry.client ?? 'AI'}'s` : 'your';
  return ['Undid ', `${whose} ${entry.kind === 'import' ? 'import' : 'change'} from `, { time: entry.at }];
}
