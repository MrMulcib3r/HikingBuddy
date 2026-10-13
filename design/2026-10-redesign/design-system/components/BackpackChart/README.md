# BackpackChart

The signature element of HikingBuddy and the visual anchor of the gearlist panel: a simple rounded backpack silhouette (shape A: rounded top, handle, side pockets, front pocket; chosen 2026-10-12) filled from the bottom with one colour layer per category, layer height = that category's share of the pack weight, with a legend beside it.

Decided with Martin on 2026-10-12 (answers the open questions of PRD FR-19):
- **In the pack = Base + Consumables.** Under the total, a three-line split: Base (Lucide `backpack`), Consumables (Lucide `utensils`), then, below a dashed line, Worn (hiker icon, "+ 1.65 kg"): worn weight is carried on the body, so it is never a layer. Last line, bold: **Total** (Lucide `mountain`) = pack + worn. Each line has a tooltip. This split replaces the old four weight tiles (removed 2026-10-13).
- **Heaviest category at the bottom**, lighter ones above (like packing a real backpack).
- **Placement:** top of the gearlist panel, above the item list. Also on the template and the shared gearlist page.
- Colours: each category's `cat-*` token, the same colour everywhere in the app.

Behaviour:
- Hovering or focusing a layer or a legend row highlights both and dims the others.
- **Every category shows its percentage** (v2, 2026-10-13). Layers at least 18 units tall carry it inside, in ink or surface depending on the layer's lightness. Thinner layers get an **outside label** to the right of the pack ("2 % Water"), joined to the layer by a thin leader line; outside labels are pushed apart so they never overlap. Labels are drawn above the pocket outline, never under it.
- **Minimum layer height 7 units** (about 9px): every category stays visible and easy to hover; the other layers shrink proportionally so the stack still fills the pack exactly.
- **Size:** the chart takes up to 480px of width (viewBox 0 0 340 280, the pack at x 26-194, outside labels at x 200-340); the legend sits beside it and drops under it when the panel is too narrow.
- No lid seam: it crossed the percentages and was removed (2026-10-13). Only the front-pocket outline stays.
- Empty gearlist: the empty pack (surface-sunken) with "0 g".

## Pack tiers (v3, Martin's idea, 2026-10-13)

The pack reacts to the **base weight** (Base, without consumables and worn) at the common backpacking breakpoints:

| Tier | Base weight | What the drawing adds | Badge |
|---|---|---|---|
| Ultralight | under 4.5 kg (10 lb) | nothing, the bare pack | `feather`, forest |
| Lightweight | 4.5 to 6.8 kg (10 to 15 lb) | a folded foam sleeping pad strapped under the pack | `footprints`, warning |
| Traditional | over 6.8 kg (15 lb) | the pad, plus an ice axe lashed on the left, trekking poles upright on the right (the counterweight to the axe), two more side pockets and a pair of hiking boots in profile (smooth sole) standing at the bottom right, tied to the poles by a lace | `mountain`, accent |

- The pack outline, layers and percentages never change; gear is drawn **around** the pack in neutral fills (`surface-sunken`, `ridge-2`, `accent-soft`) with the same ink outline, so the colour layers stay the hero.
- **Words, not only pictures:** a tier badge under the pack names the tier, with a hint: "1.06 kg to Ultralight" (how much to cut to reach the lighter tier) or "Base weight under 4.5 kg". The badge has a tooltip with the tier's range.
- **Motion only on change:** when an edit moves the list into another tier, the new gear drops in (0.45 s) and the badge pops once. Normal edits inside a tier do not animate. `prefers-reduced-motion` turns both off.
- In Traditional the outside percentage labels stay above the poles (y ≤ 112) so nothing crosses them.
- The chart reserves room for all gear (viewBox -30 0 370 306) so the layout never jumps when gear appears.
- Thresholds in grams: 4536 and 6804 (exactly 10 and 15 lb). Imperial shows "10 lb" / "15 lb".

Reference implementation: `HB.backpack(el, { unit, base, consumable, worn, categories: [{ id, name, icon, color, grams }] })` in `components/bundle.js`. `icon` is a Lucide name or `hb:<name>` for a custom icon (e.g. `hb:boot`). Port it to a React component (`BackpackChart.tsx`), keep its geometry (`PACK`, `GEAR`, viewBox -30 0 370 306), `TIERS`, `layerHeights` and the outside-label placement as they are. Replaces LighterPack's pie chart.
