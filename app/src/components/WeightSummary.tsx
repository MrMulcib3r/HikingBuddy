import type { UnitPreference, WeightBreakdown } from '../types';
import { formatWeight } from '../utils/weight';

/** FR-10: the four weight tiles — used on a gearlist and on a shared gearlist page (FR-18). */
export function WeightSummary({ breakdown, unit }: { breakdown: WeightBreakdown; unit: UnitPreference }) {
  return (
    <div className="weight-summary">
      <div className="weight-tile">
        <span className="weight-tile-label">Base Weight</span>
        <span className="weight-tile-value">{formatWeight(breakdown.base, unit)}</span>
      </div>
      <div className="weight-tile">
        <span className="weight-tile-label">Worn Weight</span>
        <span className="weight-tile-value">{formatWeight(breakdown.worn, unit)}</span>
      </div>
      <div className="weight-tile">
        <span className="weight-tile-label">Consumables</span>
        <span className="weight-tile-value">{formatWeight(breakdown.consumable, unit)}</span>
      </div>
      <div className="weight-tile weight-tile-total">
        <span className="weight-tile-label">Total</span>
        <span className="weight-tile-value">{formatWeight(breakdown.total, unit)}</span>
      </div>
    </div>
  );
}
