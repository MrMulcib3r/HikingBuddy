# Button

Text button for actions that need a word: one `hb-btn--primary` per area for the main action, `--secondary` for alternatives, `--ghost` for Cancel, `--danger` only for irreversible deletes.

- Provide: the label (sentence case, a verb: "Add gear", "Export backup"), optional leading Lucide icon, `--sm` inside rows/banners, `--block` for the full-width "Add gear" bar pinned at the bottom of the Gear Vault.
- "+ New gearlist" in the GEARLISTS panel header is `--secondary --sm` with Lucide `plus` and the full label (Martin, 2026-10-13).
- Gearlist actions are `--secondary --sm` with icon + label: Snapshot `camera`, Share `signpost`, Template `map`. Header backup controls are `--ghost --sm`: Export `hard-drive-download`, Import `hard-drive-upload`.
- One primary per dialog or panel header. Destructive confirmations put the danger button last.
- Replaces `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-small` in `App.css`.
