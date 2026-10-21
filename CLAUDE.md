# HikingBuddy — instructions for Claude

## Who you work with
Martin is the Product Manager and owner of this project. He is **not a developer**.
- Talk to him in **Czech**.
- When you make a technical choice, explain **why** in plain language (what problem it solves, what the trade-off is). Avoid jargon or explain it.
- Product decisions (what the app does, how it behaves for the user) are Martin's. If a requirement is unclear or contradicts the PRD, ask him before building. Implementation details (how the code is written) are yours to decide, but tell him what you chose and why.

## Source of truth
- **`PRDRequirements/PRD-MVP.md`** (currently v36; MVP complete: FR-16 to FR-21 built, FR-20 deployed 2026-10-20 to Cloudflare; **v33 adds accounts, a server and an MCP server, section 4a, FR-23 to FR-28; v34 = step 1 built (FR-23, FR-24); v35 = step 2 built (FR-25, history + Undo); v36 = step 3 built (FR-26, MCP server with OAuth, text only)**) — what we are building and why. Read it before any feature work. Code must match it; if they disagree, flag it to Martin.
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
- Editing name/category/weight — and, in the Vault, the **note** (PRD v28) — of a Gear Vault item that is used elsewhere **always** shows the blocking 3-way dialog **Cancel / Create a copy of the item / Continue** — never a toast, never silent. Same logic whether the edit starts in the Vault or inside a gearlist, **except the category inside a gearlist**: changing a row's category there (click or drag) is local to that gearlist, no dialog, Vault untouched (PRD v29).
- **Worn / Consumable** are two independent flags on the *gearlist row*, not on the Vault item. Toggling them, or changing quantity/note in a gearlist, never shows a dialog.
- Adding an item that is already in a gearlist increases its quantity; no duplicate rows.
- Weights are stored in **grams**; metric/imperial is display only.
- All editing is inline (click a value → edit; Enter/blur saves; Escape cancels). No "Edit" buttons. No batch editing (deliberate).
- UI text is **English**. Code comments may be Czech or English.
- **Scope (PRD v16, reopened in v33 for FR-23 to FR-28 only).** The app is Martin's personal tool and a portfolio piece for job interviews, not a product to monetize. In scope beyond what exists today: auto-save to a local data file (FR-16), "Load demo data" (FR-17), read-only gearlist sharing via URL with the data encoded in the link (FR-18), design system + "backpack" weight visualization (FR-19, waits for Martin's design system), public deployment as a static site (FR-20, last). Contact form in the footer (FR-21, PRD v30) — sends through the third-party Web3Forms service; the contact e-mail address must never appear in the code or the UI.
- **Next work (PRD v33, 2026-10-21): accounts, server and MCP server (PRD section 4a, FR-23 to FR-28).** Goal: users connect their own AI client (Claude, ChatGPT) to HikingBuddy through a remote MCP server; the AI can do everything the user can (incl. delete, soft delete + Undo) and answers with interactive HikingBuddy widgets in the chat (MCP Apps). Build it **step by step** in the order of `PRDRequirements/mcp-integration/claude-code-prompts.md`, one step per task, Martin tests between steps. Key rules:
  - Sign-in **only with Google**. **Guest mode stays**: without an account the app works exactly as today (localStorage, data file FR-16, demo FR-17). Logged in = server data is the source of truth.
  - Stack: the same Cloudflare Worker serves static assets + `/api`, `/auth`, `/mcp`; database **Cloudflare D1**; MCP via Cloudflare Agents SDK (`McpAgent`) + `workers-oauth-provider` (OAuth 2.1 + PKCE) with Google as the identity provider. Do not hand-roll OAuth. Everything must stay on **free tiers** (Martin pays nothing) — ask before adding any paid service.
  - **One operations layer** on the server enforces the PRD rules for both the web app and MCP tools (e.g. the 3-way dialog from FR-5 becomes a required `create_copy` / `update_everywhere` choice in the MCP tool).
  - Every query is scoped to the signed-in user. Every change is written to the activity history (FR-25): `/api/ops` and `/api/import` record it in the same D1 transaction as the change; a new kind of change needs a description in `describeOperation` (`src/core/history.ts`). Undo goes through the `RESTORE` operation, which only the server creates.
  - MCP tools (step 3, `worker/mcp/tools.ts`): one tool call = one AI step = one Activity entry; a step is all or nothing. A new tool must go through `Step`/`change()` there (operations layer + history), never write to D1 directly. Local dev quirk: on Windows the local Workers runtime cuts off responses under `/.well-known/…/mcp`, so the full client discovery can only be tried on the public address; test tools locally with a token from the `/authorize` flow.
  - **Secrets** (Google client secret, signing keys) only in Cloudflare secrets (`wrangler secret put`) and locally in `app/.dev.vars` (git-ignored). The repo is public.
- **No longer built: Gear advisor (FR-22)** — replaced by the MCP server in v33. No in-app chat, no own LLM API key.
- **Out of scope — do not build, even if it seems like a natural next step:** sign-in methods other than Google, offline/PWA, mobile optimization, pie chart, multiple snapshots, duplicate gearlist, multiple templates, community sharing, monetization, dark mode (BACKLOG ⚪ Někdy), GDPR pages (BACKLOG ⚪ Někdy).

## Data storage — read this before touching `src/types.ts` or `src/storage.ts`

**Incident that made this its own section (2026-09-22 → fixed 2026-09-24):** the v7 rework changed `AppState`'s shape and, instead of migrating old data, renamed the storage key — which orphaned Martin's real browser data and looked exactly like data loss. It was recovered (see PRD section 6a and `build-status.md`, 2026-09-24 entry), but the rule below exists so it never happens again. Treat it as a hard rule, same weight as "the build must pass":

