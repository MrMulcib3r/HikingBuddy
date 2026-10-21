HikingBuddy is a personal gear planner for long-distance treks: a Gear Vault of everything you own, and per-trip gearlists that add up Base, Worn, Consumable and Total weight. Since PRD v33 (2026-10-21) people can also sign in with Google, connect their own AI app (Claude, ChatGPT) through HikingBuddy's MCP server, see HikingBuddy widgets inside that chat, and undo any change in Activity. This system covers both surfaces: the web app and the in-chat widgets. The look is a trail at golden hour: light, clean, warm, with the hiker and the pack at the centre. Colours lean on layered-mountain dusk palettes (peach, ember, plum, pine), lighter and less saturated than the inspiration.

## Principles

- **The pack reacts.** At the Ultralight / Lightweight / Traditional base-weight breakpoints, gear appears strapped to the pack (sleeping pad; ice axe, trekking poles and hiking boots) with a tier badge in words. It rewards going lighter and makes edits feel alive (see BackpackChart).
- **The pack is the hero.** The backpack chart (`BackpackChart`) is the largest, most colourful thing on screen. Everything else stays quiet so it can be.
- **Light and calm.** Panels are `surface` on the `bg` ground; colour is spent on the category layers and on one ember accent. The web app has no dark theme. The in-chat widgets have a dark variant that is prepared in the tokens but not implemented (see Dark widgets).
- **Every change can be traced and undone.** Whatever the AI or the user changes shows up in Activity with who did it, in words ("You", "Claude"), and one Undo. Trust in the AI comes from this, so Undo is never hidden.
- **Icons over words, never icons without words.** Frequent actions are icon buttons, and every icon button carries a tooltip and `aria-label` with its full name.
- **Looks, not behaviour.** This system changes how the app looks. Inline editing, the blocking 3-way dialog, Worn/Consumable on the gearlist row, snapshot rules and drag & drop all behave exactly as specified in the PRD.

## Content

- UI text is **English**. Buttons are sentence-case verbs: "Add gear", "Save snapshot", "Connect data file". Panel and dialog titles and weight labels are uppercase in the display face ("GEAR VAULT", "BASE WEIGHT").
- Speak to the hiker plainly: "Your gear lives only in this browser. Connect a data file to keep it safe." No exclamation marks, no emoji.
- Errors say what happened and how to fix it: "Weight must be 0 or more."
- Weights: stored in grams, shown as `1 020 g` under a kilo and `9.47 kg` above (imperial: `oz` / `lb`). Always tabular numbers, right-aligned in columns.
- Example content uses real trails and real gear (Nordkalottleden 2027, Durston X-Mid 1), never lorem ipsum.
- **Who changed it:** "You" for the user's own edits, the AI app's name for AI changes ("Claude", "ChatGPT", as the client registered itself). Never "the assistant" or "the bot".
- **Activity descriptions:** past tense, names in bold, values with units: "Changed weight of **Sawyer Squeeze**: 85 g → 79 g". An AI step's summary is one sentence: "Created gearlist **Jeseníky, 3 days** with 25 items." One AI step (one tool call) is one Activity entry (PRD FR-25).
- **Undo** is always the word "Undo" (with Lucide `undo-2` on bigger buttons), whatever its size: one change, one AI step, a whole day's AI changes. Restoring a deleted thing is also "Undo".
- **In the chat** the widget speaks as HikingBuddy, not as the AI: "Ask in the chat to add gear", never "Ask me". The AI's own text stays the AI's.

## Colour

- Ground `bg`, panels and dialogs `surface`, wells and hovers `surface-sunken` / `surface-hover`, hairlines `line`, control borders `line-control`.
- Text `ink`, secondary `ink-muted`, placeholders only `ink-subtle`. All pass 4.5:1 on `bg`, `surface` and `surface-sunken`.
- `accent` (ember) is the one action colour: primary buttons, selected states, active flags, focus ring. Text in the accent colour uses `accent-ink`. Text on an accent fill is `on-accent`.
- Status: `forest` (saved / connected), `warning`, `danger`, each with its `-soft` background and always with an icon, never colour alone. The daily free limit and offline states are `warning`, not `danger`: nothing is lost.
- AI changes are marked with `accent-soft` / `accent-ink` and the `bot` icon, the user's own with a neutral badge; the words ("Claude", "You") carry the meaning.
- `gsi-fill`, `gsi-stroke`, `gsi-text`: Google's own colours for the "Sign in with Google" button. Use them only there; never restyle Google's button with ember.
- **Themes:** `light` is the only theme for the web. `dark` exists in `tokens.json` for the in-chat widgets only, prepared and not implemented: never set `data-theme="dark"` in the web app.
- **Category colours** `cat-*`: one per default category, plus `cat-custom-1`…`4` handed to user-created categories in creation order. A category has the same colour everywhere: backpack layer, legend swatch, heading dot, tile dot. Neighbouring layers differ in lightness, so the pack stays readable for colour-blind users.
- Landscape `ridge-1`…`ridge-5` and `sun` are only for the background illustration and the cover.

