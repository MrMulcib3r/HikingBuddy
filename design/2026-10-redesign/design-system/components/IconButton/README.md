# IconButton

Icon-only button for frequent actions on the gearlist header and rows. Every icon button has `aria-label` AND a `data-tip` tooltip with the same words, because the icon alone is not enough for a first-time visitor.

| Action | Icon |
|---|---|
| Save snapshot | Lucide `camera` |
| View snapshot | Lucide `images` |
| Share read-only link | Lucide `signpost` |
| Create / Update template | Lucide `map` |
| Delete gearlist / item | Lucide `trash-2` (+ `--danger`) |
| Remove from gearlist | Lucide `x` |
| Export / Import backup | Lucide `hard-drive-download` / `hard-drive-upload` |
| New gearlist | Lucide `plus` |
| Create a copy of the item | Lucide `copy-plus` |
| Copy link / Open preview (Share dialog) | Lucide `copy` / `external-link` |
| Connect / Disconnect data file | Lucide `hard-drive` / `unplug` |
| Delete category | Lucide `trash-2` (+ `--danger`) |

- Text stays only where the user makes a decision or meets the action for the first time: dialog buttons (icon + label), the full-width "Add gear" button and the welcome card.
- `--outlined` in the gearlist header, plain in rows (rows reveal actions on hover/focus).
- Tooltip: CSS `[data-tip]`, shows after 250 ms on hover and immediately on keyboard focus.
