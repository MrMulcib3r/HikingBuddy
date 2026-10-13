HikingBuddy is a personal gear planner for long-distance treks: a Gear Vault of everything you own, and per-trip gearlists that add up Base, Worn, Consumable and Total weight. The look is a trail at golden hour: light, clean, warm, with the hiker and the pack at the centre. Colours lean on layered-mountain dusk palettes (peach, ember, plum, pine), lighter and less saturated than the inspiration.

## Principles

- **The pack reacts.** At the Ultralight / Lightweight / Traditional base-weight breakpoints, gear appears strapped to the pack (sleeping pad; ice axe, trekking poles and hiking boots) with a tier badge in words. It rewards going lighter and makes edits feel alive (see BackpackChart).
- **The pack is the hero.** The backpack chart (`BackpackChart`) is the largest, most colourful thing on screen. Everything else stays quiet so it can be.
- **Light and calm.** Panels are `surface` on the `bg` ground; colour is spent on the category layers and on one ember accent. No dark theme.
- **Icons over words, never icons without words.** Frequent actions are icon buttons, and every icon button carries a tooltip and `aria-label` with its full name.
- **Looks, not behaviour.** This system changes how the app looks. Inline editing, the blocking 3-way dialog, Worn/Consumable on the gearlist row, snapshot rules and drag & drop all behave exactly as specified in the PRD.

## Content

- UI text is **English**. Buttons are sentence-case verbs: "Add gear", "Save snapshot", "Connect data file". Panel and dialog titles and weight labels are uppercase in the display face ("GEAR VAULT", "BASE WEIGHT").
- Speak to the hiker plainly: "Your gear lives only in this browser. Connect a data file to keep it safe." No exclamation marks, no emoji.
- Errors say what happened and how to fix it: "Weight must be 0 or more."
- Weights: stored in grams, shown as `1 020 g` under a kilo and `9.47 kg` above (imperial: `oz` / `lb`). Always tabular numbers, right-aligned in columns.
- Example content uses real trails and real gear (Nordkalottleden 2027, Durston X-Mid 1), never lorem ipsum.

## Colour

- Ground `bg`, panels and dialogs `surface`, wells and hovers `surface-sunken` / `surface-hover`, hairlines `line`, control borders `line-control`.
- Text `ink`, secondary `ink-muted`, placeholders only `ink-subtle`. All pass 4.5:1 on `bg`, `surface` and `surface-sunken`.
- `accent` (ember) is the one action colour: primary buttons, selected states, active flags, focus ring. Text in the accent colour uses `accent-ink`. Text on an accent fill is `on-accent`.
- Status: `forest` (saved / connected), `warning`, `danger`, each with its `-soft` background and always with an icon, never colour alone.
- **Category colours** `cat-*`: one per default category, plus `cat-custom-1`…`4` handed to user-created categories in creation order. A category has the same colour everywhere: backpack layer, legend swatch, heading dot, tile dot. Neighbouring layers differ in lightness, so the pack stays readable for colour-blind users.
- Landscape `ridge-1`…`ridge-5` and `sun` are only for the background illustration and the cover.

## Type

Both faces come from road and trail signage, which suits an app about walking long routes.

- **Barlow Condensed** (`--font-display`): the brand name (`brand`), the gearlist name (`title-xl`), uppercase panel and dialog titles (`panel-title`) and labels (`label`). Never for running text.
- **Overpass** (`--font-sans`, derived from the US highway-sign face): everything else. `body` for names and dialog text, `small` for notes and hints, `weight` / `weight-xl` for numbers with `font-variant-numeric: tabular-nums`.
- Dense UI uses `ui` (14px: small buttons, banners, legend rows, the weight split) and `caption` (12px: badges, the tier hint, percentages in the pack). Nothing in the UI is smaller than 12px. Uppercase labels and column headers (legend, gearlist table) are all `label` (13px).
- Load both from Google Fonts (`components/bundle.css` has the import). Fallbacks: Arial Narrow and Segoe UI.

## Space, shape, depth

- Spacing steps `space-1`…`space-12` (4–48px). Rows: `space-2` vertical, `space-3` horizontal. Panels: `space-6` padding, `space-6` gap between panels.
- Radii: `radius-sm` controls, `radius-md` tiles and banners, `radius-lg` panels and dialogs, `radius-pill` toggles and badges.
- Two shadows only: `shadow-panel` (panels floating above the landscape) and `shadow-overlay` (dialogs, menus, tooltips).
- Focus: 2px solid `focus-ring` with 2px offset on every interactive element.

## Imagery

- `assets/Illustrations/trail-landscape.svg` sits at the bottom of the window behind the panels: ridges, pines and a trail into the valley, in soft ridge colours. It sets the mood and must never compete with content.
- No photos in the app UI.

