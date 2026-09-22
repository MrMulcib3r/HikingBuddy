import { useApp } from '../state/AppContext';

/** FR-3: přepínání metrických/imperiálních jednotek pro zobrazení. */
export function UnitToggle() {
  const { state, setUnitPreference } = useApp();
  return (
    <div className="unit-toggle">
      <button
        type="button"
        className={state.unitPreference === 'metric' ? 'active' : ''}
        onClick={() => setUnitPreference('metric')}
      >
        kg / g
      </button>
      <button
        type="button"
        className={state.unitPreference === 'imperial' ? 'active' : ''}
        onClick={() => setUnitPreference('imperial')}
      >
        lb / oz
      </button>
    </div>
  );
}
