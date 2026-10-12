import type { UnitPreference, WeightBreakdown } from '../types';
import { formatWeight } from '../utils/weight';
import { ActionIcon } from './icons/actionIcons';
import { BootIcon } from './icons/HikerIcons';
import { Icon } from './ui';

/** FR-10: the four weight tiles — gearlist, template and the shared gearlist page (FR-18).
 * Order and icons from the FR-19 design system: Base, Consumables, Worn, Total. */
export function WeightSummary({ breakdown, unit }: { breakdown: WeightBreakdown; unit: UnitPreference }) {
  return (
    <div className="weight-summary">
      <div className="weight-tile">
        <span className="weight-tile-label label">
          <Icon icon={ActionIcon.base} size={15} />
          Base Weight
        </span>
        <span className="weight-tile-value">{formatWeight(breakdown.base, unit)}</span>
      </div>
      <div className="weight-tile">
        <span className="weight-tile-label label">
          <Icon icon={ActionIcon.consumable} size={15} />
          Consumables
        </span>
        <span className="weight-tile-value">{formatWeight(breakdown.consumable, unit)}</span>
      </div>
      <div className="weight-tile">
        <span className="weight-tile-label label">
          <BootIcon size={15} />
          Worn Weight
        </span>
        <span className="weight-tile-value">{formatWeight(breakdown.worn, unit)}</span>
      </div>
      <div className="weight-tile weight-tile-total">
        <span className="weight-tile-label label">
          <Icon icon={ActionIcon.total} size={15} />
          Total
        </span>
        <span className="weight-tile-value">{formatWeight(breakdown.total, unit)}</span>
      </div>
    </div>
  );
}