## Type

Both faces come from road and trail signage, which suits an app about walking long routes.

- **Barlow Condensed** (`--font-display`): the brand name (`brand`), the gearlist name (`title-xl`), uppercase panel and dialog titles (`panel-title`) and labels (`label`). Never for running text.
- **Overpass** (`--font-sans`, derived from the US highway-sign face): everything else. `body` for names and dialog text, `small` for notes and hints, `weight` / `weight-xl` for numbers with `font-variant-numeric: tabular-nums`.
- Dense UI uses `ui` (14px: small buttons, banners, legend rows, the weight split) and `caption` (12px: badges, the tier hint, percentages in the pack). Nothing in the UI is smaller than 12px. Uppercase labels and column headers (legend, gearlist table) are all `label` (13px).
- **In-chat widgets use the AI app's own font** for all running text (`chat` family as the fallback stack; at runtime the host's `--font-sans`), in three sizes: `w-title` 16, `w-body` / `w-strong` 14, `w-caption` 12. Brand type appears only twice: `w-total` (Barlow Condensed 28px, the one big number) and `label`. Overpass is not loaded in widgets.
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
- Icon map for PRD v33: AI app / Connect to AI `bot` (everywhere an AI client is meant), Activity `history`, Sign in `log-in`, Sign out `log-out`, Undo `undo-2`, You `user`, Saved to account `cloud`, Offline `cloud-off`, Daily limit `hourglass`, Saving / Try again `refresh-cw`, Open in HikingBuddy `external-link`, proposal kinds Add `plus` / Remove `minus` / Change `pencil` / Delete `trash-2`, Confirm `check`, Reject `x`, error `circle-x`, success `circle-check`, access ended `key-round`, benefits `monitor-smartphone`. "Revoke access" is a text button without an icon.
- Icon map for actions: Save snapshot `camera`, View snapshot `images`, Share `signpost`, Template `map`, Delete `trash-2`, Remove `x`, Export / Import `hard-drive-download` / `hard-drive-upload`, Data file `hard-drive`, Search `search`, Drag `grip-vertical`, Total `mountain`, New gearlist `plus`, Create a copy `copy-plus`, Copy link `copy`, Open preview `external-link`, Disconnect `unplug`.
- Category icons stay as in `CategoryIcon.tsx` (backpack, tent, bed-double, shirt, cooking-pot, droplet, battery-charging, bath, package, tag); Food keeps `apple`.

## Layout

- Header: mark + "HikingBuddy", then data-file status, backup buttons and the unit toggle on the right. PRD v33 adds, at the right end: "Connect to AI" (secondary, `bot`) for everyone, then "Sign in" for a guest or the account button (avatar + first name, menu: Connect to AI, Activity, Sign out) when signed in. Signed in, the data-file status becomes the save status ("Saved", "Offline · changes kept", "Daily limit reached"), because the account replaces the data file (see AccountMenu).
- Activity is a side sheet from the right (440px, full width on a phone) over the app (see ActivityPanel).
- Two panels: Gear Vault (2 parts) left, Gearlists (3 parts) right; stacked below 900px.
- Gearlist panel, top to bottom: panel header "GEARLISTS" with a "+ New gearlist" button (icon + label) → gearlist name with switcher and its actions (Snapshot, Share, Template as icon + label, Delete as icon) → `BackpackChart` (large) beside its legend, with the weight split and Total under the pack → "+ Add item from Gear Vault" (filled primary, normal size, right-aligned above the column header) → column header (Item, Worn, Cons., Weight, Qty, Total) → category groups with `GearlistItemRow`s. There are no separate weight tiles: the split under the pack is the one place for Base / Consumables / Worn / Total.
- Gear Vault panel: search and category filter → category groups with `VaultItemRow`s → full-width "Add gear" button pinned at the bottom.

