/**
 * The building blocks of an MCP tool (PRD v33, FR-26/27), shared by tools.ts and proposals.ts:
 * one AI step on a working copy of the data, lookups whose messages the model can act on, and
 * the answer (readable text, plus the widget view for MCP Apps clients).
 */
import { z } from 'zod';
import { applyOperation, LIMITS, OperationError, type Operation } from '../../src/core/operations';
import { entryFromGroup, recordOperations } from '../../src/core/history';
import { stateView, type WidgetView } from '../../src/core/widgetViews';
import { UNCATEGORIZED, type AppState, type GearList } from '../../src/types';
import { isDailyLimitError, loadState } from '../db';
import { saveWithRetry } from '../save';
import { categoryList, isTemplate } from './text';

export type ToolResult = { content: { type: 'text'; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean };

/** What a tool says: text for the model (and clients without widgets), optionally a widget view. */
export type Answer = string | { text: string; view?: WidgetView };

export function ok(answer: Answer): ToolResult {
  if (typeof answer === 'string') return { content: [{ type: 'text', text: answer }] };
  const result: ToolResult = { content: [{ type: 'text', text: answer.text }] };
  if (answer.view) result.structuredContent = answer.view as unknown as Record<string, unknown>;
  return result;
}

export function fail(text: string, view?: WidgetView): ToolResult {
  return { ...ok({ text, view }), isError: true };
}

/** A tool refuses the step without changing anything. */
export class Refusal extends Error {}

/** The operations of one AI step, built on a working copy so later ops can see earlier ones
 * (e.g. the row a just-added item landed in). */
export class Step {
  ops: Operation[] = [];
  state: AppState;
  constructor(state: AppState) {
    this.state = state;
  }
  push(op: Operation) {
    this.state = applyOperation(this.state, op);
    this.ops.push(op);
  }
}

export const now = () => new Date().toISOString();
export const norm = (s: string) => s.trim().toLowerCase();

// ---------------------------------------------------------------------------------------------
// Input shapes and tool annotations

export const grams = z.number().min(0).max(LIMITS.maxWeightGrams);
export const quantity = z.number().int().min(0).max(LIMITS.maxQuantity);
export const nameIn = z.string().trim().min(1).max(LIMITS.nameLength);
export const noteIn = z.string().max(LIMITS.noteLength);
export const idIn = z.string().min(1).max(LIMITS.idLength);

export const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
export const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
export const DELETE = { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false };

// ---------------------------------------------------------------------------------------------
// Lookups with messages the model can act on

export function findList(state: AppState, listId: string, allowTemplate = true): GearList {
  const list = state.gearLists.find((l) => l.id === listId) ?? (allowTemplate ? state.templates.find((t) => t.id === listId) : undefined);
  if (list) return list;
  if (!allowTemplate && isTemplate(state, listId)) throw new Refusal('This is the template, not a gearlist. This action works only on gearlists.');
  throw new Refusal(`No gearlist with id "${listId}". Call list_gearlists for the current ids.`);
}

export function findItem(state: AppState, itemId: string) {
  const item = state.gearItems.find((g) => g.id === itemId);
  if (!item) throw new Refusal(`No Gear Vault item with id "${itemId}". Call get_gear_vault for the current ids.`);
  return item;
}

/** A category by id or name (case-insensitive). "Uncategorized" = no category. */
export function resolveCategory(state: AppState, ref: string): string | null {
  if (norm(ref) === norm(UNCATEGORIZED)) return null;
  const cat = state.categories.find((c) => c.id === ref) ?? state.categories.find((c) => norm(c.name) === norm(ref));
  if (!cat) throw new Refusal(`No category "${ref}". Existing categories: ${categoryList(state)}. Use one of them, or create a new one with add_category (ask the user first).`);
  return cat.id;
}

export function findRow(list: GearList, rowId: string) {
  const row = list.items.find((i) => i.id === rowId);
  if (!row) throw new Refusal(`No row with id "${rowId}" in "${list.name}". Call get_gearlist for the current row ids.`);
  return row;
}

// ---------------------------------------------------------------------------------------------
// Running a tool

export interface Who {
  actor: 'ai';
  client: string;
}

export interface ChangeOptions {
  /** More statements for the same transaction, given the data after the step. */
  extra?: (after: AppState) => D1PreparedStatement[];
}

/** A daily-limit or server error as a tool answer (WidgetStates), instead of a thrown error. */
function failure(err: unknown, unit: AppState['unitPreference']): ToolResult {
  if (isDailyLimitError(err)) return fail("HikingBuddy reached today's free limit, try again tomorrow. Nothing was changed.", stateView('limit', unit));
  console.error(err);
  return fail("Couldn't reach HikingBuddy. Nothing was changed. Try again in a moment.", stateView('error', unit));
}

export function makeRunner(db: D1Database, userId: string, who: Who) {
  /** Runs one AI step: builds the operations on the current data, saves them with one history
   * entry, and answers with `done(after)`. Nothing is saved when a rule refuses the step. */
  async function change(build: (step: Step) => (after: AppState) => Answer, options: ChangeOptions = {}): Promise<ToolResult> {
    let refused: string | null = null;
    let done: ((after: AppState) => Answer) | null = null;
    let unit: AppState['unitPreference'] = 'metric';
    try {
      const result = await saveWithRetry(db, userId, (state) => {
        refused = null;
        unit = state.unitPreference;
        const step = new Step(state);
        try {
          done = build(step);
        } catch (err) {
          if (err instanceof Refusal || err instanceof OperationError) {
            refused = err.message;
            return { state, rejected: [] };
          }
          throw err;
        }
        if (step.ops.length === 0) return { state, rejected: [] };
        const action = crypto.randomUUID();
        const recorded = recordOperations(state, step.ops, step.ops.map(() => action));
        if (recorded.rejected.length > 0) {
          refused = recorded.rejected[0].error.message;
          return { state, rejected: [] };
        }
        const at = now();
        const entries = recorded.groups.map((group, i) => entryFromGroup(group, { id: crypto.randomUUID(), at: i === 0 ? at : new Date(Date.parse(at) + i).toISOString(), ...who }));
        return { state: recorded.state, rejected: [], entries, extra: options.extra?.(recorded.state) };
      });
      if (refused !== null) return fail(`Nothing was changed. ${refused}`);
      return ok((done as unknown as (after: AppState) => Answer)(result.state));
    } catch (err) {
      return failure(err, unit);
    }
  }

  async function read(fn: (state: AppState) => Answer | Promise<Answer>): Promise<ToolResult> {
    let unit: AppState['unitPreference'] = 'metric';
    try {
      const { state } = await loadState(db, userId);
      unit = state.unitPreference;
      return ok(await fn(state));
    } catch (err) {
      if (err instanceof Refusal) return fail(err.message);
      return failure(err, unit);
    }
  }

  return { change, read };
}
