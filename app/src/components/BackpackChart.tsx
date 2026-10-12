import { useId, useMemo, useState } from 'react';
import type { GearListItem, UnitPreference } from '../types';
import { formatWeight } from '../utils/weight';
import { categoryColor, type CategoryColorKey } from '../utils/categoryStyle';
import { CategoryIcon } from './CategoryIcon';
import { ActionIcon } from './icons/actionIcons';
import { HikerIcon } from './icons/HikerIcons';
import { Icon } from './ui';

/**
 * FR-19 — the backpack weight chart (React port of HB.backpack from
 * design/2026-10-redesign/design-system/components/bundle.js, shape A "rounded").
 *
 * Decided with Martin (PRD v21):
 * - In the pack = Base + Consumables. Worn is carried on the body, so it is never a layer;
 *   it's listed under the pack (hiker icon, "+ weight").
 * - One layer per category, height = the category's share of the pack weight, heaviest at
 *   the bottom. Tiny categories keep a minimum height so they stay visible.
 * - Hovering or focusing a layer or a legend row highlights both and dims the others.
 */

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

// Shape A geometry (viewBox 0 0 220 280) — kept exactly as in the design system. `BODY` is
// both the outline and the clip path of the colour layers.
const BODY = 'M44 94A58 58 0 0 1 102 36H118A58 58 0 0 1 176 94V242A26 26 0 0 1 150 268H70A26 26 0 0 1 44 242Z';
const TOP = 36;
const BOTTOM = 268;
const MIN_LAYER = 3;
const LABEL_MIN = 20;

/** Relative luminance of a #rrggbb colour (WCAG), to pick dark or light percentage text. */
function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function tokenHex(colorKey: CategoryColorKey): string {
  if (typeof document === 'undefined') return '';
  const name = categoryColor(colorKey).replace(/^var\((--[\w-]+)\)$/, '$1');
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

interface BackpackChartProps {
  categories: PackCategory[];
  consumable: number;
  worn: number;
  unit: UnitPreference;
}

export function BackpackChart({ categories, consumable, worn, unit }: BackpackChartProps) {
  const clipId = useId();
  const [active, setActive] = useState<number | null>(null);

  const cats = useMemo(() => categories.filter((c) => c.grams > 0).sort((a, b) => b.grams - a.grams), [categories]);
  const total = cats.reduce((sum, c) => sum + c.grams, 0);
  const base = total - consumable;

  const layers = useMemo(() => {
    let y = BOTTOM;
    return cats.map((c) => {
      let h = total ? (c.grams / total) * (BOTTOM - TOP) : 0;
      if (h > 0 && h < MIN_LAYER) h = MIN_LAYER; // keep tiny categories visible
      y -= h;
      const pct = total ? Math.round((c.grams / total) * 100) : 0;
      const dark = luminance(tokenHex(c.colorKey)) > 0.3;
      return { cat: c, y, h, pct, dark };
    });
  }, [cats, total]);

  const focusProps = (i: number) => ({
    onMouseEnter: () => setActive(i),
    onMouseLeave: () => setActive(null),
    onFocus: () => setActive(i),
    onBlur: () => setActive(null),
  });
  const activeClass = (i: number) => (active === i ? 'is-active' : '');

  return (
    <div className={`pack ${active !== null ? 'is-focus' : ''}`}>
      <div className="pack-figure">
        <svg className="pack-svg" viewBox="0 0 220 280" role="img" aria-label="Pack weight by category">
          <defs>
            <clipPath id={clipId}>
              <path d={BODY} />
            </clipPath>
          </defs>
          {/* behind the body: handle and side pockets */}
          <path d="M94 38V26a16 16 0 0 1 32 0v12" className="pack-detail" />
          <rect x="27" y="150" width="21" height="92" rx="9" className="pack-empty" />
          <rect x="27" y="150" width="21" height="92" rx="9" className="pack-detail" />
          <rect x="172" y="150" width="21" height="92" rx="9" className="pack-empty" />
          <rect x="172" y="150" width="21" height="92" rx="9" className="pack-detail" />
          <path d={BODY} className="pack-empty" />
          <g clipPath={`url(#${clipId})`}>
            {layers.map((l, i) => (
              <rect
                key={l.cat.key}
                className={`pack-layer ${activeClass(i)}`}
                x="20"
                y={l.y.toFixed(2)}
                width="180"
                height={(l.h + 0.5).toFixed(2)}
                fill={categoryColor(l.cat.colorKey)}
                {...focusProps(i)}
              >
                <title>{`${l.cat.name}: ${formatWeight(l.cat.grams, unit)} (${l.pct} %)`}</title>
              </rect>
            ))}
            {layers.slice(0, -1).map((l) => (
              <line key={`gap-${l.cat.key}`} className="pack-gap" x1="20" x2="200" y1={l.y.toFixed(2)} y2={l.y.toFixed(2)} />
            ))}
            {layers
              .filter((l) => l.h >= LABEL_MIN)
              .map((l) => (
                <text
                  key={`pct-${l.cat.key}`}
                  className="pack-pct"
                  x="110"
                  y={(l.y + l.h / 2 + 5).toFixed(2)}
                  textAnchor="middle"
                  fill={l.dark ? 'var(--ink)' : 'var(--surface)'}
                >
                  {l.pct} %
                </text>
              ))}
          </g>
          {/* over the layers: lid seam and front pocket */}
          <path d="M45 104C78 122 142 122 175 104" className="pack-detail" strokeOpacity={0.55} />
          <rect x="72" y="182" width="76" height="66" rx="16" className="pack-detail" strokeOpacity={0.55} />
          <path d={BODY} className="pack-outline" />
        </svg>
        <div className="pack-total">
          <div className="label">In the pack</div>
          <div className="pack-kg">{formatWeight(total, unit)}</div>
        </div>
        <dl className="pack-split">
          <div data-tip="Base weight: everything in the pack except consumables">
            <dt>
              <Icon icon={ActionIcon.base} />
              Base
            </dt>
            <dd>{formatWeight(base, unit)}</dd>
          </div>
          <div data-tip="Consumables: food, fuel, water. In the pack, gets lighter every day">
            <dt>
              <Icon icon={ActionIcon.consumable} />
              Consumables
            </dt>
            <dd>{formatWeight(consumable, unit)}</dd>
          </div>
          <div className="pack-split-worn" data-tip="Worn: carried on your body, not in the pack">
            <dt>
              <HikerIcon />
              Worn
            </dt>
            <dd>+ {formatWeight(worn, unit)}</dd>
          </div>
        </dl>
      </div>

      <ul className="legend" aria-label="Pack weight by category">
        <li className="legend-head label" aria-hidden="true">
          <span />
          <span />
          <span>Category</span>
          <span>Weight</span>
          <span>Share</span>
        </li>
        {layers.length === 0 && <li className="legend-empty">Nothing in the pack yet.</li>}
        {layers.map((l, i) => (
          <li key={l.cat.key} className={`legend-row ${activeClass(i)}`} tabIndex={0} {...focusProps(i)}>
            <span className="swatch" style={{ background: categoryColor(l.cat.colorKey) }} aria-hidden="true" />
            <CategoryIcon id={l.cat.iconId} name={l.cat.name} size={16} />
            <span>{l.cat.name}</span>
            <span className="legend-w">{formatWeight(l.cat.grams, unit)}</span>
            <span className="legend-p">{l.pct} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
