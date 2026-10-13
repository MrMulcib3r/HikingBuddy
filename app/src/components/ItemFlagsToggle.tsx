import { ActionIcon } from './icons/actionIcons';
import { BootIcon } from './icons/HikerIcons';
import { Badge, Icon } from './ui';

interface ItemFlagsToggleProps {
  isWorn: boolean;
  isConsumable: boolean;
  onChange: (patch: { isWorn?: boolean; isConsumable?: boolean }) => void;
}

const WORN_TIP = 'Worn: carried on your body, not in the pack';
const CONSUMABLE_TIP = 'Consumable: food, fuel, water';

/**
 * Two independent one-click toggles — Worn (boot) and Consumable (cutlery), FR-19 icons.
 * Purely per-gearlist-item (FR-9/FR-10): never shows a confirmation dialog, because it has
 * no effect on the Gear Vault or on any other gearlist. Neither flag set means "base weight".
 */
export function ItemFlagsToggle({ isWorn, isConsumable, onChange }: ItemFlagsToggleProps) {
  return (
    <div className="item-flags-toggle" role="group" aria-label="Worn / Consumable">
      <button
        type="button"
        className="flag-btn flag-worn"
        aria-pressed={isWorn}
        aria-label="Worn"
        data-tip={WORN_TIP}
        onClick={(e) => {
          e.stopPropagation();
          onChange({ isWorn: !isWorn });
        }}
      >
        <BootIcon />
      </button>
      <button
        type="button"
        className="flag-btn flag-consumable"
        aria-pressed={isConsumable}
        aria-label="Consumable"
        data-tip={CONSUMABLE_TIP}
        onClick={(e) => {
          e.stopPropagation();
          onChange({ isConsumable: !isConsumable });
        }}
      >
        <Icon icon={ActionIcon.consumable} />
      </button>
    </div>
  );
}

/** Read-only flags (snapshot, shared page): text badges, so the meaning is readable without
 * hovering — the shared page is phone-first (design system v2). */
export function ItemFlagsBadges({ isWorn, isConsumable }: { isWorn: boolean; isConsumable: boolean }) {
  return (
    <span className="shared-flags">
      {isWorn && (
        <Badge tone="linked" icon={BootIcon} tip={WORN_TIP}>
          Worn
        </Badge>
      )}
      {isConsumable && (
        <Badge tone="linked" icon={ActionIcon.consumable} tip={CONSUMABLE_TIP}>
          Consumable
        </Badge>
      )}
    </span>
  );
}
