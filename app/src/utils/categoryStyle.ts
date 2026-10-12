import { isTemplateCategory } from '../constants';
import type { Category } from '../types';
import { sortByOrder } from './reorder';

/**
 * Category colours (FR-19, PRD v21). Colours are never stored — they're derived, so the
 * data model doesn't change:
 * - a default-template category by its id: `cat-backpack` → `--cat-backpack`, …
 * - a user-created category by its position among the user-created categories, in the
 *   user's category order: `--cat-custom-1` … `--cat-custom-4`, then round again.
 *   (Reordering custom categories can therefore swap their colours — accepted by Martin.)
 * - no / unknown category → `--cat-none`.
 *
 * The result is a short "colour key" (e.g. `shelter`, `custom-2`, `none`), also carried in
 * share links v2 so a shared page shows the same colours.
 */
export type CategoryColorKey = string;

const CUSTOM_COLORS = 4;

export function categoryColorKey(categoryId: string | null | undefined, categories: Category[]): CategoryColorKey {
  if (!categoryId) return 'none';
  if (isTemplateCategory(categoryId)) return categoryId.replace(/^cat-/, '');
  const custom = sortByOrder(categories).filter((c) => !isTemplateCategory(c.id));
  const index = custom.findIndex((c) => c.id === categoryId);
  if (index === -1) return 'none';
  return `custom-${(index % CUSTOM_COLORS) + 1}`;
}

/** Gearlist rows only know their category's *name* — the Vault category with that name. */
export function categoryForName(name: string, categories: Category[]): Category | null {
  return categories.find((c) => c.name === name) ?? null;
}

/** Template id behind a colour key (for the default category icon), or null. */
export function templateIdForKey(key: CategoryColorKey): string | null {
  const id = `cat-${key}`;
  return isTemplateCategory(id) ? id : null;
}

/** Allowed keys only, so a key read from a share link can never inject arbitrary CSS. */
export function isValidColorKey(key: unknown): key is CategoryColorKey {
  return typeof key === 'string' && (key === 'none' || /^custom-[1-4]$/.test(key) || templateIdForKey(key) !== null);
}

export function categoryColor(key: CategoryColorKey): string {
  return `var(--cat-${isValidColorKey(key) ? key : 'none'})`;
}
