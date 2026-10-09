import { useMemo, useState } from 'react';
import { computeBreakdown } from '../state/logic';
import { sharedItemsAsListItems, type SharedGearlist } from '../share';
import type { UnitPreference } from '../types';
import { formatWeight } from '../utils/weight';
import { WeightSummary } from './WeightSummary';

/**
 * FR-18: the page a share link opens. Read-only and fully separate from the visitor's own
 * app — it doesn't load or save their data (it isn't even inside AppProvider). The unit
 * switch only changes this page's display.
 */
export function SharedGearlistPage({ shared }: { shared: SharedGearlist | null }) {
  const [unit, setUnit] = useState<UnitPreference>(shared?.unitPreference ?? 'metric');
  const items = useMemo(() => (shared ? sharedItemsAsListItems(shared) : []), [shared]);
  const breakdown = useMemo(() => computeBreakdown(items), [items]);
  const appUrl = `${window.location.origin}${window.location.pathname}`;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>HikingBuddy</h1>
        <div className="app-header-actions">
          {shared && (
            <div className="unit-toggle">
              <button type="button" className={unit === 'metric' ? 'active' : ''} onClick={() => setUnit('metric')}>
                kg / g
              </button>
              <button type="button" className={unit === 'imperial' ? 'active' : ''} onClick={() => setUnit('imperial')}>
                lb / oz
              </button>
            </div>
          )}
          <a className="btn btn-primary btn-small" href={appUrl}>
            Open HikingBuddy
          </a>
        </div>
      </header>

      <main className="shared-page">
        {!shared ? (
          <div className="welcome-card">
            <h2>This link doesn't work</h2>
            <p>The shared gearlist couldn't be read — the link may have been cut off when it was copied. Ask for the link again.</p>
          </div>
        ) : (
          <div className="shared-content">
            <p className="shared-label">Shared gearlist · read-only</p>
            <h2 className="shared-title">{shared.name}</h2>
            <WeightSummary breakdown={breakdown} unit={unit} />
            <div className="list-items">
              {shared.categories.map((group) => (
                <div key={group.name} className="list-category-group">
                  <h4 className="list-category-title">
                    {group.name}
                    <span className="shared-category-total">
                      {formatWeight(
                        group.items.reduce((sum, it) => sum + it.weightGrams * it.quantity, 0),
                        unit
                      )}
                    </span>
                  </h4>
                  {group.items.map((item, i) => (
                    <div key={i} className="list-item-row list-item-row-readonly">
                      <div className="list-item-main">
                        <span className="list-item-name">{item.name}</span>
                        {item.note && <span className="list-item-note">{item.note}</span>}
                      </div>
                      <span className="shared-flags">
                        {item.isWorn && <span className="shared-flag">Worn</span>}
                        {item.isConsumable && <span className="shared-flag">Consumable</span>}
                      </span>
                      <span className="list-item-weight">{formatWeight(item.weightGrams, unit)}</span>
                      <span className="list-item-qty">×{item.quantity}</span>
                      <span className="list-item-subtotal">{formatWeight(item.weightGrams * item.quantity, unit)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
