# HikingBuddy — build status

> Running log of what has been built and decided, newest entry at the bottom. **Update this file after every meaningful change** (what changed, why, how it was verified).

**2026-09-22 (initial build):** MVP app (React + Vite + TypeScript) implemented per `PRD-MVP.md` (v4) and committed to the repo under `app/`. Typecheck, production build, and an automated smoke test (adding gear, Draft/Finalize lifecycle, propagation into Draft gearlists with a confirmation dialog, frozen data after Finalize, Duplicate as Draft) all passed.

**2026-09-22 (first round of polish, after Martin tried the app):**
- UI language decided: **English**, no localization for now. All screens converted.
- Added "Backpack" to the default category template.
- Category select in the "Add/Edit item" form now supports creating a new category inline ("+ Add new category…") instead of needing the separate Categories manager.
- Weight type (Base/Worn/Consumable) changed from a dropdown to a one-click segmented toggle, both in the Gear Vault item form and as the per-gearlist override (FR-9) — a single click re-tags an item instead of open-menu-then-select.
- Confirmed with Martin: no batch/multi-select editing in Gear Vault. Edits stay one item at a time, and the confirmation dialog (FR-5 — warns when an edited item is used in Draft gearlists) stays a blocking dialog on every edit, by design, so a gearlist's data never changes under the user without them noticing.
- Confirmed: the per-gearlist Worn/Base/Consumable override (FR-9) already existed in the data model and is the mechanism for the "winter jacket worn on one trip, packed in the pack on another" case Martin raised — now easier to use via the one-click toggle.

