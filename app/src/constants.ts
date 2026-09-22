import type { Category } from './types';

/**
 * Výchozí "template" seznam kategorií (FR-2). Uživatel je může kdykoliv
 * přejmenovat, smazat nebo přidat vlastní — tohle je jen startovní bod.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-shelter', name: 'Shelter' },
  { id: 'cat-sleep', name: 'Sleep System' },
  { id: 'cat-clothing', name: 'Clothing' },
  { id: 'cat-cooking', name: 'Cooking' },
  { id: 'cat-food', name: 'Food' },
  { id: 'cat-water', name: 'Water' },
  { id: 'cat-electronics', name: 'Electronics' },
  { id: 'cat-hygiene', name: 'Hygiene' },
  { id: 'cat-misc', name: 'Misc' },
];

export const STORAGE_KEY = 'hikingbuddy-state-v1';
