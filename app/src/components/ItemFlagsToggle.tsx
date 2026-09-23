interface ItemFlagsToggleProps {
  isWorn: boolean;
  isConsumable: boolean;
  onChange: (patch: { isWorn?: boolean; isConsumable?: boolean }) => void;
}

/**
 * Two independent one-click toggles — Worn and Consumable — matching lighterpack's icon
 * buttons. Purely per-gearlist-item (FR-9/FR-10): never shows a confirmation dialog,
 * because it has no effect on the Gear Vault or on any other gearlist. Neither flag set
 * means "base weight".
 */
export function ItemFlagsToggle({ isWorn, isConsumable, onChange }: ItemFlagsToggleProps) {
  return (
    <div className="item-flags-toggle" role="group" aria-label="Worn / Consumable">
      <button
        type="button"
        className={`flag-btn flag-worn ${isWorn ? 'active' : ''}`}
        title="Worn weight (carried on your body, not in the pack)"
        onClick={(e) => {
          e.stopPropagation();
          onChange({ isWorn: !isWorn });
        }}
      >
        Worn
      </button>
      <button
        type="button"
        className={`flag-btn flag-consumable ${isConsumable ? 'active' : ''}`}
        title="Consumable (food, fuel, etc.)"
        onClick={(e) => {
          e.stopPropagation();
          onChange({ isConsumable: !isConsumable });
        }}
      >
        Consumable
      </button>
    </div>
  );
}
