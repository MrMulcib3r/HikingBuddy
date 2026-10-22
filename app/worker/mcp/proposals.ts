/**
 * Proposals of changes (PRD v33/v38, FR-27, WidgetProposedChanges). For bigger changes the AI
 * first shows a proposal in the chat widget; the data changes only when the user confirms:
 * - `propose_changes` (model): checks every change with the same rules as the direct tools,
 *   stores the proposal (D1 `proposals`) and answers with the widget and a numbered text list.
 * - `decide_proposed_changes` (widget only, hidden from the model): Confirm of one row saves it
 *   at once as its own AI step (one Activity entry); "Confirm all" sends every undecided row
 *   without an FR-5 choice and saves them as ONE step; Reject only marks the row.
 * - `get_proposal` (widget only): the current state, for a chat opened again later.
 * A proposal is "out of date" when its gearlist (or the Vault items it touches) changed after it
 * was made by anything other than its own confirmed rows: then nothing more can be confirmed.
 */
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { linkedRowCount, type GearItemPatch } from '../../src/core/operations';
import { computeBreakdown, categoryNameFor } from '../../src/state/logic';
import { formatWeight } from '../../src/utils/weight';
import { newId } from '../../src/utils/id';
import { links, listsUsing, type DetailPart, type ProposalChangeView, type ProposalView } from '../../src/core/widgetViews';
import type { AppState, GearList } from '../../src/types';
import {
  fail,
  findItem,
  findList,
  findRow,
  grams,
  idIn,
  makeRunner,
  nameIn,
  noteIn,
  now,
  quantity,
  READ,
  Refusal,
  resolveCategory,
  Step,
  WRITE,
  type Answer,
  type ToolResult,
  type Who,
} from './step';
import { hashText } from './hash';
import { APP_ONLY_META, WIDGET_META } from './widget';

const reason = z.string().max(200).optional().describe('One short sentence for the user: why this change.');

const changeInput = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('add'),
    gear_item_id: idIn.describe('Gear Vault item to add to the gearlist (from get_gear_vault).'),
    quantity: quantity.min(1).optional(),
    worn: z.boolean().optional(),
    consumable: z.boolean().optional(),
    reason,
  }),
  z.object({ kind: z.literal('remove'), row_id: idIn.describe('Row to remove from the gearlist (it stays in Gear Vault).'), reason }),
  z.object({ kind: z.literal('delete_from_vault'), gear_item_id: idIn.describe('Gear Vault item to delete (soft delete, undoable).'), reason }),
  z.object({
    kind: z.literal('change_row'),
    row_id: idIn.describe('Row of this gearlist. These fields change only this row.'),
    quantity: quantity.min(1).optional(),
    worn: z.boolean().optional(),
    consumable: z.boolean().optional(),
    note: noteIn.optional(),
    category: z.string().max(200).optional().describe('Category name for this row in this gearlist only.'),
    reason,
  }),
  z.object({
    kind: z.literal('change_item'),
    gear_item_id: idIn.describe('Gear Vault item to edit. If other gearlists use it, the user chooses in the widget: create a copy or update everywhere.'),
    name: nameIn.optional(),
    weight_grams: grams.optional(),
    category: z.string().max(200).optional(),
    note: noteIn.optional(),
    reason,
  }),
]);
type ChangeInput = z.infer<typeof changeInput>;

type Choice = 'create_copy' | 'update_everywhere' | 'keep' | 'delete_everywhere';

interface StoredChange {
  id: string;
  input: ChangeInput;
  view: Omit<ProposalChangeView, 'status'>;
  status: ProposalChangeView['status'];
}

interface StoredProposal {
  id: string;
  listId: string;
  listName: string;
  createdAt: string;
  client: string;
  /** Fingerprint of the gearlist and the Vault items the proposal touches (see fingerprint()). */
  fingerprint: string;
  baseBefore: number;
  changes: StoredChange[];
}

// ---------------------------------------------------------------------------------------------
// One change on a step (the same rules as the direct tools)

/** Rows of `list` linked to the Vault item. */
const rowsOf = (list: GearList, gearItemId: string) => list.items.filter((r) => r.gearItemId === gearItemId);

