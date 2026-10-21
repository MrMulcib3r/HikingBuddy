/**
 * HikingBuddy MCP server (PRD v33, FR-26): the tools a connected AI client (Claude, ChatGPT…)
 * uses to read and change the signed-in user's gear. Every change goes through the same
 * operations layer as the web (src/core/operations.ts), so the PRD rules are the same:
 * - FR-5: a Vault item used in gearlists / the template changes only with an explicit
 *   `create_copy` or `update_everywhere` (the web's Cancel / Create a copy / Continue dialog);
 *   without it nothing changes and the tool names the affected gearlists.
 * - Overwriting a snapshot or replacing the template needs an explicit confirmation parameter.
 * - Adding an item that is already in a gearlist raises its quantity (FR-4).
 * - Deleting is soft and undoable (FR-25).
 * One tool call = one AI step = one entry in Activity ("AI · Claude") with one Undo.
 */
import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { applyOperation, LIMITS, linkedRowCount, OperationError, type GearItemPatch, type Operation } from '../../src/core/operations';
import { entryFromGroup, entryUndoneAt, recordOperations } from '../../src/core/history';
import { categoryNameFor } from '../../src/state/logic';
import { formatWeight } from '../../src/utils/weight';
import { newId } from '../../src/utils/id';
import { UNCATEGORIZED, type AppState, type GearList } from '../../src/types';
import { loadHistory, loadState } from '../db';
import { saveWithRetry } from '../save';
import { runUndo } from '../undo';
import type { Env, McpProps } from '../env';
import { categoryList, gearlistsText, gearlistText, isTemplate, richText, usageText, vaultText } from './text';

const INSTRUCTIONS = `HikingBuddy is the user's personal hiking gear planner. Gear Vault = the gear the user owns. Gearlists = per-trip packing lists built from Gear Vault items, with Base / Consumables / Worn / Total weights.
Rules:
- Read before you write: call get_gear_vault (and list_gearlists / get_gearlist) first and use the ids it returns.
- Never invent gear. Gearlists can only contain items from the user's Gear Vault. If something is missing, tell the user and ask before adding it with add_gear_items.
- Weights in inputs are always grams per piece. Answers show the user's own units.
- When a tool answers that a choice or confirmation is needed (FR-5 create_copy / update_everywhere, overwriting a snapshot, replacing the template), ask the user and call again with their answer. Never pick it yourself.
- Every change appears in the user's Activity panel in the HikingBuddy web app and can be undone there; undo_last_ai_step undoes your own last change.`;

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };
const ok = (text: string): ToolResult => ({ content: [{ type: 'text', text }] });
const fail = (text: string): ToolResult => ({ content: [{ type: 'text', text }], isError: true });

/** A tool refuses the step without changing anything. */
class Refusal extends Error {}

/** The operations of one AI step, built on a working copy so later ops can see earlier ones
 * (e.g. the row a just-added item landed in). */
