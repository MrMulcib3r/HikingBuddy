# HikingBuddy

A personal gear-list app: build and maintain your own gear database (**Gear Vault**), and
put together **gearlists** for specific treks from it, without a gearlist's data silently
changing after the fact. See `PRDRequirements/PRD-MVP.md` for the full product spec and
`claude/build-status.md` (in the Claude project this app is developed alongside) for the
build changelog.

## Running it

```bash
npm install
npm run dev
```

Then open the URL it prints (typically `http://localhost:5173`).

```bash
npm run build   # type-checks and produces a production build in dist/
```

## Data storage — read this before changing `src/types.ts` or `src/storage.ts`

This is an MVP with **no account or server** — all data lives in the browser's
`localStorage`, under the single key `hikingbuddy-state` (see `src/constants.ts`), plus a
manual `.json` export/import safety net (`src/components/BackupControls.tsx`).

**Full policy lives in `../CLAUDE.md`** (repo root, "Data storage" section) — read it before
touching the data model. Short version: `STORAGE_KEY` never changes again; every shape
change to `AppState` bumps `CURRENT_SCHEMA_VERSION` and adds a migration function to the
`MIGRATIONS` map in `src/storage.ts` (see `migrateV1ToV2` for the pattern); test it against
real old-shape data before calling it done. This exists because skipping it once, on
2026-09-22, made a real update look like it had silently deleted the user's data.
