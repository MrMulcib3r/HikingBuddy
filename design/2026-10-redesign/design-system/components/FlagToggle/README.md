# FlagToggle

The Worn and Consumable switches on a gearlist row: two independent icon toggles, boot (`HB.icons.boot`) for Worn and cutlery (Lucide `utensils`) for Consumable.

- State lives in `aria-pressed`; on = accent-soft fill, accent ring and icon. Both off = base weight.
- Tooltips: "Worn: carried on your body, not in the pack" and "Consumable: food, fuel, water".
- Behaviour unchanged: clicking never opens a dialog and never touches the Gear Vault item (CLAUDE.md). Replaces the text buttons in `ItemFlagsToggle.tsx`.