1. **`STORAGE_KEY` in `src/constants.ts` never changes again.** If you're tempted to rename it, you're about to repeat the 2026-09-22 mistake — add a migration instead.
2. Every time `AppState`, `GearItem`, `GearListItem`, `GearList`, or `Category`'s shape changes: bump `CURRENT_SCHEMA_VERSION` in `src/core/schema.ts` (moved there from `src/storage.ts` in v34 so the server shares it) by 1, and add a migration function to the `MIGRATIONS` map, keyed by the version it migrates *from*. Look at `migrateV1ToV2` for the pattern and the level of defensiveness expected (default every field, never assume a key exists).
3. Before calling the change done, actually run it against old-shape data: seed `localStorage['hikingbuddy-state']` (or a legacy key) with a payload in the *previous* schema via the browser console or a quick Playwright script, reload the app, and confirm the data comes back correctly — don't just trust that the migration function type-checks.
4. `localStorage` (used via `src/storage.ts`) is where data lives day-to-day today. Its real limit isn't the app's shape changing (rule above fixes that) but the browser's own "clear site data" wiping it outright, which no in-app code can prevent. `src/components/BackupControls.tsx` (Export/Import to a `.json` file) is the manual safety net; don't try to solve it by switching storage APIs (IndexedDB has the exact same "browser clears it" exposure).
5. **Next step, in scope since PRD v16: auto-save to a local data file (FR-16)** via the File System Access API. The file uses the **same `{ schemaVersion, state }` payload as Export**, so every migration rule above applies to data loaded from the file too. Once a file is connected, the file is the source of truth and `localStorage` is a working copy. Never write to the file without the user's permission being granted, and never overwrite a file that already has data without the explicit dialog from FR-16. "Load demo data" (FR-17) must never be able to overwrite a connected file.
6. **Personal data never goes into git.** If a data file lives inside the repo, it must be under `data/` (git-ignored). This matters more once the repo may become public (FR-20).
7. Shared gearlist links (FR-18) carry data in the URL — give the link format its own version number so old links keep opening after future data-model changes.
8. **Server database (PRD v33, FR-24): Cloudflare D1, only for signed-in users.** The same discipline applies there: versioned D1 migrations (`app/migrations/`, never edit an applied one — add a new numbered file), never drop or rename a table/column without a data migration, test migrations on a copy with old-shape data first. The tables mirror `AppState` in `app/worker/db.ts`: a shape change touches `src/core/schema.ts`, `worker/db.ts` and a new D1 migration in the same commit. The signed-in browser copy lives under its own key `hikingbuddy-account-<userId>` and must never write to `hikingbuddy-state`. Guest mode keeps using `localStorage` / the data file with the rules above. Importing local data into an account (FR-23) uses the same `{ schemaVersion, state }` payload and migrations, and never deletes the local data.

## Tech
- React 19 + Vite + TypeScript, lint with oxlint. Everything lives in `app/`.
- From PRD v33: server code runs in the Cloudflare Worker (config `app/wrangler.jsonc`), database Cloudflare D1. Explain to Martin in plain Czech any new Cloudflare setting he has to click in the dashboard (Google OAuth client, secrets, D1 database).
- Key files: `src/types.ts` (data model), `src/core/operations.ts` (**the one operations layer**: every data change, used by the browser and the server — PRD rules live here), `src/core/schema.ts` (schema version + migrations), `src/core/history.ts` (FR-25: records every operation's before/after, plans Undo and conflicts; the server stores entries in D1 `activity`), `src/state/AppContext.tsx` (actions → operations), `src/state/guestStore.ts` (guest: localStorage), `src/account/` (sign-in, account sync queue), `src/state/logic.ts` (weight math, affected-lists lookup), `src/storage.ts` (localStorage persistence — see "Data storage" above), `src/components/` (UI), `worker/` (server: `/api`, `/auth`; `worker/save.ts` saves a change + its history for both web and MCP), `worker/oauth.ts` (FR-26: workers-oauth-provider, the `/authorize` sign-in + consent page, Connected AI apps / revoke), `worker/mcp/tools.ts` (the MCP tools: names, descriptions and PRD rules for the AI), `migrations/` (D1).

## Commands (run inside `app/`)
- `npm install` — install dependencies (first time / after package changes)
- `npm run dev` — start the app locally for Martin to try (also runs the Worker with a local D1; first time run `npm run db:migrate:local`)
- `npm run db:migrate:local` — apply D1 migrations to the local database
- Local test login without Google: `app/.dev.vars` with `DEV_LOGIN=1` enables `POST /auth/dev-login` on localhost only
- `npm run build` — typecheck + production build (**must pass before you call a change done**)
- `npm run lint` — lint

There is no automated test suite in the repo yet (earlier checks were one-off Playwright smoke tests). When you add or change behaviour, verify it by running the app; adding a proper test setup is a welcome improvement — see `BACKLOG.md` Inbox, propose it to Martin first.

## Deployment and public repo
- The repo is **public**. Every push to `main` goes live automatically (Cloudflare Workers, static assets, config in `app/wrangler.jsonc`). A failed build keeps the previous version online — but still run `npm run build` before pushing.
- Never commit Martin's private files (see `.gitignore`): personal data, `Ad hoc notes …md`, `attachments/`, `TrackingProjectProgress/`, `Claude outputs/`.

## Working style
- Small, focused changes; commit each logical step to git with a clear message, so any step can be undone.
- After finishing, give Martin a short Czech summary: what changed, why, how you verified it, and how he can try it.
- See `BACKLOG.md` for how work gets prioritized and logged, and `design/` for wireframes/screenshots referenced from it.