## Iconography

- Consumable = Lucide `utensils` (cutlery, like LighterPack), Worn = custom boot.

- **Icon-only is reserved for actions everyone recognises without help:** add `plus`, delete `trash-2`, remove `x`, copy `copy`, search, the switcher `chevron-down` and the drag grip. Every icon-only button still has a tooltip and `aria-label`.
- **Every other action is icon + a short label** (Martin's test, 2026-10-13: users did not understand camera / signpost / map on their own): Snapshot, Share, Template, Export, Import, Connect / Disconnect data file, Create a copy, and all dialog buttons.
- **Worn / Consumable in rows stay icon-only** because they repeat on every row; the gearlist's column header names them (WORN, CONS.) so the meaning is always on screen.

- **Lucide** (already in the app as `lucide-react`), 1.75 stroke, 18px in buttons and rows, 24px in category tiles.
- Custom hiker icons on the same grid, in `assets/Icons/` and `HB.icons`: boot = Worn, carabiner = used in other gearlists, hiker = worn weight beside the pack, plus the app mark.
- Icon map for actions: Save snapshot `camera`, View snapshot `images`, Share `signpost`, Template `map`, Delete `trash-2`, Remove `x`, Export / Import `hard-drive-download` / `hard-drive-upload`, Data file `hard-drive`, Search `search`, Drag `grip-vertical`, Total `mountain`, New gearlist `plus`, Create a copy `copy-plus`, Copy link `copy`, Open preview `external-link`, Disconnect `unplug`.
- Category icons stay as in `CategoryIcon.tsx` (backpack, tent, bed-double, shirt, cooking-pot, droplet, battery-charging, bath, package, tag); Food keeps `apple`.

## Layout

- Header: mark + "HikingBuddy", then data-file status, backup buttons and the unit toggle on the right.
- Two panels: Gear Vault (2 parts) left, Gearlists (3 parts) right; stacked below 900px.
- Gearlist panel, top to bottom: panel header "GEARLISTS" with a "+ New gearlist" button (icon + label) → gearlist name with switcher and its actions (Snapshot, Share, Template as icon + label, Delete as icon) → `BackpackChart` (large) beside its legend, with the weight split and Total under the pack → "+ Add item from Gear Vault" (filled primary, normal size, right-aligned above the column header) → column header (Item, Worn, Cons., Weight, Qty, Total) → category groups with `GearlistItemRow`s. There are no separate weight tiles: the split under the pack is the one place for Base / Consumables / Worn / Total.
- Gear Vault panel: search and category filter → category groups with `VaultItemRow`s → full-width "Add gear" button pinned at the bottom.

## Screen sizes and touch

- Built desktop-first (the app's main use), but it must never break on a phone: shared gearlist links (FR-18) and the public site (FR-20) will often be opened on one.
- **900px and below:** the two panels stack (Gear Vault, then Gearlists). **560px and below:** gearlist rows wrap to two lines and the column header hides, the backpack sits above its legend (it also drops under the pack whenever the panel is too narrow), side paddings shrink to `space-4`.
- **Touch (no hover):** row actions and drag handles are always visible, tooltips are not shown, so every icon button keeps its `aria-label` and icon meaning must also be learnable from context. Touch targets are at least 44px (`pointer: coarse`).
- **Exception: the shared gearlist page (FR-18) is phone-first**, because shared links are mostly opened on phones. At 360px: no zoom or sideways scrolling, backpack above its legend, item rows readable (name, quantity and weight never overlap), Worn/Consumable shown as text badges, unit toggle and "Open HikingBuddy" easy to reach with a thumb.
- Not designed (out of scope, PRD v16): a dedicated mobile layout for the rest of the app, gestures, offline use.

## For Claude Code: applying this to the app

- Tokens become CSS custom properties in `app/src/index.css` (from `tokens.json`); `App.css` keeps no literal colours, font sizes or radii, only `var(--…)`.
- Map old classes to components: `.btn*` → Button, row action buttons → IconButton, `ItemFlagsToggle` → FlagToggle, `InlineField` / `InlineCategorySelect` → InlineField, `.search-input` and form fields → TextField, `UnitToggle` → UnitToggle, `CategoryTilePicker` → CategoryTile, `.badge*` / snapshot status → Badge, `DataFileBanner` / template banner → Banner, Vault rows and headings → VaultItemRow, `GearListItemRow` → GearlistItemRow, `WeightSummary` → removed (its numbers live in the BackpackChart split), every dialog → Dialog, `App.tsx` layout → AppShell.
- New: `BackpackChart` (port `HB.backpack` from `components/bundle.js`), the landscape background, the custom icons.
- Do not change behaviour, data or texts beyond the icon-for-text swaps listed above. If a design choice would change behaviour, ask Martin first.
