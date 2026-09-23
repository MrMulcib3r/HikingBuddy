import { DEFAULT_CATEGORIES, STORAGE_KEY } from './constants';
import type { AppState } from './types';

function defaultState(): AppState {
  return {
    categories: DEFAULT_CATEGORIES,
    gearItems: [],
    gearLists: [],
    unitPreference: 'metric',
  };
}

/**
 * MVP zatím nemá účet ani server (viz PRD sekce 2) — appka data ukládá jen
 * do prohlížeče (localStorage). Přechod na server je připravený jako
 * budoucí fáze, tahle vrstva je jediné místo, které by se při přechodu
 * měnilo.
 *
 * Poznámka k v2: datový model se v této verzi zásadně změnil (zrušení
 * Draft/Finalized, Worn/Consumable přesunuté na gearlist item, snapshoty).
 * Starší data (klíč v1) se proto nemigrují a appka po tomto updatu začíná
 * s prázdným stavem — je to čistě lokální MVP bez cloudové zálohy.
 */
export function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      categories: parsed.categories ?? DEFAULT_CATEGORIES,
      gearItems: parsed.gearItems ?? [],
      gearLists: parsed.gearLists ?? [],
      unitPreference: parsed.unitPreference ?? 'metric',
    };
  } catch (err) {
    console.error('Nepodařilo se načíst uložená data, startuji s prázdným stavem.', err);
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Nepodařilo se uložit data do prohlížeče.', err);
  }
}