class Step {
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

const now = () => new Date().toISOString();
const norm = (s: string) => s.trim().toLowerCase();

// ---------------------------------------------------------------------------------------------
// Lookups with messages the model can act on

function findList(state: AppState, listId: string, allowTemplate = true): GearList {
  const list = state.gearLists.find((l) => l.id === listId) ?? (allowTemplate ? state.templates.find((t) => t.id === listId) : undefined);
  if (list) return list;
  if (!allowTemplate && isTemplate(state, listId)) throw new Refusal('This is the template, not a gearlist. This action works only on gearlists.');
  throw new Refusal(`No gearlist with id "${listId}". Call list_gearlists for the current ids.`);
}

function findItem(state: AppState, itemId: string) {
  const item = state.gearItems.find((g) => g.id === itemId);
  if (!item) throw new Refusal(`No Gear Vault item with id "${itemId}". Call get_gear_vault for the current ids.`);
  return item;
}

/** A category by id or name (case-insensitive). "Uncategorized" = no category. */
function resolveCategory(state: AppState, ref: string): string | null {
  if (norm(ref) === norm(UNCATEGORIZED)) return null;
  const cat = state.categories.find((c) => c.id === ref) ?? state.categories.find((c) => norm(c.name) === norm(ref));
  if (!cat) throw new Refusal(`No category "${ref}". Existing categories: ${categoryList(state)}. Use one of them, or create a new one with add_category (ask the user first).`);
  return cat.id;
}

function findRow(list: GearList, rowId: string) {
  const row = list.items.find((i) => i.id === rowId);
  if (!row) throw new Refusal(`No row with id "${rowId}" in "${list.name}". Call get_gearlist for the current row ids.`);
  return row;
}

// ---------------------------------------------------------------------------------------------
// Input shapes

const grams = z.number().min(0).max(LIMITS.maxWeightGrams);
const quantity = z.number().int().min(0).max(LIMITS.maxQuantity);
const nameIn = z.string().trim().min(1).max(LIMITS.nameLength);
const noteIn = z.string().max(LIMITS.noteLength);
const idIn = z.string().min(1).max(LIMITS.idLength);

const listItemInput = z.object({
  gear_item_id: idIn.describe('Id of an item that exists in Gear Vault (from get_gear_vault).'),
  quantity: quantity.min(1).optional().describe("How many. Defaults to the item's default quantity."),
  worn: z.boolean().optional().describe('Worn on the body, not carried in the pack (e.g. boots, clothes you hike in).'),
  consumable: z.boolean().optional().describe('Used up on the trip (food, water, fuel). Items from the Food category are consumable by default.'),
  note: noteIn.optional().describe('Note for this row in this gearlist only.'),
});

const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
const DELETE = { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false };

/** "AI · Claude" in Activity. Clients register under various names ("claude.ai", "Claude"). */
export function friendlyClientName(name: string | undefined): string {
  const n = (name ?? '').trim();
  if (/claude/i.test(n)) return 'Claude';
  if (/chatgpt|openai/i.test(n)) return 'ChatGPT';
  return n.slice(0, 60) || 'AI app';
}

export function createServer(env: Env, props: McpProps): McpServer {
  const server = new McpServer({ name: 'HikingBuddy', version: '1.0.0' }, { instructions: INSTRUCTIONS });
  const db = env.DB;
  const { userId } = props;
  const who = { actor: 'ai' as const, client: props.clientName };

  /** Runs one AI step: builds the operations on the current data, saves them with one history
   * entry, and answers with `done(after)`. Nothing is saved when a rule refuses the step. */
  async function change(build: (step: Step) => (after: AppState) => string): Promise<ToolResult> {
    let refused: string | null = null;
    let done: ((after: AppState) => string) | null = null;
    const result = await saveWithRetry(db, userId, (state) => {
      refused = null;
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
      return { state: recorded.state, rejected: [], entries };
    });
    if (refused !== null) return fail(`Nothing was changed. ${refused}`);
    return ok((done as unknown as (after: AppState) => string)(result.state));
  }

  async function read(fn: (state: AppState) => string): Promise<ToolResult> {
    const { state } = await loadState(db, userId);
    try {
      return ok(fn(state));
    } catch (err) {
      if (err instanceof Refusal) return fail(err.message);
      throw err;
    }
  }

  const w = (state: AppState, g: number) => formatWeight(g, state.unitPreference);

  // -------------------------------------------------------------------------------------------
  // Reading

  server.registerTool(
    'get_gear_vault',
    {
      title: 'Get Gear Vault',
      description:
        "Lists the user's Gear Vault: every piece of gear they own, grouped by category, with weight per piece, default quantity, note, where it is used, and its id. Call this before building or changing a gearlist, and only use gear from this list. Optional filters: text search and category.",
      inputSchema: z.object({
        query: z.string().max(200).optional().describe('Only items whose name or note contains this text.'),
        category: z.string().max(200).optional().describe('Only items in this category (name or id).'),
      }),
      annotations: READ,
    },
    async ({ query, category }) => read((state) => vaultText(state, { query, categoryId: category === undefined ? undefined : resolveCategory(state, category) }))
  );

  server.registerTool(
    'list_gearlists',
    {
      title: 'List gearlists',
      description: "Lists the user's gearlists (trip packing lists) and the template, with ids, number of rows, base and total weight, and snapshot date.",
      inputSchema: z.object({}),
      annotations: READ,
    },
    async () => read((state) => gearlistsText(state))
  );

  server.registerTool(
    'get_gearlist',
    {
      title: 'Get gearlist',
      description:
        'Shows one gearlist (or the template) row by row, grouped by category: quantity, weight, worn / consumable flags, note, row id and Gear Vault id, plus the Base / Consumables / Worn / Total breakdown and pack class. view="snapshot" shows the saved read-only snapshot instead.',
      inputSchema: z.object({
        list_id: idIn.describe('Gearlist or template id (from list_gearlists).'),
        view: z.enum(['current', 'snapshot']).optional().describe('"current" (default) or the saved "snapshot".'),
      }),
      annotations: READ,
    },
    async ({ list_id, view }) => read((state) => gearlistText(state, findList(state, list_id), view ?? 'current'))
  );

  // -------------------------------------------------------------------------------------------
  // Gear Vault and categories

  server.registerTool(
    'add_gear_items',
    {
      title: 'Add gear to Gear Vault',
      description:
        "Adds new gear the user owns to Gear Vault (1–50 items in one step). Only add gear the user said they own. Weight is in grams per piece. An item whose name already exists in Gear Vault is skipped (its id is returned) unless allow_duplicate_names is true. Returns the new ids.",
      inputSchema: z.object({
        items: z
          .array(
            z.object({
              name: nameIn,
              category: z.string().max(200).describe('Existing category name or id (see get_gear_vault). "Uncategorized" for none.'),
              weight_grams: grams.describe('Weight of one piece in grams.'),
              default_quantity: quantity.min(1).optional().describe('How many usually go into a gearlist. Default 1.'),
              note: noteIn.optional(),
            })
          )
          .min(1)
          .max(50),
        allow_duplicate_names: z.boolean().optional(),
      }),
      annotations: WRITE,
    },
    async ({ items, allow_duplicate_names }) =>
      change((step) => {
        const added: string[] = [];
        const skipped: string[] = [];
        for (const input of items) {
          const existing = step.state.gearItems.find((g) => norm(g.name) === norm(input.name));
          if (existing && !allow_duplicate_names) {
            skipped.push(`${existing.name} (already in Gear Vault, id ${existing.id})`);
            continue;
          }
          const id = newId('gear');
          const item: GearItemPatch = {
            name: input.name,
            categoryId: resolveCategory(step.state, input.category),
            weightGrams: input.weight_grams,
            defaultQuantity: input.default_quantity ?? 1,
            note: input.note ?? '',
          };
          step.push({ type: 'ADD_GEAR_ITEM', id, item });
          added.push(`${input.name} · ${formatWeight(input.weight_grams, step.state.unitPreference)} · ${categoryNameFor(item.categoryId, step.state.categories)} · id ${id}`);
        }
        return () =>
          [added.length ? `Added to Gear Vault:\n${added.map((a) => `- ${a}`).join('\n')}` : 'Nothing added.', skipped.length ? `Skipped:\n${skipped.map((s) => `- ${s}`).join('\n')}` : '']
            .filter(Boolean)
            .join('\n\n');
      })
  );

  server.registerTool(
    'update_gear_item',
    {
      title: 'Edit a Gear Vault item',
      description:
        'Changes a Gear Vault item: name, category, weight per piece, default quantity, note. If the item is used in gearlists or the template, changing name, category, weight or note needs the user\'s choice in if_used_elsewhere: "update_everywhere" (the gearlists using it change too) or "create_copy" (a new Vault item with the new values; existing gearlists keep the old one). Without it nothing changes and the answer names the affected gearlists: ask the user, then call again. Snapshots never change.',
      inputSchema: z.object({
        item_id: idIn,
        name: nameIn.optional(),
        category: z.string().max(200).optional().describe('Category name or id; "Uncategorized" for none.'),
        weight_grams: grams.optional(),
        default_quantity: quantity.min(1).optional(),
        note: noteIn.optional(),
        if_used_elsewhere: z.enum(['create_copy', 'update_everywhere']).optional().describe("The user's answer when the item is used in gearlists or the template."),
      }),
      annotations: WRITE,
    },
    async (input) =>
      change((step) => {
        const item = findItem(step.state, input.item_id);
        const patch: GearItemPatch = {
          name: input.name ?? item.name,
          categoryId: input.category === undefined ? item.categoryId : resolveCategory(step.state, input.category),
          weightGrams: input.weight_grams ?? item.weightGrams,
          defaultQuantity: input.default_quantity ?? item.defaultQuantity,
          note: input.note ?? item.note,
        };
        const core = patch.name.trim() !== item.name || patch.categoryId !== item.categoryId || patch.weightGrams !== item.weightGrams || patch.note !== item.note;
        const used = linkedRowCount(step.state, item.id) > 0;
        if (core && used && !input.if_used_elsewhere) {
          throw new Refusal(
            `"${item.name}" is used in ${usageText(step.state, item.id)}. Ask the user: update it everywhere (those gearlists change too: if_used_elsewhere="update_everywhere") or create a copy with the new values (those gearlists keep the old item: if_used_elsewhere="create_copy").`
          );
        }
        if (core && used && input.if_used_elsewhere === 'create_copy') {
          const id = newId('gear');
          step.push({ type: 'ADD_GEAR_ITEM', id, item: patch });
          return (after) => `Created a copy "${patch.name}" (id ${id}, ${w(after, patch.weightGrams)}) in Gear Vault. "${item.name}" and the gearlists using it are unchanged.`;
        }
        step.push({ type: 'UPDATE_GEAR_ITEM', id: item.id, patch, choice: used ? 'update_everywhere' : undefined });
        return (after) => {
          const now = findItem(after, item.id);
          const where = used && core ? ` Also updated in ${usageText(after, item.id)}.` : '';
          return `Updated "${now.name}": ${w(after, now.weightGrams)}, ${categoryNameFor(now.categoryId, after.categories)}, default qty ${now.defaultQuantity}${now.note ? `, note "${now.note}"` : ''}.${where}`;
        };
      })
  );

  server.registerTool(
    'delete_gear_item',
    {
      title: 'Delete a Gear Vault item',
      description:
        'Deletes an item from Gear Vault (soft delete: the user can undo it in Activity for 30 days). If gearlists use it, the user must choose in_gearlists: "keep" (rows stay in the gearlists as custom entries) or "delete_everywhere" (removed from those gearlists too). Without it nothing is deleted and the answer names the gearlists: ask the user. The template always loses the item.',
      inputSchema: z.object({
        item_id: idIn,
        in_gearlists: z.enum(['keep', 'delete_everywhere']).optional(),
      }),
      annotations: DELETE,
    },
    async ({ item_id, in_gearlists }) =>
      change((step) => {
        const item = findItem(step.state, item_id);
        const usedInLists = step.state.gearLists.some((l) => l.items.some((i) => i.gearItemId === item.id));
        if (usedInLists && !in_gearlists) {
          throw new Refusal(
            `"${item.name}" is used in ${usageText(step.state, item.id)}. Ask the user: keep it in those gearlists as a custom entry (in_gearlists="keep") or delete it everywhere (in_gearlists="delete_everywhere").`
          );
        }
        const where = usageText(step.state, item.id);
        step.push({ type: 'DELETE_GEAR_ITEM', id: item.id, removeFromLists: in_gearlists === 'delete_everywhere' });
        return () =>
          `Deleted "${item.name}" from Gear Vault${where ? (in_gearlists === 'delete_everywhere' ? ` and from ${where}` : ` (kept in ${where} as a custom entry)`) : ''}. The user can undo this in Activity.`;
      })
  );

  server.registerTool(
    'add_category',
    {
      title: 'Add a category',
      description: 'Creates a new Gear Vault category. Returns its id. If a category with this name exists, nothing is created and its id is returned.',
      inputSchema: z.object({ name: nameIn }),
      annotations: WRITE,
    },
    async ({ name }) =>
      change((step) => {
        const existing = step.state.categories.find((c) => norm(c.name) === norm(name));
        if (existing) return () => `Category "${existing.name}" already exists (id ${existing.id}).`;
        const id = newId('cat');
        step.push({ type: 'ADD_CATEGORY', id, name });
        return () => `Added category "${name.trim()}" (id ${id}).`;
      })
  );

  server.registerTool(
    'rename_category',
    {
      title: 'Rename a category',
      description: 'Renames a category everywhere: Gear Vault and the gearlist rows in it. Snapshots keep the old name.',
      inputSchema: z.object({ category: z.string().max(200).describe('Category name or id.'), new_name: nameIn }),
      annotations: WRITE,
    },
    async ({ category, new_name }) =>
      change((step) => {
        const id = resolveCategory(step.state, category);
        if (id === null) throw new Refusal('"Uncategorized" is not a category and cannot be renamed.');
        const old = step.state.categories.find((c) => c.id === id)!.name;
        step.push({ type: 'RENAME_CATEGORY', id, name: new_name });
        return () => `Renamed category "${old}" to "${new_name.trim()}".`;
      })
  );

  server.registerTool(
    'delete_category',
    {
      title: 'Delete a category',
      description: 'Deletes a category the user created. Its items stay in Gear Vault as "Uncategorized". The default categories (Backpack, Shelter System, Sleep System, Clothing, Cooking, Food, Water, Electronics, Hygiene, Misc) can be renamed but not deleted.',
      inputSchema: z.object({ category: z.string().max(200).describe('Category name or id.') }),
      annotations: DELETE,
    },
    async ({ category }) =>
      change((step) => {
        const id = resolveCategory(step.state, category);
        if (id === null) throw new Refusal('"Uncategorized" is not a category.');
        const cat = step.state.categories.find((c) => c.id === id)!;
        const count = step.state.gearItems.filter((g) => g.categoryId === id).length;
        step.push({ type: 'DELETE_CATEGORY', id });
        return () => `Deleted category "${cat.name}". ${count} item${count === 1 ? '' : 's'} moved to Uncategorized.`;
      })
  );

  // -------------------------------------------------------------------------------------------
  // Gearlists

  /** Adds Vault items to a list (FR-4: an item already there raises its quantity). */
  function addItems(step: Step, listId: string, items: z.infer<typeof listItemInput>[]): string[] {
    const unknown = items.filter((i) => !step.state.gearItems.some((g) => g.id === i.gear_item_id)).map((i) => i.gear_item_id);
    if (unknown.length > 0) {
      throw new Refusal(
        `These ids are not in the user's Gear Vault: ${unknown.join(', ')}. Use only ids from get_gear_vault. Never invent gear: if the user needs something they don't own, tell them, and add it with add_gear_items only if they agree.`
      );
    }
    const lines: string[] = [];
    for (const input of items) {
      const item = step.state.gearItems.find((g) => g.id === input.gear_item_id)!;
      const before = findList(step.state, listId).items.find((r) => r.gearItemId === item.id);
      const qty = input.quantity ?? item.defaultQuantity;
      step.push({ type: 'ADD_ITEM_TO_LIST', listId, gearItemId: item.id, quantity: qty, rowId: newId('li') });
      const row = findList(step.state, listId).items.find((r) => r.gearItemId === item.id)!;
      const patch: { isWorn?: boolean; isConsumable?: boolean; note?: string } = {};
      if (input.worn !== undefined) patch.isWorn = input.worn;
      if (input.consumable !== undefined) patch.isConsumable = input.consumable;
      if (input.note !== undefined) patch.note = input.note;
      if (Object.keys(patch).length > 0) step.push({ type: 'UPDATE_LIST_ITEM', listId, itemId: row.id, patch });
      lines.push(before ? `- ${item.name}: already in the list, quantity ${before.quantity} → ${row.quantity}` : `- ${item.name} × ${qty}`);
    }
    return lines;
  }

  server.registerTool(
    'create_gearlist',
    {
      title: 'Create a gearlist',
      description:
        "Creates a new gearlist (a packing list for one trip), optionally starting from the template, and fills it with items from the user's Gear Vault in the same step. Use only gear_item_ids from get_gear_vault; never invent items. Mark clothes worn on the body as worn, food/water/fuel as consumable. The whole gearlist is one change with one Undo.",
      inputSchema: z.object({
        name: nameIn.describe('Trip name, e.g. "Jeseníky – 3 days, rain".'),
        from_template: z.boolean().optional().describe("Start with the template's rows (only if the user has a template)."),
        items: z.array(listItemInput).max(300).optional(),
      }),
      annotations: WRITE,
    },
    async ({ name, from_template, items }) =>
      change((step) => {
        const id = newId('list');
        if (from_template) {
          const template = step.state.templates[0];
          if (!template) throw new Refusal('The user has no template. Create the gearlist without from_template.');
          step.push({ type: 'CREATE_LIST_FROM_TEMPLATE', id, name, templateId: template.id, createdAt: now(), rowIdPrefix: newId('li') });
        } else step.push({ type: 'CREATE_LIST', id, name, createdAt: now() });
        const lines = items ? addItems(step, id, items) : [];
        return (after) => {
          const list = findList(after, id);
          return [`Created gearlist "${list.name}" (id ${id}) with ${list.items.length} rows${from_template ? ' (from the template)' : ''}.`, ...lines, '', gearlistText(after, list, 'current')].join('\n');
        };
      })
  );

  server.registerTool(
    'add_items_to_gearlist',
    {
      title: 'Add items to a gearlist',
      description:
        "Adds Gear Vault items to a gearlist or the template. An item already in the list gets its quantity raised instead of a second row. Use only gear_item_ids from get_gear_vault; never invent items.",
      inputSchema: z.object({ list_id: idIn, items: z.array(listItemInput).min(1).max(300) }),
      annotations: WRITE,
    },
    async ({ list_id, items }) =>
      change((step) => {
        const list = findList(step.state, list_id);
        const lines = addItems(step, list.id, items);
        return (after) => [`Added to "${list.name}":`, ...lines, '', breakdownOf(after, list.id)].join('\n');
      })
  );

  const breakdownOf = (state: AppState, listId: string) => gearlistText(state, findList(state, listId), 'current').split('\n')[1];

  server.registerTool(
    'update_gearlist_row',
    {
      title: 'Edit a gearlist row',
      description:
        'Changes one row of a gearlist or the template. Quantity, worn, consumable, note and category affect only this row in this gearlist (no confirmation needed). Name and weight of a row linked to Gear Vault change the Vault item: if that item is used elsewhere, the user must choose if_used_elsewhere ("update_everywhere" or "create_copy" = only this row switches to a new Vault item); without it nothing changes and the answer says where it is used.',
      inputSchema: z.object({
        list_id: idIn,
        row_id: idIn.describe('Row id from get_gearlist.'),
        quantity: quantity.optional(),
        worn: z.boolean().optional(),
        consumable: z.boolean().optional(),
        note: noteIn.optional(),
        category: z.string().max(200).optional().describe('Category name for this row in this gearlist only.'),
        name: nameIn.optional(),
        weight_grams: grams.optional(),
        if_used_elsewhere: z.enum(['create_copy', 'update_everywhere']).optional(),
      }),
      annotations: WRITE,
    },
    async (input) =>
      change((step) => {
        const list = findList(step.state, input.list_id);
        const row = findRow(list, input.row_id);
        const done: string[] = [];
        const local: { quantity?: number; isWorn?: boolean; isConsumable?: boolean; note?: string } = {};
        if (input.quantity !== undefined) local.quantity = input.quantity;
        if (input.worn !== undefined) local.isWorn = input.worn;
        if (input.consumable !== undefined) local.isConsumable = input.consumable;
        if (input.note !== undefined) local.note = input.note;
        if (Object.keys(local).length > 0) {
          step.push({ type: 'UPDATE_LIST_ITEM', listId: list.id, itemId: row.id, patch: local });
          done.push('row updated');
        }
        if (input.category !== undefined) {
          const categoryId = resolveCategory(step.state, input.category);
          step.push({ type: 'UPDATE_UNLINKED_LIST_ITEM', listId: list.id, itemId: row.id, patch: { categoryName: categoryNameFor(categoryId, step.state.categories) } });
          done.push('category changed for this row only');
        }
        if (input.name !== undefined || input.weight_grams !== undefined) {
          if (!row.gearItemId) {
            const patch: { name?: string; weightGrams?: number } = {};
            if (input.name !== undefined) patch.name = input.name;
            if (input.weight_grams !== undefined) patch.weightGrams = input.weight_grams;
            step.push({ type: 'UPDATE_UNLINKED_LIST_ITEM', listId: list.id, itemId: row.id, patch });
            done.push('custom entry renamed / reweighed');
          } else {
            const item = findItem(step.state, row.gearItemId);
            const patch: GearItemPatch = {
              name: input.name ?? item.name,
              categoryId: item.categoryId,
              weightGrams: input.weight_grams ?? item.weightGrams,
              defaultQuantity: item.defaultQuantity,
              note: item.note,
            };
            const elsewhere = linkedRowCount(step.state, item.id) > 1;
            if (elsewhere && !input.if_used_elsewhere) {
              throw new Refusal(
                `"${item.name}" is a Gear Vault item used in ${usageText(step.state, item.id)}. Ask the user: update it everywhere (if_used_elsewhere="update_everywhere") or create a copy only for this row (if_used_elsewhere="create_copy").`
              );
            }
            if (elsewhere && input.if_used_elsewhere === 'create_copy') {
              const newGearItemId = newId('gear');
              step.push({ type: 'COPY_AND_RELINK_LIST_ITEM', listId: list.id, itemId: row.id, newGearItemId, item: patch });
              done.push(`this row now uses a new Gear Vault item "${patch.name}" (id ${newGearItemId}); other gearlists unchanged`);
            } else {
              step.push({ type: 'UPDATE_GEAR_ITEM', id: item.id, patch, choice: 'update_everywhere' });
              done.push(elsewhere ? 'Gear Vault item updated everywhere it is used' : 'Gear Vault item updated');
            }
          }
        }
        if (step.ops.length === 0) throw new Refusal('No change was given.');
        return (after) => {
          const now = findList(after, list.id).items.find((r) => r.id === row.id);
          const desc = now ? `${now.name} × ${now.quantity} · ${w(after, now.weightGrams * now.quantity)}${now.isWorn ? ' · worn' : ''}${now.isConsumable ? ' · consumable' : ''} · ${now.categoryName}` : row.name;
          return `Updated in "${list.name}": ${desc} (${done.join('; ')}).\n${breakdownOf(after, list.id)}`;
        };
      })
  );

  server.registerTool(
    'remove_gearlist_row',
    {
      title: 'Remove a row from a gearlist',
      description: 'Removes one row from a gearlist or the template. The item stays in Gear Vault. Undoable in Activity.',
      inputSchema: z.object({ list_id: idIn, row_id: idIn }),
      annotations: DELETE,
    },
    async ({ list_id, row_id }) =>
      change((step) => {
        const list = findList(step.state, list_id);
        const row = findRow(list, row_id);
        step.push({ type: 'REMOVE_LIST_ITEM', listId: list.id, itemId: row.id });
        return (after) => `Removed ${row.name} from "${list.name}".\n${breakdownOf(after, list.id)}`;
      })
  );

  server.registerTool(
    'delete_gearlist',
    {
      title: 'Delete a gearlist',
      description: 'Deletes a gearlist with its snapshot (soft delete: the user can undo it in Activity for 30 days). Gear Vault is not affected.',
      inputSchema: z.object({ list_id: idIn }),
      annotations: DELETE,
    },
    async ({ list_id }) =>
      change((step) => {
        const list = findList(step.state, list_id, false);
        step.push({ type: 'DELETE_LIST', listId: list.id });
        return () => `Deleted gearlist "${list.name}". The user can undo this in Activity for 30 days.`;
      })
  );

  server.registerTool(
    'move',
    {
      title: 'Change order',
      description:
        'Moves something before or after another thing of the same kind: a Gear Vault item (within its category; to change its category use update_gear_item), a category, a gearlist, a row inside a gearlist, or a whole category block inside a gearlist (ids are then category names).',
      inputSchema: z.object({
        what: z.enum(['vault_item', 'category', 'gearlist', 'gearlist_row', 'gearlist_category']),
        id: z.string().min(1).max(200).describe('What to move (id; for gearlist_category the category name).'),
        target_id: z.string().min(1).max(200).describe('Move it next to this one.'),
        position: z.enum(['before', 'after']),
        list_id: idIn.optional().describe('Needed for gearlist_row and gearlist_category.'),
      }),
      annotations: WRITE,
    },
    async ({ what, id, target_id, position, list_id }) =>
      change((step) => {
        const after = position === 'after';
        const s = step.state;
        switch (what) {
          case 'vault_item': {
            const source = findItem(s, id);
            const target = findItem(s, target_id);
            if (source.categoryId !== target.categoryId) throw new Refusal('Both items must be in the same category. To change the category use update_gear_item.');
            step.push({ type: 'REORDER_GEAR_ITEMS', sourceId: id, targetId: target_id, targetCategoryId: target.categoryId, after });
            return () => `Moved ${source.name} ${position} ${target.name} in Gear Vault.`;
          }
          case 'category': {
            const a = resolveCategory(s, id);
            const b = resolveCategory(s, target_id);
            if (a === null || b === null) throw new Refusal('"Uncategorized" cannot be moved.');
            step.push({ type: 'REORDER_CATEGORIES', sourceId: a, targetId: b, after });
            return () => `Moved category ${categoryNameFor(a, s.categories)} ${position} ${categoryNameFor(b, s.categories)}.`;
          }
          case 'gearlist': {
            const a = findList(s, id, false);
            const b = findList(s, target_id, false);
            step.push({ type: 'REORDER_LISTS', sourceId: a.id, targetId: b.id, after });
            return () => `Moved gearlist "${a.name}" ${position} "${b.name}".`;
          }
          case 'gearlist_row': {
            if (!list_id) throw new Refusal('list_id is needed.');
            const list = findList(s, list_id);
            const a = findRow(list, id);
            const b = findRow(list, target_id);
            step.push({ type: 'REORDER_LIST_ITEMS', listId: list.id, sourceId: a.id, targetId: b.id, after });
            return () => `Moved ${a.name} ${position} ${b.name} in "${list.name}".`;
          }
          case 'gearlist_category': {
            if (!list_id) throw new Refusal('list_id is needed.');
            const list = findList(s, list_id);
            for (const n of [id, target_id]) if (!list.items.some((r) => r.categoryName === n)) throw new Refusal(`"${list.name}" has no category "${n}".`);
            step.push({ type: 'REORDER_LIST_CATEGORIES', listId: list.id, sourceName: id, targetName: target_id, after });
            return () => `Moved ${id} ${position} ${target_id} in "${list.name}".`;
          }
        }
      })
  );

  server.registerTool(
    'save_snapshot',
    {
      title: 'Save a snapshot',
      description:
        'Saves a read-only snapshot of a gearlist as it is now (typically right before the trip). A gearlist has one snapshot: if one exists, it is overwritten only with overwrite_existing=true, which the user must confirm. Without it nothing changes and the answer gives the date of the existing snapshot.',
      inputSchema: z.object({ list_id: idIn, overwrite_existing: z.boolean().optional() }),
      annotations: WRITE,
    },
    async ({ list_id, overwrite_existing }) =>
      change((step) => {
        const list = findList(step.state, list_id, false);
        if (list.snapshot && !overwrite_existing) {
          throw new Refusal(`"${list.name}" already has a snapshot from ${list.snapshot.savedAt.slice(0, 10)}. Ask the user whether to overwrite it, then call again with overwrite_existing=true.`);
        }
        step.push({ type: 'SAVE_SNAPSHOT', listId: list.id, savedAt: now(), overwrite: overwrite_existing });
        return () => `Saved a snapshot of "${list.name}" (${list.items.length} rows)${list.snapshot ? ', replacing the previous one' : ''}.`;
      })
  );

  server.registerTool(
    'save_as_template',
    {
      title: 'Save a gearlist as the template',
      description:
        'Makes the template a copy of this gearlist (only rows linked to Gear Vault). The user has at most one template; replacing an existing one needs replace_existing=true, which the user must confirm. Existing gearlists never change.',
      inputSchema: z.object({ list_id: idIn, replace_existing: z.boolean().optional() }),
      annotations: WRITE,
    },
    async ({ list_id, replace_existing }) =>
      change((step) => {
        const list = findList(step.state, list_id, false);
        const existing = step.state.templates[0];
        if (existing && !replace_existing) {
          throw new Refusal(`The user already has a template (${existing.items.length} rows). Ask whether to replace it with "${list.name}", then call again with replace_existing=true.`);
        }
        step.push({ type: 'SAVE_AS_TEMPLATE', listId: list.id, templateId: newId('tpl'), createdAt: now(), rowIdPrefix: newId('ti'), replace: replace_existing });
        return (after) => `The template is now a copy of "${list.name}" (${after.templates[0]?.items.length ?? 0} rows).`;
      })
  );

  server.registerTool(
    'delete_template',
    {
      title: 'Delete the template',
      description: 'Deletes the template. Gearlists created from it do not change. Undoable in Activity.',
      inputSchema: z.object({}),
      annotations: DELETE,
    },
    async () =>
      change((step) => {
        const template = step.state.templates[0];
        if (!template) throw new Refusal('The user has no template.');
        step.push({ type: 'DELETE_TEMPLATE', templateId: template.id });
        return () => 'Deleted the template.';
      })
  );

  // -------------------------------------------------------------------------------------------
  // Undo (FR-25): only this AI client's own last step; conflicts are left to the user on the web.

  server.registerTool(
    'undo_last_ai_step',
    {
      title: 'Undo your last change',
      description:
        'Undoes the most recent change this AI app made in HikingBuddy (one tool call = one change). Call it again to go further back. If the user changed the same things since, nothing is undone and the user should decide in the Activity panel of the HikingBuddy web app.',
      inputSchema: z.object({}),
      annotations: WRITE,
    },
    async () => {
      const history = await loadHistory(db, userId);
      const last = [...history].reverse().find((e) => e.actor === 'ai' && e.client === props.clientName && e.kind === 'change' && e.undoable && !entryUndoneAt(e));
      if (!last) return fail(`There is no change by ${props.clientName} from the last 30 days left to undo.`);
      const outcome = await runUndo(db, userId, { entryId: last.id }, 'auto', who);
      const { state } = await loadState(db, userId);
      const what = richText(last.text, state.unitPreference);
      if (outcome.kind === 'error') return fail(outcome.message);
      if (outcome.kind === 'check') {
        const later = outcome.conflicts.map((c) => `- ${richText(c.text, state.unitPreference)} (${c.actor === 'ai' ? c.client : 'the user'})`).join('\n');
        return fail(`Nothing was undone. "${what}" was changed again later:\n${later}\nThe user can decide in Activity in the HikingBuddy web app (Undo anyway or keep the later change).`);
      }
      return ok(`Undid: ${what}.`);
    }
  );

  return server;
}
