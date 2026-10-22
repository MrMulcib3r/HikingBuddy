/**
 * The widget's views (PRD v33, FR-27), one per design-system component: WidgetPackSummary,
 * WidgetGearList, WidgetItemCard, WidgetStates. WidgetProposedChanges is in Proposal.tsx.
 * They only draw the view the server sent (src/core/widgetViews.ts); nothing here edits data.
 * Rules from the design: no inner scrolling, no tooltips or menus, 44px controls, max 2 actions.
 */
import { useId, useState, type ReactNode } from 'react';
import {
  Backpack,
  CircleCheck,
  CircleX,
  ExternalLink,
  Feather,
  Footprints,
  Hourglass,
  KeyRound,
  Mountain,
  PackageOpen,
  RefreshCw,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { GearView, ItemView, StateView, SummaryView, ViewBase } from '../src/core/widgetViews';
import { CategoryIcon } from '../src/components/CategoryIcon';
import { CarabinerIcon, HikerIcon } from '../src/components/icons/HikerIcons';
import { PackBehind, PackFrontPocket, PackGear } from '../src/components/PackGear';
import { categoryColor } from '../src/utils/categoryStyle';
import { gearShown, layerHeights, PACK_BODY, PACK_BOTTOM, PACK_TOP, TIERS, tierOf, type GearPart } from '../src/utils/pack';
import { formatWeight } from '../src/utils/weight';

const STROKE = 1.75;
const TIER_ICONS = { ultralight: Feather, lightweight: Footprints, traditional: Mountain };

/** How many gear rows show before "Show all" (design token --widget-rows-inline). */
const ROWS_INLINE = 8;

export type OpenLink = (url: string) => void;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="hbw" aria-label={label}>
      {children}
    </section>
  );
}

export function Head({ label, title, meta }: { label?: string; title: string; meta?: string }) {
  return (
    <div className="hbw-head">
      <div className="hbw-head-main">
        {label && <span className="hb-label">{label}</span>}
        <h3 className="hbw-title">{title}</h3>
        {meta && <span className="hbw-meta">{meta}</span>}
      </div>
    </div>
  );
}

export function OpenInApp({ view, openLink }: { view: ViewBase; openLink: OpenLink }) {
  if (!view.link) return null;
  const link = view.link;
  return (
    <button type="button" className="hbw-link" onClick={() => openLink(link)}>
      Open in HikingBuddy
      <ExternalLink size={16} strokeWidth={STROKE} aria-hidden="true" />
    </button>
  );
}

export function Foot({ children }: { children: ReactNode }) {
  return <div className="hbw-foot">{children}</div>;
}

// ---------------------------------------------------------------------------------------------
// WidgetPackSummary

/** Compact pack (HB.miniPack): same shape, layer order and tier gear as BackpackChart, without
 * percentages, labels, hover or animation; the category list beside it carries the numbers. */
function MiniPack({ view }: { view: SummaryView }) {
  const clipId = useId();
  const cats = view.categories;
  const inPack = cats.reduce((sum, c) => sum + c.grams, 0);
  const tier = tierOf(view.base);
  const shown = gearShown(tier);
  const heights = layerHeights(
    cats.map((c) => c.grams),
    PACK_BOTTOM - PACK_TOP
  );
  // Heaviest at the bottom: each layer's top is the pack bottom minus the layers below it.
  const layers = cats.map((c, i) => ({
    key: c.name,
    y: PACK_BOTTOM - heights.slice(0, i + 1).reduce((sum, h) => sum + h, 0),
    h: heights[i],
    color: categoryColor(c.colorKey),
  }));
  const gear = (part: GearPart) => (shown[part] ? <PackGear part={part} isNew={false} /> : null);
  return (
    <svg viewBox="-28 0 284 306" role="img" aria-label={`${TIERS[tier].name} pack, ${formatWeight(inPack, view.unit)} in the pack`}>
      <defs>
        <clipPath id={clipId}>
          <path d={PACK_BODY} />
        </clipPath>
      </defs>
      {gear('axe')}
      {gear('poles')}
      <PackBehind />
      {gear('pockets')}
      <path d={PACK_BODY} className="pack-empty" />
      <g clipPath={`url(#${clipId})`}>
        {layers.map((l) => (
          <rect key={l.key} x="20" y={l.y.toFixed(2)} width="180" height={(l.h + 0.5).toFixed(2)} fill={l.color} />
        ))}
        {layers.slice(0, -1).map((l) => (
          <line key={`gap-${l.key}`} className="pack-gap" x1="20" x2="200" y1={l.y.toFixed(2)} y2={l.y.toFixed(2)} />
        ))}
      </g>
      <PackFrontPocket />
      <path d={PACK_BODY} className="pack-outline" />
      {gear('pad')}
      {gear('boots')}
    </svg>
  );
}

function tierHint(base: number, unit: ViewBase['unit']): string {
  const tier = tierOf(base);
  if (tier === 0) return `Base weight under ${unit === 'imperial' ? '10 lb' : '4.5 kg'}`;
  return `${formatWeight(base - TIERS[tier - 1].max + 1, unit)} to ${TIERS[tier - 1].name}`;
}

