# ImportDialog

Shown once, right after the first sign-in, when this browser (or its connected data file) has HikingBuddy data (PRD v33, FR-23). Blocking: it does not close on a click outside or Escape, because both answers matter.

- Title "IMPORT YOUR LOCAL GEAR?" with Lucide `hard-drive-upload`. Text: "This browser has HikingBuddy data that is not in your account yet."
- `hb-counts`: one tile per thing that will move, with real counts: Gear Vault items (`backpack`), gearlists (`list`), and the template (`map`) when there is one.
- **Empty account:** primary "Import your local data to your account", secondary "Start with an empty account".
- **Account already has data:** text adds "Your account already has 52 items and 4 gearlists. Imported items and gearlists are added as new, nothing is overwritten." Primary "Import as new items and gearlists", secondary "Don't import". Never a silent overwrite.
- Fine print in both: "Your local data stays in this browser either way."
- Import uses the same `{ schemaVersion, state }` payload and migrations as Export.
