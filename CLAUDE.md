# HikingBuddy — instructions for Claude

## Who you work with
Martin is the Product Manager and owner of this project. He is **not a developer**.
- Talk to him in **Czech**.
- When you make a technical choice, explain **why** in plain language (what problem it solves, what the trade-off is). Avoid jargon or explain it.
- Product decisions (what the app does, how it behaves for the user) are Martin's. If a requirement is unclear or contradicts the PRD, ask him before building. Implementation details (how the code is written) are yours to decide, but tell him what you chose and why.

## Source of truth
- **`PRDRequirements/PRD-MVP.md`** (currently v18 — **final scope**, see sections 0 and 2; FR-16 to FR-18 built 2026-10-09, FR-19/FR-20 remain) — what we are building and why. Read it before any feature work. Code must match it; if they disagree, flag it to Martin.
- **`PRDRequirements/build-status.md`** — log of what has been built, decided and verified. Read it at the start of a session; **append an entry after every meaningful change**.
- `PRDRequirements/gemini-code-*.txt` — the original long-term vision (v1). Reference only, *not* the current scope.
- If a product decision changes during work, update the PRD (bump the version, add a line to its history and to section 8/8a "Rozhodnutí") in the same change.

## The app
Single-page web app for planning hiking gear, inspired by lighterpack.com.
- **Gear Vault** (left panel): personal database of owned gear.
- **Gearlists** (right panel): per-trip lists built from Gear Vault items, with Base / Worn / Consumable / Total weight breakdown.

### Rules that must not be broken (see PRD section 3 and FRs)
- Gearlists are **always editable**; there is no Draft/Finalized state (removed in v7).
- **Snapshot**: one per gearlist, read-only copy, re-saving overwrites it after a confirmation.
- Editing name/category/weight of a Gear Vault item that is used elsewhere **always** shows the blocking 3-way dialog **Cancel / Create a copy of the item / Continue** — never a toast, never silent. Same logic whether the edit starts in the Vault or inside a gearlist.
- **Worn / Consumable** are two independent flags on the *gearlist row*, not on the Vault item. Toggling them, or changing quantity/note in a gearlist, never shows a dialog.
- Adding an item that is already in a gearlist increases its quantity; no duplicate rows.
- Weights are stored in **grams**; metric/imperial is display only.
- All editing is inline (click a value → edit; Enter/blur saves; Escape cancels). No "Edit" buttons. No batch editing (deliberate).
- UI text is **English**. Code comments may be Czech or English.
- **Scope is closed (PRD v16, 2026-10-09).** The app is Martin's personal tool and a portfolio piece for job interviews, not a product to monetize. In scope beyond what exists today: auto-save to a local data file (FR-16), "Load demo data" (FR-17), read-only gearlist sharing via URL with the data encoded in the link (FR-18), design system + "backpack" weight visualization (FR-19, waits for Martin's design system), public deployment as a static site (FR-20, last).
- **Out of scope — do not build, even if it seems like a natural next step:** accounts/login, any server or server database, sync between devices, offline/PWA, mobile optimization, pie chart, multiple snapshots, duplicate gearlist, multiple templates, community sharing, monetization. The app must stay a **static app** (no backend).

## Data storage — read this before touching `src/types.ts` or `src/storage.ts`

**Incident that made this its own section (2026-09-22 → fixed 2026-09-24):** the v7 rework changed `AppState`'s shape and, instead of migrating old data, renamed the storage key — which orphaned Martin's real browser data and looked exactly like data loss. It was recovered (see PRD section 6a and `build-status.md`, 2026-09-24 entry), but the rule below exists so it never happens again. Treat it as a hard rule, same weight as "the build must pass":

1. **`STORAGE_KEY` in `src/constants.ts` never changes again.** If you're tempted to rename it, you're about to repeat the 2026-09-22 mistake — add a migration instead.
2. Every time `AppState`, `GearItem`, `GearListItem`, `GearList`, or `Category`'s shape changes: bump `CURRENT_SCHEMA_VERSION` in `src/storage.ts` by 1, and add a migration function to the `MIGRATIONS` map, keyed by the version it migrates *from*. Look at `migrateV1ToV2` for the pattern and the level of defensiveness expected (default every field, never assume a key exists).
3. Before calling the change done, actually run it against old-shape data: seed `localStorage['hikingbuddy-state']` (or a legacy key) with a payload in the *previous* schema via the browser console or a quick Playwright script, reload the app, and confirm the data comes back correctly — don't just trust that the migration function type-checks.
4. `localStorage` (used via `src/storage.ts`) is where data lives day-to-day today. Its real limit isn't the app's shape changing (rule above fixes that) but the browser's own "clear site data" wiping it outright, which no in-app code can prevent. `src/components/BackupControls.tsx` (Export/Import to a `.json` file) is the manual safety net; don't try to solve it by switching storage APIs (IndexedDB has the exact same "browser clears it" exposure).
5. **Next step, in scope since PRD v16: auto-save to a local data file (FR-16)** via the File System Access API. The file uses the **same `{ schemaVersion, state }` payload as Export**, so every migration rule above applies to data loaded from the file too. Once a file is connected, the file is the source of truth and `localStorage` is a working copy. Never write to the file without the user's permission being granted, and never overwrite a file that already has data without the explicit dialog from FR-16. "Load demo data" (FR-17) must never be able to overwrite a connected file.
6. **Personal data never goes into git.** If a data file lives inside the repo, it must be under `data/` (git-ignored). This matters more once the repo may become public (FR-20).
7. Shared gearlist links (FR-18) carry data in the URL — give the link format its own version number so old links keep opening after future data-model changes.
8. A server database is **out of scope** (PRD v16) — don't build it.

## Tech
- React 19 + Vite + TypeScript, lint with oxlint. Everything lives in `app/`.
- Key files: `src/types.ts` (data model), `src/state/AppContext.tsx` (state + actions), `src/state/logic.ts` (weight math, affected-lists lookup), `src/storage.ts` (persistence + migrations — see "Data storage" above), `src/components/` (UI).

## Commands (run inside `app/`)
- `npm install` — install dependencies (first time / after package changes)
- `npm run dev` — start the app locally for Martin to try
- `npm run build` — typecheck + production build (**must pass before you call a change done**)
- `npm run lint` — lint

There is no automated test suite in the repo yet (earlier checks were one-off Playwright smoke tests). When you add or change behaviour, verify it by running the app; adding a proper test setup is a welcome improvement — see `BACKLOG.md` Inbox, propose it to Martin first.

## Working style
- Small, focused changes; commit each logical step to git with a clear message, so any step can be undone.
- After finishing, give Martin a short Czech summary: what changed, why, how you verified it, and how he can try it.
- See `BACKLOG.md` for how work gets prioritized and logged, and `design/` for wireframes/screenshots referenced from it.
