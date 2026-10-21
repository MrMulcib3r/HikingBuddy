# WidgetPackSummary

In-chat summary of one gearlist (PRD v33, FR-27): Total, the Base / Consumables / Worn split, a compact backpack and the category breakdown. Returned by the tools that read or change a gearlist.

- **Head:** gearlist name (`w-title`, host font) and meta "27 items · updated 14:10". No logo, no app name: the AI app shows it.
- **Compact pack** (`HB.miniPack`): the same shape A, layer order (heaviest at the bottom), minimum layer height and tier gear as BackpackChart, at 96px wide (112px from 440px). Under it the tier badge in words (`hbw-tier`: "Lightweight") so the drawing is never the only signal. Changed for the chat: no percentages inside the layers, no outside labels, no legend hover and no animation: at this size they would not be readable, and the category list beside it carries the numbers.
- **Numbers:** label "TOTAL" and the Total in `w-total` (Barlow Condensed 28px, the one big number), then the split as in BackpackChart: Base (`backpack`), Consumables (`utensils`), dashed line, Worn (hiker, "+ 1.24 kg"). The tier hint ("935 g to Ultralight") as `w-caption` under the badge.
- **Categories** (`hbw-cats`): swatch, category icon, name, weight, share, heaviest first; all categories (max ~14), never a scroll.
- **Layout:** under 440px container width the pack sits left of the numbers and the category list runs full width below; from 440px the list moves to a third column. Fluid from 320px.
- **Foot:** "Open in HikingBuddy" (`hbw-link`, `external-link`), opened through the host (`app.openLink`) at the gearlist's URL. One action only.
- Empty gearlist: see WidgetStates (empty).
