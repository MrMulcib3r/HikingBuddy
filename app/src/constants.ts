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

export const STORAGE_KEY = 'hikingbuddy-state-v2';
