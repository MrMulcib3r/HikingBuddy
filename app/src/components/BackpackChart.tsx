import { useId, useMemo, useState } from 'react';
import { Feather, Footprints, Mountain } from 'lucide-react';
import type { UnitPreference } from '../types';
import { formatWeight } from '../utils/weight';
import { categoryColor, type CategoryColorKey } from '../utils/categoryStyle';
import {
  INSIDE_LABEL_MIN,
  PACK_BODY,
  PACK_BOTTOM,
  PACK_TOP,
  TIERS,
  gearShown,
  layerHeights,
  outsideLabelBottom,
  percentText,
  placeOutsideLabels,
  tierOf,
  type GearPart,
  type PackCategory,
} from '../utils/pack';
import { PackBehind, PackFrontPocket, PackGear } from './PackGear';
import { CategoryIcon } from './CategoryIcon';
import { ActionIcon } from './icons/actionIcons';
import { HikerIcon } from './icons/HikerIcons';
import { Icon } from './ui';

/**
 * FR-19 — the backpack weight chart, React port of HB.backpack (design system v2,
 * design/2026-10-redesign/design-system/components/bundle.js, shape A).
 *
 * - In the pack = Base + Consumables. Worn is carried on the body, never a layer; the split
 *   under the pack lists Base, Consumables, Worn and Total (pack + worn). It replaces the old
 *   four weight tiles (removed in v2).
 * - One layer per category, heaviest at the bottom, minimum layer height so every category
 *   stays visible and hoverable (utils/pack.ts).
 * - Every category shows its percentage: inside its layer, or — for thin layers — to the right
 *   of the pack with a leader line; outside labels never overlap.
 * - Hovering or focusing a layer, a label or a legend row highlights all of them.
 * - Pack tiers (v3): by BASE weight the pack is Ultralight / Lightweight / Traditional; heavier
 *   tiers strap gear onto the outside (PackGear) and a badge under the pack names the tier in
 *   words. Gear and badge animate only when the tier changes, never on edits inside a tier.
 */

const TIER_ICONS = { ultralight: Feather, lightweight: Footprints, traditional: Mountain };

// The chart reserves room around the pack (viewBox -30 0 370 306) for the outside labels and
// the tier gear, so nothing jumps.
const BODY = PACK_BODY;
const VIEWBOX = '-30 0 370 306';

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
  /** Animate gear when the tier changes. Off on the shared page — nothing changes there. */
  animate?: boolean;
}

