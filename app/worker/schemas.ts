/**
 * Shape checks for everything the browser sends (FR-26 "inputs validated"). They only make sure
 * the request has the right structure and sane sizes; the PRD rules themselves are enforced by
 * the operations layer (src/core/operations.ts).
 */
import { z } from 'zod';
import { LIMITS } from '../src/core/operations';

const id = z.string().min(1).max(LIMITS.idLength);
const name = z.string().max(LIMITS.nameLength);
const note = z.string().max(LIMITS.noteLength);
const grams = z.number().finite().min(0).max(LIMITS.maxWeightGrams);
const quantity = z.number().int().min(0).max(LIMITS.maxQuantity);
const iso = z.string().max(40);
const after = z.boolean().optional();

const gearPatch = z.object({ name, categoryId: id.nullable(), weightGrams: grams, defaultQuantity: quantity, note });

export const operationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ADD_CATEGORY'), id, name }),
  z.object({ type: z.literal('RENAME_CATEGORY'), id, name }),
  z.object({ type: z.literal('DELETE_CATEGORY'), id }),
  z.object({ type: z.literal('REORDER_CATEGORIES'), sourceId: id, targetId: id, after }),
  z.object({ type: z.literal('ADD_GEAR_ITEM'), id, item: gearPatch }),
  z.object({ type: z.literal('UPDATE_GEAR_ITEM'), id, patch: gearPatch, choice: z.literal('update_everywhere').optional() }),
  z.object({ type: z.literal('DELETE_GEAR_ITEM'), id, removeFromLists: z.boolean() }),
  z.object({ type: z.literal('REORDER_GEAR_ITEMS'), sourceId: id, targetId: id, targetCategoryId: id.nullable(), after }),
  z.object({ type: z.literal('CREATE_LIST'), id, name, createdAt: iso }),
  z.object({ type: z.literal('ADD_ITEM_TO_LIST'), listId: id, gearItemId: id, quantity, rowId: id }),
  z.object({
    type: z.literal('UPDATE_LIST_ITEM'),
    listId: id,
    itemId: id,
    patch: z.object({ quantity: quantity.optional(), isWorn: z.boolean().optional(), isConsumable: z.boolean().optional(), note: note.optional() }).strict(),
  }),
  z.object({
    type: z.literal('UPDATE_UNLINKED_LIST_ITEM'),
    listId: id,
    itemId: id,
    patch: z.object({ name: name.optional(), categoryName: name.optional(), weightGrams: grams.optional(), note: note.optional() }).strict(),
  }),
  z.object({ type: z.literal('COPY_AND_RELINK_LIST_ITEM'), listId: id, itemId: id, newGearItemId: id, item: gearPatch }),
  z.object({ type: z.literal('REMOVE_LIST_ITEM'), listId: id, itemId: id }),
  z.object({ type: z.literal('REORDER_LIST_ITEMS'), listId: id, sourceId: id, targetId: id, after }),
  z.object({ type: z.literal('REORDER_LIST_CATEGORIES'), listId: id, sourceName: name, targetName: name, after }),
  z.object({ type: z.literal('SAVE_SNAPSHOT'), listId: id, savedAt: iso, overwrite: z.boolean().optional() }),
  z.object({ type: z.literal('REORDER_LISTS'), sourceId: id, targetId: id, after }),
  z.object({ type: z.literal('DELETE_LIST'), listId: id }),
  z.object({ type: z.literal('SAVE_AS_TEMPLATE'), listId: id, templateId: id, createdAt: iso, rowIdPrefix: id, replace: z.boolean().optional() }),
  z.object({ type: z.literal('DELETE_TEMPLATE'), templateId: id }),
  z.object({ type: z.literal('CREATE_LIST_FROM_TEMPLATE'), id, name, templateId: id, createdAt: iso, rowIdPrefix: id }),
  z.object({ type: z.literal('DISMISS_TEMPLATE_BANNER') }),
  z.object({ type: z.literal('SET_UNIT_PREFERENCE'), pref: z.enum(['metric', 'imperial']) }),
]);

export const opsRequestSchema = z.object({
  schemaVersion: z.number().int(),
  ops: z.array(operationSchema).min(1).max(200),
});

/** Import (FR-23), Import backup and demo data while signed in. The state is migrated on the
 * server with the same migrations as everywhere else, then checked against the limits. */
export const importRequestSchema = z.object({
  schemaVersion: z.number().int().min(1),
  state: z.unknown(),
  mode: z.enum(['replace_empty', 'as_new']),
});

const rowSchema = z.object({
  id,
  gearItemId: id.nullable(),
  name,
  categoryName: name,
  weightGrams: grams,
  quantity,
  note,
  isWorn: z.boolean(),
  isConsumable: z.boolean(),
  order: z.number().int(),
});
const listSchema = z.object({
  id,
  name,
  createdAt: iso,
  items: z.array(rowSchema).max(LIMITS.maxRowsPerList),
  snapshot: z.object({ savedAt: iso, items: z.array(rowSchema).max(LIMITS.maxRowsPerList) }).nullable(),
  order: z.number().int(),
});

/** A whole AppState (after migration), checked before it is written into an account. */
export const appStateSchema = z.object({
  categories: z.array(z.object({ id, name, order: z.number().int() })).max(LIMITS.maxCategories),
  gearItems: z
    .array(z.object({ id, name, categoryId: id.nullable(), weightGrams: grams, defaultQuantity: quantity, note, order: z.number().int() }))
    .max(LIMITS.maxGearItems),
  gearLists: z.array(listSchema).max(LIMITS.maxLists),
  templates: z.array(listSchema).max(1),
  templateBannerDismissed: z.boolean(),
  unitPreference: z.enum(['metric', 'imperial']),
});
