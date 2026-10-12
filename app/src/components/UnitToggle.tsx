import { useApp } from '../state/AppContext';
import type { UnitPreference } from '../types';

/** FR-3: metric/imperial display switch. Weights stay stored in grams. */
export function UnitToggle() {
  const { state, setUnitPreference } = useApp();
  return <UnitSwitch value={state.unitPreference} onChange={setUnitPreference} />;
}

/** The segmented control itself — also used on the shared gearlist page with local state. */
export function UnitSwitch({ value, onChange }: { value: UnitPreference; onChange: (unit: UnitPreference) => void }) {
  return (
    <div className="segmented unit-toggle" role="group" aria-label="Units">
      <button type="button" aria-pressed={value === 'metric'} onClick={() => onChange('metric')}>
        g / kg
      </button>
      <button type="button" aria-pressed={value === 'imperial'} onClick={() => onChange('imperial')}>
        oz / lb
      </button>
    </div>
  );
}
