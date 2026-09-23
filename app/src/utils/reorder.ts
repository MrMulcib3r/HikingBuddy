/** Generic helper for drag & drop: move the item with `sourceId` to sit right before the
 * item with `targetId`, keeping everything else in place. Used for gearlists, categories,
 * and items inside a gearlist/vault list. Returns a new array with `order` fields rewritten
 * 0..n-1 to match the new position. */
export function reorderById<T extends { id: string }>(list: T[], sourceId: string, targetId: string): T[] {
  if (sourceId === targetId) return list;
  const items = [...list];
  const fromIndex = items.findIndex((i) => i.id === sourceId);
  const toIndex = items.findIndex((i) => i.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return list;
  const [moved] = items.splice(fromIndex, 1);
  const insertAt = items.findIndex((i) => i.id === targetId);
  items.splice(insertAt, 0, moved);
  return items;
}

/** Re-numbers the `order` field of a list to 0..n-1 following current array order. */
export function withSequentialOrder<T extends { order: number }>(list: T[]): T[] {
  return list.map((item, index) => ({ ...item, order: index }));
}

export function sortByOrder<T extends { order: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => a.order - b.order);
}