## Screen sizes and touch

- Built desktop-first (the app's main use), but it must never break on a phone: shared gearlist links (FR-18) and the public site (FR-20) will often be opened on one.
- **900px and below:** the two panels stack (Gear Vault, then Gearlists). **560px and below:** gearlist rows wrap to two lines and the column header hides, the backpack sits above its legend (it also drops under the pack whenever the panel is too narrow), side paddings shrink to `space-4`.
- **Touch (no hover):** row actions and drag handles are always visible, tooltips are not shown, so every icon button keeps its `aria-label` and icon meaning must also be learnable from context. Touch targets are at least 44px (`pointer: coarse`).
- **Exception: the shared gearlist page (FR-18) is phone-first**, because shared links are mostly opened on phones. At 360px: no zoom or sideways scrolling, backpack above its legend, item rows readable (name, quantity and weight never overlap), Worn/Consumable shown as text badges, unit toggle and "Open HikingBuddy" easy to reach with a thumb.
- Not designed (out of scope, PRD v16): a dedicated mobile layout for the rest of the app, gestures, offline use.

## In-chat widgets (MCP Apps, PRD v33 FR-27)

The AI app (Claude, ChatGPT) draws HikingBuddy widgets in its conversation, in a sandboxed frame we don't control: as wide as the chat column (320px on a phone up to about 760px on a desktop), no navigation of our own, under the AI's text. They must read like part of the chat and still be recognisably HikingBuddy. Components: WidgetPackSummary, WidgetGearList, WidgetProposedChanges, WidgetItemCard, WidgetStates (loading, saved, empty, limit, error, access ended, out of date); classes `hbw-*` in `bundle.css`.

What stays from the web: the tokens (colours, spacing, radii), the category colours and icons, the backpack shape and layer order, the tier names, the Base / Consumables / Worn split with the hiker icon, weight formatting, UI copy rules, the FR-5 choice.

**What changes in the chat, and why** (every other rule above still holds):

| Web rule | In widgets | Why |
|---|---|---|
| Overpass for text, Barlow for titles and numbers | AI app's own font for all text; Barlow only for the Total (`w-total`) and `label` | Text in the host's font sits naturally next to the AI's answer. ChatGPT's guidelines ask for no custom fonts at all: Barlow is behind one variable (`--hbw-font` / `w-total`), so dropping it there is a one-line change if they enforce it. |
| Panels on `bg` with `shadow-panel`, landscape behind | One `surface` card, 1px `line` border, `radius-md` (10px, close to the AI apps' own cards), no shadow, no landscape, no logo | The chat is the background now. A floating panel or illustration would look like an ad. AI apps show the app name themselves, ChatGPT forbids a logo. |
| Icon-only buttons with tooltips | No icon-only controls, no tooltips; Worn / Consumable as text badges | Mobile AI apps have no hover, and tooltips get clipped by the frame. Same rule the shared page already uses on phones. |
| Gearlist scrolls inside its panel | No inner scrolling: first 8 rows, then "Show all N items" grows the widget | AI apps own vertical scrolling and cap a widget's height; a scroll box inside the chat traps or clips. (The brief asked for "scrollable"; this is the native way to get it.) |
| 38px buttons, 44px on touch | 44px for every control, always | The same widget is shown in phone apps; there is no reliable pointer detection inside the frame. |
| Menus, many actions | At most two actions in the foot (one primary), no menus or popovers; per-row decisions are visible buttons | Host guidelines (Claude, ChatGPT) and clipping inside the frame. |
| BackpackChart with percentages, labels, legend hover | Compact pack (96–112px), layers + tier gear + tier badge in words; numbers in the category list | Percentages would be unreadable at this size; no hover on phones. |
| Three-way dialog "Cancel / Create a copy of the item / Continue" | Row buttons "Reject / Create a copy / Update everywhere" | A blocking dialog can't exist in the chat, and "Continue" means nothing without it. Same three outcomes, mapped 1:1 to the MCP choice `create_copy` / `update_everywhere`. |
| Spinners / "Loading…" | Skeleton in the layout of the coming widget | Recommended by the AI apps; no jump when content arrives. |

**Rules for every widget**
- Width fluid, tested at 320, 360, 600 and 760px; container queries at 440px (`widget-wide`) and 520px (proposal rows go side by side), never viewport media queries.
- Height fits the content. Nothing inside scrolls.
- Every state has words and an icon; colour never alone. Contrast as on the web (all text 4.5:1 or better).
- The foot holds "Open in HikingBuddy" (`external-link`, opened through the host's open-link call) and at most one more action.
- No editing inside widgets except deciding proposed changes. Other changes go through the chat.
- Every widget has a text answer alongside it from the tool, so AI apps without widgets still work (FR-26).
- **v1 is light only, in its own `surface` card**, whatever theme the AI app uses (PRD FR-27). A transparent light widget would put dark text on a dark chat.

## Dark widgets (PREPARED, NOT IMPLEMENTED)

Kept separate on purpose (PRD FR-27). Martin, 2026-10-21: built at the very end of the project, if tokens allow. Until then nothing here is implemented.

- Tokens: theme `dark` in `tokens.json` gives a dark value for every colour a widget uses (grounds, lines, inks, ember, status, category colours). Landscape colours have none: widgets don't use them. Ratios on the dark surface: ink 13.4:1, ink-muted 8.4:1, ink-subtle 6.0:1, accent 5.3:1, text on accent (dark `on-accent`) 5.9:1, line-control 3.9:1.
- The dark ember is lighter (#E3784B), so text on it turns dark. Category colours are lifted to at least 3:1 on the dark ground and keep the light set's lightness order, so neighbouring pack layers still differ in lightness.
- In dark the widget ground is transparent (the chat shows through); in light it keeps its card. Once dark exists, light can go transparent too.
- Switching: from the host's theme (`hostContext.theme`, updated by `hostcontextchanged`), set `data-theme` on the widget's own `<html>` and declare `color-scheme: light dark`. The web app never sets `data-theme`.
- Preview: WidgetDark.

## For Claude Code: applying this to the app

- Tokens become CSS custom properties in `app/src/index.css` (from `tokens.json`); `App.css` keeps no literal colours, font sizes or radii, only `var(--…)`.
- Map old classes to components: `.btn*` → Button, row action buttons → IconButton, `ItemFlagsToggle` → FlagToggle, `InlineField` / `InlineCategorySelect` → InlineField, `.search-input` and form fields → TextField, `UnitToggle` → UnitToggle, `CategoryTilePicker` → CategoryTile, `.badge*` / snapshot status → Badge, `DataFileBanner` / template banner → Banner, Vault rows and headings → VaultItemRow, `GearListItemRow` → GearlistItemRow, `WeightSummary` → removed (its numbers live in the BackpackChart split), every dialog → Dialog, `App.tsx` layout → AppShell.
- New: `BackpackChart` (port `HB.backpack` from `components/bundle.js`), the landscape background, the custom icons.
- Do not change behaviour, data or texts beyond the icon-for-text swaps listed above. If a design choice would change behaviour, ask Martin first.

### PRD v33 additions (accounts, MCP widgets, Activity)

The build steps are in the repo: `PRDRequirements/mcp-integration/claude-code-prompts.md` (the only brief; each step names its components). Design rules for all steps: `design/2026-10-mcp/README.md`, section "Pro Claude Code". In short:
- **Tokens:** regenerate CSS variables from `tokens.json`. The web app uses only the `light` values. The `dark` values go into a `[data-theme="dark"]` block that only the widget bundle may use, and only when dark mode is built (not now). New: `gsi-*`, the `chat` font family, the widget type styles, the `layout` sizes.
- **Web, new components:** AccountMenu (header states, save status, menu), SignInWithGoogle, ImportDialog, ConnectAIDialog, ActivityPanel (sheet, day headers, AI steps, your edits, single changes, conflict, undone, deleted, connected apps with Revoke access), UndoDialog; Badge `--ai` `--you` `--deleted` `--undone`; Banner limit / offline. Same `hb-*` classes, same rules as the rest of the web app.
- **Widgets:** a separate small bundle served as MCP App resources (`ui://`), not the web app. Port the `hbw-*` classes and `HB.miniPack` (same geometry as `HB.backpack`, keep `PACK`, `GEAR`, `TIERS`, `layerHeights`). Load the tokens, not Overpass; set `--hbw-font` to the host's `--font-sans` when the host provides it. Keep the widget's light `surface` card and ignore the host theme in v1.
- **Do not change** web behaviour beyond what PRD v33 asks; the FR-5 rule keeps its three outcomes in the widget.

