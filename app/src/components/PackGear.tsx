import type { ReactNode } from 'react';
import type { GearPart } from '../utils/pack';

/**
 * Gear strapped onto the backpack chart per pack tier (FR-19, design system v3) — geometry
 * copied from GEAR in design/2026-10-redesign/design-system/components/bundle.js, in the
 * chart's viewBox (-30 0 370 306). Neutral fills with the pack's ink outline, so the colour
 * layers stay the hero.
 *
 * - Lightweight: a folded foam sleeping pad strapped under the pack.
 * - Traditional: + ice axe lashed on the left, trekking poles upright on the right (the
 *   counterweight to the axe), two more side pockets and a pair of hiking boots in profile
 *   standing at the bottom right, tied to the poles by a lace.
 */
const PART = 'pack-gear-part';

function Pad() {
  return (
    <>
      <rect x="34" y="258" width="152" height="34" rx="12" className={PART} style={{ fill: 'var(--ridge-2)' }} />
      <path d="M50 262v26M66 262v26M82 262v26M98 262v26M122 262v26M138 262v26M154 262v26M170 262v26" className="pack-detail" strokeOpacity={0.35} strokeWidth={1.5} />
      <rect x="64" y="252" width="10" height="46" rx="2" className={PART} />
      <rect x="146" y="252" width="10" height="46" rx="2" className={PART} />
      <rect x="62" y="276" width="14" height="8" rx="2" className="pack-buckle" />
      <rect x="144" y="276" width="14" height="8" rx="2" className="pack-buckle" />
    </>
  );
}

function Axe() {
  return (
    <>
      <rect x="12" y="108" width="7" height="166" rx="3" className={PART} />
      <path d="M-22 120Q-6 103 16 102H32Q41 102 43 108L39 111Q34 108 24 109H18Q-2 110 -22 120Z" className={PART} />
      <path d="M12 274l3.5 14 3.5-14" className={PART} />
      <path d="M19 200q14 6 8 22" className="pack-detail" strokeWidth={1.5} />
    </>
  );
}

function Pockets() {
  return (
    <>
      <rect x="29" y="92" width="19" height="48" rx="7" className={PART} />
      <rect x="172" y="92" width="19" height="48" rx="7" className={PART} />
    </>
  );
}

function Pole({ x, y, length }: { x: number; y: number; length: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-3" y="16" width="6" height={length} rx="3" className={PART} style={{ fill: 'var(--sun)' }} />
      <rect x="-5" y="0" width="10" height="24" rx="4" className={PART} style={{ fill: 'var(--ridge-5)' }} />
      <path d="M4 3c10 2 12 14 2 16" className="pack-detail" strokeWidth={1.75} />
      <path d={`M-2 ${16 + length}L0 ${26 + length}L2 ${16 + length}`} className={PART} />
    </g>
  );
}

function Poles() {
  return (
    <>
      <Pole x={197} y={128} length={144} />
      <Pole x={207} y={122} length={148} />
    </>
  );
}

function Boot({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1.15)`}>
      <path d="M4-2V-31Q4-37 10-37H22Q27-37 27-32V-22L38-16Q47-12 47-6V-2Z" className={PART} style={{ fill }} />
      <path d="M4-31H27" className="pack-detail" strokeWidth={1.75} />
      <path d="M22-28l6 2M23-23l6 2M25-18l6 2" className="pack-detail" strokeWidth={1.75} />
      <path d="M2-3H47Q50-3 50 1V2Q50 5 47 5H5Q2 5 2 2Z" style={{ fill: 'var(--ink)' }} />
    </g>
  );
}

function Boots() {
  return (
    <>
      {/* the lace tying the boots to the poles */}
      <path d="M205 214Q214 236 214 250" className="pack-detail" strokeWidth={1.5} />
      <Boot x={176} y={297} fill="var(--ridge-2)" />
      <Boot x={192} y={301} fill="var(--ridge-3)" />
    </>
  );
}

const PARTS: Record<GearPart, () => ReactNode> = {
  pad: Pad,
  axe: Axe,
  pockets: Pockets,
  poles: Poles,
  boots: Boots,
};

/** One piece of gear. `isNew` = it appeared because the tier just changed → it drops in once. */
export function PackGear({ part, isNew }: { part: GearPart; isNew: boolean }) {
  const Part = PARTS[part];
  return (
    <g className={`pack-gear ${isNew ? 'is-new' : ''}`} data-gear={part}>
      <Part />
    </g>
  );
}
