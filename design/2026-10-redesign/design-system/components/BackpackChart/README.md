# BackpackChart

The signature element of HikingBuddy and the visual anchor of the gearlist panel: a backpack simple rounded backpack silhouette (shape A: rounded top, handle, side pockets, lid seam, front pocket; chosen 2026-10-12) filled from the bottom with one colour layer per category, layer height = that category's share of the pack weight, with a legend beside it.

Decided with Martin on 2026-10-12 (answers the open questions of PRD FR-19):
- **In the pack = Base + Consumables.** Under the total, a three-line split: Base (Lucide `backpack`), Consumables (Lucide `utensils`), then, below a dashed line, Worn (hiker icon, "+ 1.65 kg"): worn weight is carried on the body, so it is never a layer. Each line has a tooltip.
- **Heaviest category at the bottom**, lighter ones above (like packing a real backpack).
- **Placement:** top of the gearlist panel, above the item list. Also on the template and the shared gearlist page.
- Colours: each category's `cat-*` token, the same colour everywhere in the app.

Behaviour:
- Hovering or focusing a layer or a legend row highlights both and dims the others.
- Layers 20px+ tall carry their percentage; text colour switches between ink and surface by the layer's lightness.
- Tiny categories keep a minimum 3px layer so they stay visible.
- Empty gearlist: the empty pack (surface-sunken) with "0 g".

Reference implementation: `HB.backpack(el, { unit, worn, categories: [{ id, name, icon, color, grams }] })` in `components/bundle.js`. `icon` is a Lucide name or `hb:<name>` for a custom icon (e.g. `hb:boot`). Port it to a React component (`BackpackChart.tsx`), keep the geometry of shape `rounded` (viewBox 0 0 220 280, body path, clip path) as is; the other shapes in `SHAPES` were explorations and can be dropped. Replaces LighterPack's pie chart.
