import type { Category } from './types';

/**
 * Výchozí "template" seznam kategorií (FR-2). Uživatel je může kdykoliv
 * přejmenovat, smazat, přeuspořádat (drag & drop) nebo přidat vlastní —
 * tohle je jen startovní bod.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-backpack', name: 'Backpack', order: 0 },
  { id: 'cat-shelter', name: 'Shelter', order: 1 },
  { id: 'cat-sleep', name: 'Sleep System', order: 2 },
  { id: 'cat-clothing', name: 'Clothing', order: 3 },
  { id: 'cat-cooking', name: 'Cooking', order: 4 },
  { id: 'cat-food', name: 'Food', order: 5 },
  { id: 'cat-water', name: 'Water', order: 6 },
  { id: 'cat-electronics', name: 'Electronics', order: 7 },
  { id: 'cat-hygiene', name: 'Hygiene', order: 8 },
  { id: 'cat-misc', name: 'Misc', order: 9 },
];

/**
 * Storage key policy (see PRD-MVP.md section 6 "Data migration policy"): this key never
 * changes again, even when the data shape changes. Older data lives under
 * LEGACY_STORAGE_KEYS purely so it can be picked up and migrated forward once — see
 * storage.ts. Renaming the key (as happened once, 2026-09-22, when the Draft/Finalized
 * rework shipped) silently orphans a user's existing data and must never be done again.
 */
export const STORAGE_KEY = 'hikingbuddy-state';

/** Keys used before versioned migrations existed. Newest first. storage.ts checks these,
 * in order, only when STORAGE_KEY itself has nothing yet. */
export const LEGACY_STORAGE_KEYS = ['hikingbuddy-state-v2', 'hikingbuddy-state-v1'];
