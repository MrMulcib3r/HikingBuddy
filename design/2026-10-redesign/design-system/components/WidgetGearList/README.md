# WidgetGearList

Compact list of gear in the chat (PRD v33, FR-27): a gearlist's rows, the Gear Vault, or search results. Item name, weight and category icon.

- **Head:** title ("Jeseníky, 3 days" / "Gear Vault" / "Search: rain") and meta "27 items · 9.06 kg".
- **Groups by category** (`hbw-group-head`): colour dot, category icon, name in `label`, category subtotal. Rows (`hbw-row`): name, Worn / Consumable as small **text badges** (gearlist only; same rule as the shared page: in the chat there is no column header to explain icon-only flags), "2×" before the weight when quantity > 1, weight right-aligned, tabular.
- **No inner scrolling (changed from "scrollable"):** AI apps let the conversation own vertical scrolling and cap a widget's height, so a scroll box inside the chat would trap or clip the list. The widget shows the first **8 rows** (`widget-rows-inline`), then "Show all 27 items" (`hbw-show-all`, ghost, 44px) which grows the widget in place. Very long lists: "Open in HikingBuddy".
- From 440px, notes show under names (`hbw-row-note`). When the widget is narrower than about 330px, the badges wrap under the name.
- Read-only: editing happens by asking in the chat (or on the web), never inline in the widget.
- Foot: "Open in HikingBuddy".
