import type { GearListItem } from '../types';
import type { CategoryColorKey } from './categoryStyle';

/**
 * Backpack chart math (FR-19), ported from HB.backpack in
 * design/2026-10-redesign/design-system/components/bundle.js (design system v2, 2026-10-13).
 * Pure functions, no React — the chart component only draws what these return.
 */

/** One layer of the backpack chart. */
export interface PackCategory {
  /** Unique key of the group (the category name as shown). */
  key: string;
  name: string;
  colorKey: CategoryColorKey;
  /** Vault/template category id when known — gives the default category its icon. */
  iconId: string | null;
  grams: number;
}

/** Groups gearlist rows into pack layers: only rows that are in the pack (Base or
 * Consumable — Consumable wins over Worn, same as computeBreakdown). */
export function packCategoriesFromItems(
  items: GearListItem[],
  resolve: (categoryName: string) => { colorKey: CategoryColorKey; iconId: string | null }
): PackCategory[] {
  const byName = new Map<string, PackCategory>();
  for (const item of items) {
    const inPack = item.isConsumable || !item.isWorn;
    if (!inPack) continue;
    let cat = byName.get(item.categoryName);
    if (!cat) {
      cat = { key: item.categoryName, name: item.categoryName, grams: 0, ...resolve(item.categoryName) };
      byName.set(item.categoryName, cat);
    }
    cat.grams += item.weightGrams * item.quantity;
  }
  return [...byName.values()];
}

// Pack geometry (shape A), in viewBox units. Layers fill the body from BOTTOM up to TOP.
export const PACK_TOP = 36;
export const PACK_BOTTOM = 268;
/** Thinnest layer (~9px on screen): every category stays visible and easy to hover. */
export const MIN_LAYER = 7;
/** A layer at least this tall carries its percentage inside; thinner ones get an outside label. */
export const INSIDE_LABEL_MIN = 18;
/** Minimum vertical distance between outside labels. */
export const LABEL_GAP = 13;

/** Heights proportional to weight, but never below MIN_LAYER; the rest is scaled so the
 * stack still fills the pack exactly. */
export function layerHeights(grams: number[], space: number): number[] {
  const total = grams.reduce((s, g) => s + g, 0);
  if (!total) return grams.map(() => 0);
  let h = grams.map((g) => (g / total) * space);
  for (let k = 0; k < 5; k++) {
    const small = h.map((v) => v < MIN_LAYER);
    const fixed = small.filter(Boolean).length * MIN_LAYER;
    const restGrams = grams.reduce((s, g, i) => (small[i] ? s : s + g), 0);
    h = grams.map((g, i) => (small[i] ? MIN_LAYER : restGrams ? (g / restGrams) * (space - fixed) : MIN_LAYER));
  }
  return h;
}

/** "12 %", or "<1 %" for a category that is there but rounds to zero. */
export function percentText(grams: number, total: number): string {
  const pct = total ? Math.round((grams / total) * 100) : 0;
  return `${pct < 1 && grams > 0 ? '<1' : pct} %`;
}

/**
 * Outside labels (for layers too thin to carry their own percentage): placed top to bottom
 * next to their layer, pushed apart so they never overlap, and kept above `labelBottom`.
 * `mids` are the layers' vertical centres; returns the label positions in the same order.
 */
export function placeOutsideLabels(mids: number[], labelBottom: number): number[] {
  const order = mids.map((mid, i) => ({ mid, i })).sort((a, b) => a.mid - b.mid);
  const placed = new Array<number>(mids.length);
  let next = PACK_TOP;
  for (const o of order) {
    placed[o.i] = Math.max(o.mid, next);
    next = placed[o.i] + LABEL_GAP;
  }
  const lowest = order.length ? placed[order[order.length - 1].i] : 0;
  const over = lowest - labelBottom;
  return over > 0 ? placed.map((y) => y - over) : placed;
}