**2026-09-22 (v7 — major architecture rework, per Martin's next round of feedback):**
- **Removed the Draft/Finalized two-state gearlist lifecycle entirely.** A gearlist is now always editable — no "locked" state. See PRD v7, section 3, for the full reasoning (the old model made even trivial post-Finalize fixes require a full copy).
- **Added a "Save snapshot" action instead.** Any time (typically right before a trip) Martin can save a snapshot of the gearlist's current contents — a separate, read-only record, viewable with "View snapshot". One snapshot per gearlist; saving again overwrites the previous one (with a confirmation dialog first). This is what now protects the historical record, instead of a locked gearlist state.
- **Worn/Consumable moved off the Gear Vault item and onto each gearlist row**, as two independent flags (not a 3-way exclusive Base/Worn/Consumable choice anymore) — matches how lighterpack.com actually works, and matches the "winter jacket is worn on one trip, packed on another" case directly: it's now literally impossible for this to be a shared/Vault-level property. Toggling either flag is a single click and **never** shows a confirmation dialog, since it can never affect anything outside that one gearlist row.
- **New 3-way confirmation dialog: Cancel / Create a copy of the item / Continue**, replacing the old single-purpose dialogs. It appears whenever an edit to an item's name/category/weight would affect other gearlists (or other rows) — whether the edit is made from the Gear Vault panel, or made directly on a linked item inside a gearlist (both are the same underlying operation now). "Create a copy" adds a new Gear Vault item with the new values and leaves everything else pointing at the old one (except the one row being edited, which switches to the new copy); "Continue" updates the shared item everywhere it's used. Always blocking, never a toast — confirmed as a hard requirement.
- **Fixed the duplicate-row bug:** adding a Gear Vault item to a gearlist that already contains it now merges into the existing row (quantity goes up) instead of creating a second row.
- **Removed the "Edit" button pattern entirely, everywhere.** Both the Gear Vault list and gearlist items are now fully inline/click-to-edit — click a name, category, weight, quantity, or note to edit it in place (Enter/blur to save, Escape to cancel), matching lighterpack.com and Martin's explicit ask for an Excel-like editing feel. No batch editing, per Martin's earlier confirmation — edits are always one item at a time.
- **Added drag & drop reordering** for: items within a gearlist (within a category group), items in the Gear Vault (within a category group, and across category groups), categories (both in the Gear Vault and the category manager), and gearlists themselves (in the sidebar).
- PRD updated to v5 → v7 to match (the architecture section was substantial enough that it went through v5/v6 in drafting before landing on v7 — see the doc's own history line for the full chain).
- Verified: `npx tsc -b --noEmit` clean, `npm run build` clean, and an 18-check Playwright smoke test covering: no duplicate row on repeat add (merges quantity), no dialog on Worn/Consumable toggle, no dialog when editing an item not shared elsewhere, the 3-way dialog appearing and each of its paths (copy creates a second Vault item), snapshot save + view, and drag handles present on all three reorderable lists — all passing.
- **Data note:** the storage format changed enough (Draft/Finalized removed, Worn/Consumable relocated, snapshots added) that this update does **not** migrate old browser data — the app starts fresh after this update. Since MVP has no account/server, this only affects data in Martin's own browser's local storage; nothing was lost anywhere else.
- Deployed to `C:\GithubProjects\HikingBuddy\app\` (39 files). One leftover note: `src/components/WeightTypeToggle.tsx` (the old Base/Worn/Consumable segmented control, now replaced by `ItemFlagsToggle.tsx`) couldn't be deleted through the deployment tool used here (it can write files but not delete them) — it was overwritten with an empty stub instead, so the build stays clean; safe to delete by hand.

Run locally: in the `app/` folder, run `npm install` then `npm run dev`. Data is still stored in the browser only (no account/server) — as scoped for MVP.

**2026-09-23 (repo housekeeping, moving development to Claude Code):**
- Added `CLAUDE.md` (project rules for Claude Code), this `build-status.md`, and a real root `README.md`.
- `PRDRequirements/PRD-MVP.md` in the repo was still **v4** (Draft/Finalized model) while the code implements **v7** — replaced with v7 so the repo and the code agree.
- Open cleanup item: delete the empty stub `app/src/components/WeightTypeToggle.tsx` *(done — see next entry)*.

**2026-09-23 (first Claude Code session — environment check + cleanup):**
- Verified the dev environment on Martin's PC: Node.js v24.14.0 and npm 11.9.0 are installed; `npm install` (0 vulnerabilities), `npm run build` and `npm run lint` all pass (lint: 3 harmless "fast refresh" warnings, no errors). Dev server starts and the app loads in the browser with no console errors.
- Deleted the empty leftover stub `app/src/components/WeightTypeToggle.tsx` (nothing referenced it; build still clean afterwards).
- Added a root `.gitignore` with `.obsidian/`, so the Obsidian notes app's local settings folder never ends up in git.

**2026-09-23 (backlog + design folder, from Cowork):**
- Added `BACKLOG.md` — single place for bugs, UI changes, features and vision items, with rules for Martin (how to write items, triage sections Teď/Brzy/Někdy/Vize) and instructions for Claude Code (only work on "Teď" or named items, propose before building features, tick/move to Hotovo when done, log side-findings to Inbox). Seeded with the post-MVP items from PRD section 7/9 plus two proposals (automated tests, hosting).
- Added `design/` folder (with `README.md`) for wireframes, sketches and annotated screenshots referenced from the backlog.
- `CLAUDE.md` now points to both.

**2026-09-24 (data durability fix — Martin flagged that clearing browser data would wipe everything):**
- **Root cause of the concern:** the app only ever stored data in browser `localStorage`, and the v7 rework (2026-09-22) had renamed the storage key instead of migrating old data — so Martin's real gear/gearlists from before v7 were sitting untouched in his browser under the old key, but the app had stopped looking there. Looked exactly like data loss.
- **Fixed retroactively:** `src/storage.ts` now checks legacy keys (`hikingbuddy-state-v1`, `hikingbuddy-state-v2`) whenever the current key is empty, and migrates whatever it finds forward automatically, no user action needed. A migrated "Finalized" gearlist becomes a normal editable gearlist whose contents are also saved as its snapshot, so nothing is lost.
- **Fixed going forward:** introduced a proper versioned-migration system — `CURRENT_SCHEMA_VERSION` + a `MIGRATIONS` map in `src/storage.ts`, storage payload now wrapped as `{ schemaVersion, state }`. `STORAGE_KEY` (`hikingbuddy-state`) is never renamed again; any future `AppState` shape change must add a migration instead. This policy is written into `CLAUDE.md` (root) and summarized in `app/README.md`, plus PRD section 6a/8a.
- **New: Export/Import backup (FR-14).** "Export backup" / "Import backup" buttons in the header write/read a real `.json` file — the only thing that protects data against the browser's own "clear site data" action, which no in-app storage choice (localStorage or IndexedDB) can prevent on its own.
- **Verified:** `npx tsc -b --noEmit` and `npm run build` clean; a 15-check Playwright test seeding real legacy-v1-shaped data (a Draft list, a Finalized list, two Vault items) into `localStorage`, reloading, and confirming: both items and both gearlists recover, no Draft/Finalized badges remain, the migrated "Finalized" list is editable and carries a snapshot, the new storage key is versioned correctly, a second reload is stable, Export produces a valid backup file, and Import restores everything after a simulated full `localStorage.clear()` — all passing.
- **PRD updated to v8** (new section 6a "Trvanlivost dat", FR-14/FR-15, problem #8 in section 1, decisions in 8a).
- Deployed to `C:\GithubProjects\HikingBuddy\app\` (`constants.ts`, `storage.ts`, `App.tsx`, `App.css`, `state/AppContext.tsx`, new `components/BackupControls.tsx`, `README.md`) and root `CLAUDE.md`/`PRD-MVP.md`/`build-status.md` updated to match.
- **Not built this round (proposed in PRD section 6a/7 instead):** a local auto-save file via the browser's File System Access API, and a real server-side database — both flagged as the next steps if manual Export/Import proves inconvenient, or naturally alongside future accounts/sync (PRD section 7) or community sharing (section 9). Added to `BACKLOG.md`.

**2026-09-24 (one-click launcher):**
- Added `start-hikingbuddy.bat` in the repo root: if the app is already running on http://localhost:5173/ it just opens it in the default browser; otherwise it runs `npm install` when `node_modules` is missing, starts the dev server in a minimized "HikingBuddy server" window (closing that window stops the app), waits until it answers (max ~30 s), then opens the browser.
- Windows can't pin a `.bat` to the taskbar directly, so a desktop shortcut `HikingBuddy.lnk` (runs the script via `cmd.exe`, minimized) was created on Martin's desktop for pinning. The shortcut is local to his PC and not in git.
- Verified both paths: "already running" (just opened the browser) and a cold start (tested on a spare port 5174 so the running server wasn't disturbed — server came up and the script reached the "open browser" step).
