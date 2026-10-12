# VaultItemRow

A Gear Vault category group: heading (`hb-cat-head`: grip, colour dot, icon, name, total) followed by item rows (`hb-row--vault`) and an "Add item" line at the end.

- Row columns: grip · name + note · carabiner badge if used in gearlists · weight · default quantity · actions (revealed on hover/focus).
- Name, note, weight and quantity are InlineFields. Category name in the heading is an InlineField too (rename).
- Editing name/category/weight of a used item still opens the blocking 3-way dialog (see Dialog). Never a toast.