/** Gearlists other than `list` that use the item (the delete rule counts gearlists only). */
const otherListsWith = (state: AppState, listId: string, gearItemId: string) => state.gearLists.filter((l) => l.id !== listId && l.items.some((r) => r.gearItemId === gearItemId));

/** Does this change need the user's FR-5 choice, and which gearlists does it concern? */
function choiceFor(state: AppState, list: GearList, c: ChangeInput): ProposalChangeView['choice'] {
  if (c.kind === 'delete_from_vault') {
    const others = otherListsWith(state, list.id, c.gear_item_id);
    return others.length > 0 ? { type: 'delete', lists: others.map((l) => l.name) } : null;
  }
  if (c.kind === 'change_item') {
    const item = findItem(state, c.gear_item_id);
    const core =
      (c.name !== undefined && c.name.trim() !== item.name) ||
      (c.weight_grams !== undefined && c.weight_grams !== item.weightGrams) ||
      (c.category !== undefined && resolveCategory(state, c.category) !== item.categoryId) ||
      (c.note !== undefined && c.note !== item.note);
    const elsewhere = linkedRowCount(state, item.id) - rowsOf(list, item.id).length > 0;
    return core && elsewhere ? { type: 'fr5', lists: listsUsing(state, item.id, list.id) } : null;
  }
  return null;
}

function applyChange(step: Step, listId: string, c: ChangeInput, choice?: Choice): void {
  const list = findList(step.state, listId);
  switch (c.kind) {
    case 'add': {
      const item = findItem(step.state, c.gear_item_id);
      step.push({ type: 'ADD_ITEM_TO_LIST', listId, gearItemId: item.id, quantity: c.quantity ?? item.defaultQuantity, rowId: newId('li') });
      const row = rowsOf(findList(step.state, listId), item.id)[0];
      const patch: { isWorn?: boolean; isConsumable?: boolean } = {};
      if (c.worn !== undefined) patch.isWorn = c.worn;
      if (c.consumable !== undefined) patch.isConsumable = c.consumable;
      if (row && Object.keys(patch).length > 0) step.push({ type: 'UPDATE_LIST_ITEM', listId, itemId: row.id, patch });
      return;
    }
    case 'remove': {
      const row = findRow(list, c.row_id);
      step.push({ type: 'REMOVE_LIST_ITEM', listId, itemId: row.id });
      return;
    }
    case 'delete_from_vault': {
      const item = findItem(step.state, c.gear_item_id);
      const others = otherListsWith(step.state, listId, item.id).length > 0;
      if (others && choice !== 'keep' && choice !== 'delete_everywhere') throw new Refusal(`"${item.name}" is used in other gearlists: choose Keep in gearlists or Delete everywhere.`);
      step.push({ type: 'DELETE_GEAR_ITEM', id: item.id, removeFromLists: !others || choice === 'delete_everywhere' });
      return;
    }
    case 'change_row': {
      const row = findRow(list, c.row_id);
      const patch: { quantity?: number; isWorn?: boolean; isConsumable?: boolean; note?: string } = {};
      if (c.quantity !== undefined) patch.quantity = c.quantity;
      if (c.worn !== undefined) patch.isWorn = c.worn;
      if (c.consumable !== undefined) patch.isConsumable = c.consumable;
      if (c.note !== undefined) patch.note = c.note;
      if (Object.keys(patch).length > 0) step.push({ type: 'UPDATE_LIST_ITEM', listId, itemId: row.id, patch });
      if (c.category !== undefined) {
        const categoryId = resolveCategory(step.state, c.category);
        step.push({ type: 'UPDATE_UNLINKED_LIST_ITEM', listId, itemId: row.id, patch: { categoryName: categoryNameFor(categoryId, step.state.categories) } });
      }
      return;
    }
    case 'change_item': {
      const item = findItem(step.state, c.gear_item_id);
      const patch: GearItemPatch = {
        name: c.name ?? item.name,
        categoryId: c.category === undefined ? item.categoryId : resolveCategory(step.state, c.category),
        weightGrams: c.weight_grams ?? item.weightGrams,
        defaultQuantity: item.defaultQuantity,
        note: c.note ?? item.note,
      };
      const needs = choiceFor(step.state, list, c);
      if (needs && choice !== 'create_copy' && choice !== 'update_everywhere') throw new Refusal(`"${item.name}" is used in other gearlists: choose Create a copy or Update everywhere.`);
      if (needs && choice === 'create_copy') {
        const row = rowsOf(list, item.id)[0];
        if (row) step.push({ type: 'COPY_AND_RELINK_LIST_ITEM', listId, itemId: row.id, newGearItemId: newId('gear'), item: patch });
        else step.push({ type: 'ADD_GEAR_ITEM', id: newId('gear'), item: patch });
        return;
      }
      step.push({ type: 'UPDATE_GEAR_ITEM', id: item.id, patch, choice: linkedRowCount(step.state, item.id) > 0 ? 'update_everywhere' : undefined });
      return;
    }
  }
}

