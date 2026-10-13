# IconButton

Icon-only button, used **only for actions everyone recognises without help**. Every icon button has `aria-label` AND a `data-tip` tooltip with the same words.

| Action | Icon |
|---|---|
| Delete gearlist / item / category | Lucide `trash-2` (+ `--danger`) |
| Remove from gearlist | Lucide `x` |
| Copy link (Share dialog) | Lucide `copy` |
| Close banner / dialog | Lucide `x` |

- Anything less obvious is a Button with icon + label instead (Snapshot `camera`, Share `signpost`, Template `map`, Export / Import, Connect / Disconnect data file `hard-drive` / `unplug`, Create a copy `copy-plus`, Open preview `external-link`). Decided 2026-10-13 after Martin's test: the camera / signpost / map icons alone were not understood.
- `--outlined` in panel headers, plain in rows (rows reveal actions on hover/focus; always visible on touch).
- Tooltip: CSS `[data-tip]`, shows after 250 ms on hover and immediately on keyboard focus.
