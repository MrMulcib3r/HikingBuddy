# Button

Text button for actions that need a word: one `hb-btn--primary` per area for the main action, `--secondary` for alternatives, `--ghost` for Cancel, `--danger` only for irreversible deletes.

- Provide: the label (sentence case, a verb: "Add gear", "Export backup"), optional leading Lucide icon, `--sm` inside rows/banners, `--block` for the full-width "Add gear" bar pinned at the bottom of the Gear Vault.
- One primary per dialog or panel header. Destructive confirmations put the danger button last.
- Replaces `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-small` in `App.css`.