/** The default answer for simulating a change that would need a choice (impact only). */
const simulatedChoice = (c: ChangeInput): Choice | undefined => (c.kind === 'delete_from_vault' ? 'delete_everywhere' : c.kind === 'change_item' ? 'update_everywhere' : undefined);

// ---------------------------------------------------------------------------------------------
// What the widget shows for a change (made once, when proposed)

function describe(state: AppState, list: GearList, c: ChangeInput): Omit<ProposalChangeView, 'id' | 'status' | 'reason' | 'choice'> {
  const w = (g: number) => formatWeight(g, state.unitPreference);
  const flags = (worn?: boolean, consumable?: boolean) =>
    [worn === true ? 'Worn' : worn === false ? 'Not worn' : '', consumable === true ? 'Consumable' : consumable === false ? 'Not consumable' : ''].filter(Boolean);
  switch (c.kind) {
    case 'add': {
      const item = findItem(state, c.gear_item_id);
      const qty = c.quantity ?? item.defaultQuantity;
      const existing = rowsOf(list, item.id)[0];
      const detail: DetailPart[] = existing
        ? ['Already in this gearlist: quantity ', { old: String(existing.quantity) }, ` → ${existing.quantity + qty}`]
        : [`${qty > 1 ? `${qty}× · ` : ''}From your Gear Vault, to ${categoryNameFor(item.categoryId, state.categories)}`];
      const f = flags(c.worn, c.consumable);
      if (f.length) detail.push(` · ${f.join(', ')}`);
      return { kind: 'add', name: item.name, grams: item.weightGrams * qty, detail };
    }
    case 'remove': {
      const row = findRow(list, c.row_id);
      return { kind: 'remove', name: row.name, grams: row.weightGrams * row.quantity, detail: ['From this gearlist; it stays in your Gear Vault'] };
    }
    case 'delete_from_vault': {
      const item = findItem(state, c.gear_item_id);
      return { kind: 'delete', name: item.name, grams: item.weightGrams, detail: ['From your Gear Vault (undoable in Activity for 30 days)'] };
    }
    case 'change_row': {
      const row = findRow(list, c.row_id);
      const parts: DetailPart[][] = [];
      if (c.quantity !== undefined && c.quantity !== row.quantity) parts.push(['Quantity ', { old: String(row.quantity) }, ` → ${c.quantity}`]);
      if (c.worn !== undefined && c.worn !== row.isWorn) parts.push([c.worn ? 'Mark as Worn' : 'Not worn']);
      if (c.consumable !== undefined && c.consumable !== row.isConsumable) parts.push([c.consumable ? 'Mark as Consumable' : 'Not consumable']);
      if (c.category !== undefined) parts.push([`To ${categoryNameFor(resolveCategory(state, c.category), state.categories)}`]);
      if (c.note !== undefined && c.note !== row.note) parts.push([c.note ? `Note: ${c.note}` : 'Remove the note']);
      return { kind: 'change', name: row.name, grams: row.weightGrams * (c.quantity ?? row.quantity), detail: join(parts) };
    }
    case 'change_item': {
      const item = findItem(state, c.gear_item_id);
      const parts: DetailPart[][] = [];
      if (c.name !== undefined && c.name.trim() !== item.name) parts.push(['Name ', { old: item.name }, ` → ${c.name.trim()}`]);
      if (c.weight_grams !== undefined && c.weight_grams !== item.weightGrams) parts.push(['Weight ', { old: w(item.weightGrams) }, ` → ${w(c.weight_grams)}`]);
      if (c.category !== undefined) {
        const to = resolveCategory(state, c.category);
        if (to !== item.categoryId) parts.push(['Category ', { old: categoryNameFor(item.categoryId, state.categories) }, ` → ${categoryNameFor(to, state.categories)}`]);
      }
      if (c.note !== undefined && c.note !== item.note) parts.push([c.note ? `Note: ${c.note}` : 'Remove the note']);
      return { kind: 'change', name: item.name, grams: c.weight_grams ?? item.weightGrams, detail: join(parts) };
    }
  }
}

