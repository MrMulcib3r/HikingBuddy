import { useMemo, useState } from 'react';
import { computeBreakdown } from '../state/logic';
import { sharedItemsAsListItems, type SharedGearlist } from '../share';
import type { UnitPreference } from '../types';
import { formatWeight } from '../utils/weight';
import { categoryColor, templateIdForKey } from '../utils/categoryStyle';
import { WeightSummary } from './WeightSummary';
import { BackpackChart } from './BackpackChart';
import { packCategoriesFromItems } from '../utils/pack';
import { CategoryIcon } from './CategoryIcon';
import { ItemFlagsBadges } from './ItemFlagsToggle';
import { UnitSwitch } from './UnitToggle';
import { AppFrame } from './AppFrame';

/**
 * FR-18: the page a share link opens. Read-only and fully separate from the visitor's own
 * app — it doesn't load or save their data (it isn't even inside AppProvider). The unit
 * switch only changes this page's display. Same look as the app (FR-19): backpack chart,
 * weight tiles, category colours and icons from the link (v2) or the default names (v1).
 */
export function SharedGearlistPage({ shared }: { shared: SharedGearlist | null }) {
  const [unit, setUnit] = useState<UnitPreference>(shared?.unitPreference ?? 'metric');
  const items = useMemo(() => (shared ? sharedItemsAsListItems(shared) : []), [shared]);
  const breakdown = useMemo(() => computeBreakdown(items), [items]);
  const packCategories = useMemo(() => {
    const byName = new Map(shared?.categories.map((c) => [c.name, c.colorKey]) ?? []);
    return packCategoriesFromItems(items, (name) => {
      const colorKey = byName.get(name) ?? 'none';
      return { colorKey, iconId: templateIdForKey(colorKey) };
    });
  }, [items, shared]);
  const appUrl = `${window.location.origin}${window.location.pathname}`;

  return (
    <AppFrame
      actions={
        <>
          {shared && <UnitSwitch value={unit} onChange={setUnit} />}
          <a className="btn btn-primary btn-small" href={appUrl}>
            Open HikingBuddy
          </a>
        </>
      }
    >
      <main className="shared-page">
        {!shared ? (
          <div className="welcome-card shared-panel">
            <h2>This link doesn't work</h2>
            <p>The shared gearlist couldn't be read — the link may have been cut off when it was copied. Ask for the link again.</p>
          </div>
        ) : (
          <section className="panel shared-panel">
            <header className="panel-header">
              <div>
                <p className="label shared-label">Shared gearlist · read-only</p>
                <h2 className="shared-title">{shared.name}</h2>
              </div>
            </header>
            <div className="panel-body shared-content">
              <div className="list-detail-overview">
                <BackpackChart categories={packCategories} consumable={breakdown.consumable} worn={breakdown.worn} unit={unit} />
                <WeightSummary breakdown={breakdown} unit={unit} />
              </div>
              <div className="list-items">
                {shared.categories.map((group) => (
                  <div key={group.name} className="list-category-group">
                    <h4 className="list-category-title">
                      <span className="category-dot" style={{ background: categoryColor(group.colorKey) }} aria-hidden="true" />
                      <span className="category-heading-icon">
                        <CategoryIcon id={templateIdForKey(group.colorKey)} name={group.name} size={18} />
                      </span>
                      <span className="category-heading-text">{group.name}</span>
                      <span className="list-category-total shared-category-total">
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
                        <ItemFlagsBadges isWorn={item.isWorn} isConsumable={item.isConsumable} />
                        <span className="list-item-weight">{formatWeight(item.weightGrams, unit)}</span>
                        <span className="list-item-qty">×{item.quantity}</span>
                        <span className="list-item-subtotal">{formatWeight(item.weightGrams * item.quantity, unit)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </AppFrame>
  );
}
