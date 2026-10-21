# WidgetProposedChanges

What the AI wants to add, remove or change, before anything is saved (PRD v33, FR-27 "Návrh změn"). The data changes only after the user confirms.

- **Head:** label "PROPOSED CHANGES", the gearlist name (`w-title`), meta "5 changes · 2 decided".
- **Impact** (`hbw-impact`): what the whole proposal does to the pack: "Base weight **5.47 kg → 4.96 kg** (−508 g)", delta in `forest` when lighter, `danger` when heavier, always with the sign.
- **One row per change** (`hbw-change`): kind badge in words and icon (`hbw-kind--add` "Add" `plus`; `--remove` "Remove" `minus` (from this gearlist); `--delete` "Delete" `trash-2` (from Gear Vault, soft delete); `--change` "Change" `pencil`), item name, weight, and a detail line ("Weight 85 g → 79 g" with the old value struck through, "Mark as Worn", "To Cooking", or the AI's one-line reason).
- **Per row:** "Reject" (ghost, `x`) and "Confirm" (secondary, `check`), each 44px tall with its word. A decided row keeps its place and shows "Confirmed" (`forest`, `check`) or "Rejected" (name struck through, `ink-subtle`) with "Undo" (ghost) to change the decision before saving.
- **Vault item used elsewhere (FR-5):** the row says so in words: carabiner + "Also in 2 other gearlists: Nordkalottleden 2027, Weekend Beskydy". Instead of Confirm it offers the same choice as the web's blocking dialog: **"Create a copy"** (secondary, `copy-plus`) and **"Update everywhere"** (secondary, `check`), plus Reject. Labels differ from the web's "Create a copy of the item / Continue" because "Continue" means nothing without the dialog around it; they map 1:1 to the MCP choice `create_copy` / `update_everywhere`.
- **Foot, max two actions:** "Reject all" (secondary) and **"Confirm all (2)"** (primary, counts the undecided rows it will confirm). Confirm all never decides an FR-5 row: it is skipped and a line above the buttons says "Sawyer Squeeze needs your choice. Confirm all skips it."
- **Each Confirm saves that change at once** (Martin, 2026-10-21): it is its own AI step and Activity entry; "Confirm all" saves the rest as one step. Closing the chat halfway keeps what was confirmed; when every row is decided the widget turns into the success state (WidgetStates).
- A proposal older than the data it changes (the gearlist was edited meanwhile) shows the "out of date" state instead of buttons.
- Rows stack (buttons under the text) under 520px container width.