function join(parts: DetailPart[][]): DetailPart[] {
  return parts.flatMap((p, i) => (i === 0 ? p : ['; ', ...p]));
}

/** Short text of one change for the model and clients without widgets. */
function changeLine(v: Omit<ProposalChangeView, 'status'>, unit: AppState['unitPreference'], status?: ProposalChangeView['status']): string {
  const kind = { add: 'Add', remove: 'Remove', delete: 'Delete from Gear Vault', change: 'Change' }[v.kind];
  const detail = v.detail.map((p) => (typeof p === 'string' ? p : p.old)).join('');
  const choice = v.choice ? ` [needs the user's choice: ${v.choice.type === 'fr5' ? 'create a copy or update everywhere' : 'keep in or delete from'} ${v.choice.lists.join(', ')}]` : '';
  return `${kind} ${v.name} (${formatWeight(v.grams, unit)})${detail ? `: ${detail}` : ''}${v.reason ? ` · ${v.reason}` : ''}${choice}${status && status !== 'open' ? ` · ${status}` : ''}`;
}

// ---------------------------------------------------------------------------------------------
// Fingerprint, view, storage

function fingerprint(state: AppState, p: Pick<StoredProposal, 'listId' | 'changes'>): string {
  const list = state.gearLists.find((l) => l.id === p.listId) ?? state.templates.find((t) => t.id === p.listId);
  if (!list) return 'gone';
  const ids = new Set(p.changes.flatMap((c) => ('gear_item_id' in c.input ? [c.input.gear_item_id] : [])));
  for (const row of list.items) if (row.gearItemId) ids.add(row.gearItemId);
  const items = state.gearItems.filter((g) => ids.has(g.id)).sort((a, b) => a.id.localeCompare(b.id));
  const rows = [...list.items].sort((a, b) => a.id.localeCompare(b.id));
  return hashText(JSON.stringify({ name: list.name, rows, items, uses: items.map((g) => linkedRowCount(state, g.id)) }));
}

/** Base weight of the gearlist with every open change applied (best effort; for the impact line). */
function baseWithOpen(state: AppState, p: StoredProposal): number {
  const step = new Step(state);
  for (const c of p.changes) {
    if (c.status !== 'open') continue;
    try {
      applyChange(step, p.listId, c.input, simulatedChoice(c.input));
    } catch {
      // A change that no longer applies just doesn't count in the impact.
    }
  }
  const list = step.state.gearLists.find((l) => l.id === p.listId) ?? step.state.templates.find((t) => t.id === p.listId);
  return list ? computeBreakdown(list.items).base : 0;
}

function proposalView(state: AppState, p: StoredProposal, origin: string): ProposalView {
  const open = p.changes.some((c) => c.status === 'open');
  const stale = open && fingerprint(state, p) !== p.fingerprint;
  return {
    view: 'proposal',
    unit: state.unitPreference,
    link: links.gearlist(origin, p.listId),
    id: p.id,
    listName: p.listName,
    status: !open ? 'done' : stale ? 'stale' : 'open',
    impact: { before: p.baseBefore, after: stale ? p.baseBefore : baseWithOpen(state, p) },
    changes: p.changes.map((c) => ({ ...c.view, status: c.status })),
  };
}

