# HikingBuddy — instructions for Claude

## Who you work with
Martin is the Product Manager and owner of this project. He is **not a developer**.
- Talk to him in **Czech**.
- When you make a technical choice, explain **why** in plain language (what problem it solves, what the trade-off is). Avoid jargon or explain it.
- Product decisions (what the app does, how it behaves for the user) are Martin's. If a requirement is unclear or contradicts the PRD, ask him before building. Implementation details (how the code is written) are yours to decide, but tell him what you chose and why.

## Source of truth
- **`PRDRequirements/PRD-MVP.md`** (currently v7) — what we are building and why. Read it before any feature work. Code must match it; if they disagree, flag it to Martin.
- **`PRDRequirements/build-status.md`** — log of what has been built, decided and verified. Read it at the start of a session; **append an entry after every meaningful change**.
- `PRDRequirements/gemini-code-*.txt` — the original long-term vision (v1). Reference only, *not* the current scope.
- If a product decision changes during work, update the PRD (bump the version, add a line to its history and to section 8 "Rozhodnutí") in the same change.

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
- Out of MVP scope (do not build unless Martin asks): accounts/login, server, offline/PWA, public sharing, charts, templates, multiple snapshots.

## Tech
- React 19 + Vite + TypeScript, lint with oxlint. Everything lives in `app/`.
- Data is stored only in the browser (`localStorage`) via `app/src/storage.ts` — the single place to change if a server is added later. A storage format change must either migrate old data or be explicitly agreed with Martin (v7 reset data once, with his OK).
- Key files: `src/types.ts` (data model), `src/state/AppContext.tsx` (state + actions), `src/state/logic.ts` (weight math, affected-lists lookup), `src/components/` (UI).

## Commands (run inside `app/`)
- `npm install` — install dependencies (first time / after package changes)
- `npm run dev` — start the app locally for Martin to try
- `npm run build` — typecheck + production build (**must pass before you call a change done**)
- `npm run lint` — lint

There is no automated test suite in the repo yet (earlier checks were one-off Playwright smoke tests). When you add or change behaviour, verify it by running the app; adding a proper test setup is a welcome improvement — propose it to Martin first.

## Working style
- Small, focused changes; commit each logical step to git with a clear message, so any step can be undone.
- After finishing, give Martin a short Czech summary: what changed, why, how you verified it, and how he can try it.

## Known cleanup
- Nothing open right now.
