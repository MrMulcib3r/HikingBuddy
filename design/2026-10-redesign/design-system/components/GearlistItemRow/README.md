# GearlistItemRow

A row in a gearlist: grip · name + note · Worn/Consumable flags · weight per unit · quantity · subtotal · remove.

- Quantity and note are InlineFields that never trigger a dialog; name/weight edits of a used Vault item go through the 3-way dialog, same as in the Vault.
- `hb-row--readonly` (no grip, no actions, flags shown as text badges) is used for snapshots and the shared page.
- `hb-drop-hint` shows where an item dragged from the Vault will land. Adding an item already in the list raises its quantity; no duplicate rows.
- Under 560px the row wraps into two lines (PRD v9).