async function loadProposal(db: D1Database, userId: string, id: string): Promise<StoredProposal | null> {
  const row = await db.prepare('SELECT proposal_json FROM proposals WHERE user_id = ? AND id = ?').bind(userId, id).first<{ proposal_json: string }>();
  return row ? (JSON.parse(row.proposal_json) as StoredProposal) : null;
}

const saveStatement = (db: D1Database, userId: string, p: StoredProposal) =>
  db.prepare('UPDATE proposals SET proposal_json = ? WHERE user_id = ? AND id = ?').bind(JSON.stringify(p), userId, p.id);

// ---------------------------------------------------------------------------------------------
// Tools

export function registerProposalTools(server: McpServer, db: D1Database, userId: string, who: Who, origin: string) {
  const { change, read } = makeRunner(db, userId, who);

  server.registerTool(
    'propose_changes',
    {
      title: 'Propose changes',
      description:
        "Shows the user a proposal of several changes to one existing gearlist (and the Gear Vault items in it) with Confirm / Reject buttons in a HikingBuddy widget. NOTHING is saved by this tool: each change is saved only when the user confirms it in the widget. Use it instead of the direct tools whenever you want to change 2 or more things in an existing gearlist or Gear Vault at once (e.g. \"make my pack lighter\", \"prepare it for rain\"). Give each change a one-sentence reason. Don't make the same changes with the direct tools afterwards. If the user says they see no buttons (their app doesn't show widgets), ask them in the chat which changes to make and make those with the direct tools. A new gearlist doesn't need a proposal: use create_gearlist. Vault items used in other gearlists need the user's choice (copy / everywhere); the widget asks for it.",
      inputSchema: z.object({
        list_id: idIn.describe('The gearlist (or template) the proposal is for, from list_gearlists.'),
        changes: z.array(changeInput).min(1).max(50),
      }),
      annotations: READ,
      _meta: WIDGET_META,
    },
    async ({ list_id, changes }) =>
      read(async (state) => {
        const list = findList(state, list_id);
        // Check every change, one after another, with the same rules as the direct tools.
        const step = new Step(state);
        const stored: StoredChange[] = changes.map((input, i) => {
          try {
            const listNow = findList(step.state, list.id);
            const view = { id: `c${i + 1}`, ...describe(step.state, listNow, input), reason: input.reason?.trim() ?? '', choice: choiceFor(step.state, listNow, input) };
            applyChange(step, list.id, input, simulatedChoice(input));
            return { id: view.id, input, view, status: 'open' };
          } catch (err) {
            if (err instanceof Refusal) throw new Refusal(`Change ${i + 1}: ${err.message}`);
            throw err;
          }
        });
        const p: StoredProposal = {
          id: newId('prop'),
          listId: list.id,
          listName: list.name,
          createdAt: now(),
          client: who.client,
          fingerprint: '',
          baseBefore: computeBreakdown(list.items).base,
          changes: stored,
        };
        p.fingerprint = fingerprint(state, p);
        await db.prepare('INSERT INTO proposals (user_id, id, created_at, proposal_json) VALUES (?, ?, ?, ?)').bind(userId, p.id, p.createdAt, JSON.stringify(p)).run();
        const view = proposalView(state, p, origin);
        const unit = state.unitPreference;
        const text = [
          `Proposal ${p.id} for "${list.name}": ${stored.length} change${stored.length === 1 ? '' : 's'}, nothing saved yet. Base weight ${formatWeight(view.impact.before, unit)} → ${formatWeight(view.impact.after, unit)} if all are confirmed.`,
          ...stored.map((c, i) => `${i + 1}. ${changeLine(c.view, unit)}`),
          '',
          'The user confirms or rejects each change in the HikingBuddy widget; confirmed changes are saved at once and appear in Activity. Tell the user briefly what you propose and that they can confirm it in the widget. If they cannot see the widget, ask which numbers to make and make them with the direct tools.',
        ].join('\n');
        return { text, view } satisfies Answer;
      })
  );

  server.registerTool(
    'get_proposal',
    {
      title: 'Get a proposal',
      description: 'Widget only: the current state of a proposal (which rows are confirmed or rejected, out of date).',
      inputSchema: z.object({ proposal_id: idIn }),
      annotations: READ,
      _meta: APP_ONLY_META,
    },
    async ({ proposal_id }) =>
      read(async (state) => {
        const p = await loadProposal(db, userId, proposal_id);
        if (!p) throw new Refusal('This proposal no longer exists (proposals are kept 30 days).');
        return { text: proposalText(state, p), view: proposalView(state, p, origin) };
      })
  );

  server.registerTool(
    'decide_proposed_changes',
    {
      title: 'Confirm or reject proposed changes',
      description:
        "Widget only: the user's decisions on a proposal. confirm / create_copy / update_everywhere / keep / delete_everywhere save those changes as one step; reject marks a row as rejected; reopen undoes a rejection.",
      inputSchema: z.object({
        proposal_id: idIn,
        decisions: z
          .array(
            z.object({
              change_id: z.string().min(1).max(20),
              decision: z.enum(['confirm', 'create_copy', 'update_everywhere', 'keep', 'delete_everywhere', 'reject', 'reopen']),
            })
          )
          .min(1)
          .max(50),
      }),
      annotations: WRITE,
      _meta: APP_ONLY_META,
    },
    async ({ proposal_id, decisions }): Promise<ToolResult> => {
      const p = await loadProposal(db, userId, proposal_id);
      if (!p) return fail('This proposal no longer exists (proposals are kept 30 days).');
      const byId = new Map(p.changes.map((c) => [c.id, c]));
      for (const d of decisions) {
        const c = byId.get(d.change_id);
        if (!c) return fail(`No change "${d.change_id}" in this proposal.`);
        if (d.decision === 'reopen' ? c.status !== 'rejected' : c.status !== 'open') return fail(`"${c.view.name}" is already ${c.status}.`);
        if (d.decision === 'confirm' && c.view.choice) return fail(`"${c.view.name}" needs a choice, not a plain Confirm.`);
      }
      const marks = decisions.filter((d) => d.decision === 'reject' || d.decision === 'reopen');
      for (const d of marks) byId.get(d.change_id)!.status = d.decision === 'reject' ? 'rejected' : 'open';
      const confirms = decisions.filter((d) => d.decision !== 'reject' && d.decision !== 'reopen');

      if (confirms.length === 0) {
        await saveStatement(db, userId, p).run();
        return read((state) => ({ text: proposalText(state, p), view: proposalView(state, p, origin) }));
      }

      // Confirmed rows: one AI step (one Activity entry), all or nothing.
      return change(
        (step) => {
          if (fingerprint(step.state, p) !== p.fingerprint) {
            throw new Refusal(`"${p.listName}" changed after this proposal was made. Ask for a new proposal.`);
          }
          for (const d of confirms) {
            const c = byId.get(d.change_id)!;
            try {
              applyChange(step, p.listId, c.input, d.decision === 'confirm' ? undefined : (d.decision as Choice));
            } catch (err) {
              if (err instanceof Refusal) throw new Refusal(`${c.view.name}: ${err.message}`);
              throw err;
            }
            c.status = 'confirmed';
          }
          return (after) => {
            p.fingerprint = fingerprint(after, p);
            return { text: proposalText(after, p), view: proposalView(after, p, origin) };
          };
        },
        // Saved in the same transaction as the change. A copy: on a retry the check above must
        // still compare with the fingerprint from before this step.
        { extra: (after) => [saveStatement(db, userId, { ...p, fingerprint: fingerprint(after, p) })] }
      );
    }
  );
}

function proposalText(state: AppState, p: StoredProposal): string {
  const unit = state.unitPreference;
  const confirmed = p.changes.filter((c) => c.status === 'confirmed').length;
  const rejected = p.changes.filter((c) => c.status === 'rejected').length;
  return [
    `Proposal ${p.id} for "${p.listName}": ${confirmed} confirmed, ${rejected} rejected, ${p.changes.length - confirmed - rejected} open.`,
    ...p.changes.map((c, i) => `${i + 1}. ${changeLine(c.view, unit, c.status)}`),
  ].join('\n');
}