export function Summary({ view, openLink }: { view: SummaryView; openLink: OpenLink }) {
  if (view.itemCount === 0) {
    return (
      <State
        icon={Backpack}
        tone="muted"
        title={`${view.title} has no gear yet`}
        text="Ask in the chat to add gear from your Gear Vault."
        foot={<OpenInApp view={view} openLink={openLink} />}
      />
    );
  }
  const w = (g: number) => formatWeight(g, view.unit);
  const tier = TIERS[tierOf(view.base)];
  const TierIcon = TIER_ICONS[tier.id];
  const inPack = view.categories.reduce((sum, c) => sum + c.grams, 0);
  return (
    <Frame label={`Weight summary of ${view.title}`}>
      <Head title={view.title} meta={`${view.isTemplate ? 'Template · ' : ''}${plural(view.itemCount, 'item')}`} />
      <div className="hbw-sum">
        <div className="hbw-pack">
          <MiniPack view={view} />
          <span className={`hbw-tier hbw-tier--${tier.id}`}>
            <TierIcon size={14} strokeWidth={STROKE} aria-hidden="true" />
            {tier.name}
          </span>
          <span className="hbw-caption">{tierHint(view.base, view.unit)}</span>
        </div>
        <div className="hbw-total">
          <span className="hb-label">Total</span>
          <span className="hbw-total-n">{w(view.total)}</span>
          <dl className="hbw-split">
            <div>
              <dt>
                <Backpack strokeWidth={STROKE} aria-hidden="true" />
                Base
              </dt>
              <dd>{w(view.base)}</dd>
            </div>
            <div>
              <dt>
                <Utensils strokeWidth={STROKE} aria-hidden="true" />
                Consumables
              </dt>
              <dd>{w(view.consumable)}</dd>
            </div>
            <div className="hbw-split-worn">
              <dt>
                <HikerIcon className="hb-ico" />
                Worn
              </dt>
              <dd>+ {w(view.worn)}</dd>
            </div>
          </dl>
        </div>
        {view.categories.length > 0 && (
          <ul className="hbw-cats" aria-label="Categories in the pack">
            {view.categories.map((c) => (
              <li key={c.name} className="hbw-cat">
                <span className="hb-swatch" style={{ background: categoryColor(c.colorKey) }} />
                <CategoryIcon id={c.iconId} name={c.name} size={16} />
                <span className="hbw-cat-name">{c.name}</span>
                <span className="hbw-cat-w">{w(c.grams)}</span>
                <span className="hbw-cat-p">{inPack > 0 ? `${Math.round((c.grams / inPack) * 100)} %` : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Foot>
        <OpenInApp view={view} openLink={openLink} />
      </Foot>
    </Frame>
  );
}

// ---------------------------------------------------------------------------------------------
// WidgetGearList

export function GearList({ view, openLink }: { view: GearView; openLink: OpenLink }) {
  const [all, setAll] = useState(false);
  if (view.itemCount === 0) {
    if (view.source === 'gearlist') {
      return <State icon={Backpack} tone="muted" title={`${view.title} has no gear yet`} text="Ask in the chat to add gear from your Gear Vault." />;
    }
    return <State icon={PackageOpen} tone="muted" title="No gear found" text="Nothing in your Gear Vault matches. Ask in the chat with other words." />;
  }
  const w = (g: number) => formatWeight(g, view.unit);
  const withFlags = view.source === 'gearlist' || view.source === 'snapshot';
  // The first ROWS_INLINE rows across the groups, then "Show all".
  const limit = all ? Infinity : ROWS_INLINE;
  const groups = view.groups
    .map((g, i) => {
      const before = view.groups.slice(0, i).reduce((n, x) => n + x.rows.length, 0);
      return { ...g, rows: g.rows.slice(0, Math.max(0, limit - before)) };
    })
    .filter((g) => g.rows.length > 0);
  return (
    <Frame label={view.title}>
      <Head title={view.title} meta={`${plural(view.itemCount, 'item')} · ${w(view.totalGrams)}`} />
      <div className="hbw-groups">
        {groups.map((g) => {
          const rows = g.rows;
          return (
            <div key={g.name} className="hbw-group">
              <div className="hbw-group-head">
                <span className="hb-dot" style={{ background: categoryColor(g.colorKey) }} />
                <CategoryIcon id={g.iconId} name={g.name} size={16} />
                <span className="hb-label">{g.name}</span>
                <span className="hbw-num">{w(g.grams)}</span>
              </div>
              {rows.map((r, i) => (
                <div key={`${r.name}-${i}`} className="hbw-row">
                  <div>
                    <div className="hbw-row-name">{r.name}</div>
                    {r.note && <div className="hbw-row-note">{r.note}</div>}
                  </div>
                  <div className="hbw-row-flags">
                    {withFlags && r.worn && <span className="hb-badge">Worn</span>}
                    {withFlags && r.consumable && <span className="hb-badge">Consumable</span>}
                  </div>
                  <span className="hbw-row-w">
                    {r.quantity > 1 && <span className="hbw-row-q">{r.quantity}×</span>}
                    {w(r.grams * r.quantity)}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {!all && view.itemCount > ROWS_INLINE && (
        <button type="button" className="hb-btn hb-btn--ghost hbw-show-all" onClick={() => setAll(true)}>
          Show all {view.itemCount} items
        </button>
      )}
      <Foot>
        <OpenInApp view={view} openLink={openLink} />
      </Foot>
    </Frame>
  );
}

// ---------------------------------------------------------------------------------------------
// WidgetItemCard

export function ItemCard({ view, openLink }: { view: ItemView; openLink: OpenLink }) {
  return (
    <Frame label={view.name}>
      <div className="hbw-item">
        <div className="hbw-head-main">
          <h3 className="hbw-title">{view.name}</h3>
          <span className="hbw-item-cat">
            <span className="hb-dot" style={{ background: categoryColor(view.category.colorKey) }} />
            <CategoryIcon id={view.category.iconId} name={view.category.name} size={16} />
            {view.category.name}
          </span>
        </div>
        <div className="hbw-item-w">{formatWeight(view.grams, view.unit)}</div>
        {view.note && <p className="hbw-note">{view.note}</p>}
        <dl className="hbw-facts">
          <dt>In gearlists</dt>
          <dd>
            {view.inLists.length > 0 ? (
              <span className="hbw-in-lists">
                <CarabinerIcon className="hb-ico" />
                <span>{view.inLists.join(', ')}</span>
              </span>
            ) : (
              'Not in any gearlist'
            )}
          </dd>
          {view.row && (
            <>
              <dt>Quantity</dt>
              <dd>{view.row.quantity}</dd>
              {(view.row.worn || view.row.consumable) && (
                <>
                  <dt>In {view.row.listName}</dt>
                  <dd>
                    {view.row.worn && <span className="hb-badge">Worn</span>}
                    {view.row.consumable && <span className="hb-badge">Consumable</span>}
                  </dd>
                </>
              )}
            </>
          )}
        </dl>
      </div>
      <Foot>
        <OpenInApp view={view} openLink={openLink} />
      </Foot>
    </Frame>
  );
}

// ---------------------------------------------------------------------------------------------
// WidgetStates

type Tone = 'success' | 'error' | 'warning' | 'muted';

export function State({ icon: I, tone, title, text, foot }: { icon: LucideIcon; tone: Tone; title: string; text: ReactNode; foot?: ReactNode }) {
  return (
    <Frame label={title}>
      <div className={`hbw-state hbw-state--${tone}`}>
        <span className="hbw-state-ico">
          <I strokeWidth={STROKE} aria-hidden="true" />
        </span>
        <div>
          <h3 className="hbw-state-title">{title}</h3>
          <div className="hbw-state-text">{text}</div>
        </div>
      </div>
      {foot && <Foot>{foot}</Foot>}
    </Frame>
  );
}

const STATE_LOOK: Record<StateView['state'], { icon: LucideIcon; tone: Tone }> = {
  saved: { icon: CircleCheck, tone: 'success' },
  'empty-vault': { icon: PackageOpen, tone: 'muted' },
  limit: { icon: Hourglass, tone: 'warning' },
  error: { icon: CircleX, tone: 'error' },
  access: { icon: KeyRound, tone: 'muted' },
};

export function StateCard({ view, openLink, onRetry }: { view: StateView; openLink: OpenLink; onRetry?: () => void }) {
  const look = STATE_LOOK[view.state];
  const foot =
    view.state === 'error' && onRetry ? (
      <div className="hbw-foot-actions">
        <button type="button" className="hb-btn hb-btn--secondary" onClick={onRetry}>
          Try again
        </button>
      </div>
    ) : view.link ? (
      <OpenInApp view={view} openLink={openLink} />
    ) : undefined;
  return <State icon={look.icon} tone={look.tone} title={view.title} text={view.text} foot={foot} />;
}

export function OutOfDate({ listName }: { listName: string }) {
  return <State icon={RefreshCw} tone="warning" title="This proposal is out of date" text={`${listName} changed after it was made. Ask for a new proposal.`} />;
}

/** Loading: a skeleton in the layout of the pack summary (the most common widget). No spinner. */
export function Skeleton() {
  return (
    <Frame label="Loading HikingBuddy">
      <span className="visually-hidden">Loading…</span>
      <span className="hbw-skel" style={{ width: '45%', height: 22 }} />
      <div className="hbw-sum">
        <span className="hbw-skel hbw-skel-pack" />
        <div className="hbw-skel-lines">
          <span className="hbw-skel" style={{ width: '60%', height: 30 }} />
          <span className="hbw-skel" style={{ height: 16 }} />
          <span className="hbw-skel" style={{ height: 16 }} />
          <span className="hbw-skel" style={{ height: 16 }} />
        </div>
      </div>
    </Frame>
  );
}