export function BackpackChart({ categories, consumable, worn, unit, animate = true }: BackpackChartProps) {
  const clipId = useId();
  const [active, setActive] = useState<number | null>(null);

  const cats = useMemo(() => categories.filter((c) => c.grams > 0).sort((a, b) => b.grams - a.grams), [categories]);
  const total = cats.reduce((sum, c) => sum + c.grams, 0);
  const base = total - consumable;

  // Tier of this render and the tier it changed FROM (null = no change seen since mounting,
  // so nothing animates on first view or when switching gearlists). React's "store the
  // previous value in state" pattern: updating during render is allowed and re-renders at once.
  const tier = tierOf(base);
  const [tierState, setTierState] = useState<{ tier: number; from: number | null }>({ tier, from: null });
  if (tierState.tier !== tier) setTierState({ tier, from: animate ? tierState.tier : null });
  const changedFrom = tierState.tier === tier ? tierState.from : null;
  const shown = gearShown(tier);
  const wasShown = changedFrom === null ? shown : gearShown(changedFrom);
  const gear = (part: GearPart) => (shown[part] ? <PackGear key={part} part={part} isNew={!wasShown[part]} /> : null);
  const tierInfo = TIERS[tier];
  const TierIcon = TIER_ICONS[tierInfo.id];
  const limits = unit === 'imperial' ? ['10 lb', '15 lb'] : ['4.5 kg', '6.8 kg'];
  const tierHint =
    tier === 0 ? `Base weight under ${limits[0]}` : `${formatWeight(base - TIERS[tier - 1].max + 1, unit)} to ${TIERS[tier - 1].name}`;
  const tierTip =
    tier === 0
      ? `Ultralight: base weight under ${limits[0]}`
      : tier === 1
        ? `Lightweight: base weight ${limits[0]} to ${limits[1]}`
        : `Traditional: base weight over ${limits[1]}`;

  const layers = useMemo(() => {
    const heights = layerHeights(
      cats.map((c) => c.grams),
      PACK_BOTTOM - PACK_TOP
    );
    const result = cats.map((c, i) => {
      const h = heights[i];
      const y = PACK_BOTTOM - heights.slice(0, i + 1).reduce((sum, v) => sum + v, 0);
      return {
        cat: c,
        y,
        h,
        pct: percentText(c.grams, total),
        inside: h >= INSIDE_LABEL_MIN,
        dark: luminance(tokenHex(c.colorKey)) > 0.3,
        labelY: 0,
      };
    });
    const outside = result.filter((l) => !l.inside);
    const placed = placeOutsideLabels(
      outside.map((l) => l.y + l.h / 2),
      outsideLabelBottom(tier)
    );
    outside.forEach((l, k) => (l.labelY = placed[k]));
    return result;
  }, [cats, total, tier]);

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
        <svg className="pack-svg" viewBox={VIEWBOX} role="img" aria-label={`Pack weight by category, ${tierInfo.name} pack`}>
          <defs>
            <clipPath id={clipId}>
              <path d={BODY} />
            </clipPath>
          </defs>
          {/* tier gear behind the pack: ice axe and trekking poles */}
          {gear('axe')}
          {gear('poles')}
          {/* behind the body: handle and side pockets */}
          <PackBehind />
          {gear('pockets')}
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
                <title>{`${l.cat.name}: ${formatWeight(l.cat.grams, unit)} (${l.pct})`}</title>
              </rect>
            ))}
            {layers.slice(0, -1).map((l) => (
              <line key={`gap-${l.cat.key}`} className="pack-gap" x1="20" x2="200" y1={l.y.toFixed(2)} y2={l.y.toFixed(2)} />
            ))}
          </g>
          {/* front pocket (the lid seam was removed in v2 — it crossed the percentages) */}
          <PackFrontPocket />
          <path d={BODY} className="pack-outline" />
          {/* percentages inside big layers, drawn above the pocket outline */}
          <g clipPath={`url(#${clipId})`}>
            {layers.map((l) =>
              l.inside ? (
                <text
                  key={`pct-${l.cat.key}`}
                  className="pack-pct"
                  x="110"
                  y={(l.y + l.h / 2 + 5).toFixed(2)}
                  textAnchor="middle"
                  fill={l.dark ? 'var(--ink)' : 'var(--surface)'}
                >
                  {l.pct}
                </text>
              ) : null
            )}
          </g>
          {/* tier gear in front: sleeping pad and boots */}
          {gear('pad')}
          {gear('boots')}
          {/* outside labels for thin layers, joined by a leader line */}
          {layers.map((l, i) =>
            l.inside ? null : (
              <g key={`out-${l.cat.key}`} className={`pack-callout ${activeClass(i)}`} {...focusProps(i)}>
                <path
                  d={`M150 ${(l.y + l.h / 2).toFixed(2)}H196L206 ${l.labelY.toFixed(2)}H212`}
                  className="pack-leader"
                />
                <text x="216" y={(l.labelY + 4).toFixed(2)}>
                  <tspan className="pack-pct-out">{l.pct}</tspan> {l.cat.name}
                </text>
              </g>
            )
          )}
        </svg>
        {/* The tier in words, so the drawing is never the only signal. Keyed by tier, so it
            pops once when the tier changes. */}
        <div className="pack-tier-wrap">
          <span
            key={tier}
            className={`pack-tier pack-tier-${tierInfo.id} ${changedFrom !== null ? 'is-new' : ''}`}
            data-tip={tierTip}
          >
            <Icon icon={TierIcon} size={15} />
            {tierInfo.name}
          </span>
          <span className="pack-tier-hint">{tierHint}</span>
        </div>
        <div className="pack-total">
          <div className="label">In the pack</div>
          <div className="pack-kg">{formatWeight(total, unit)}</div>
        </div>
        <dl className="pack-split">
          <div data-tip="Everything in the pack except consumables">
            <dt>
              <Icon icon={ActionIcon.base} />
              Base weight
            </dt>
            <dd>{formatWeight(base, unit)}</dd>
          </div>
          <div data-tip="Food, fuel and water: in the pack, lighter every day">
            <dt>
              <Icon icon={ActionIcon.consumable} />
              Consumables
            </dt>
            <dd>{formatWeight(consumable, unit)}</dd>
          </div>
          <div className="pack-split-worn" data-tip="Carried on your body, not in the pack">
            <dt>
              <HikerIcon />
              Worn
            </dt>
            <dd>+ {formatWeight(worn, unit)}</dd>
          </div>
          <div className="pack-split-total">
            <dt>
              <Icon icon={ActionIcon.total} />
              Total
            </dt>
            <dd>{formatWeight(total + worn, unit)}</dd>
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
            <span className="legend-p">{l.pct}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
