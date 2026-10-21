# UndoDialog

Confirmation before a large Undo (PRD v33, FR-25): always for "Undo all AI changes from this day", and for an AI step's Undo when it has conflicts and the inline conflict box would be too long (more than 3).

- Title "UNDO AI CHANGES FROM TODAY?" (or "… FROM TUE 14 OCT?"), Lucide `undo-2`.
- First the count, by client: "This reverts **41 changes** made by AI today: Claude (31 changes) and ChatGPT (10 changes). Your own changes stay as they are."
- Then conflicts, if any (`hb-dialog-list` on `warning-soft`, `triangle-alert`): "**3 of them conflict** with later changes:" one line each: thing, what, who changed it later and when ("**Sawyer Squeeze** weight: you changed it to 82 g at 15:20.").
- Actions: Cancel (ghost, left); with conflicts **"Undo 38, keep later changes"** (primary, the safe default) and "Undo all 41" (secondary, overwrites); without conflicts just "Undo 41 changes" (primary).
- AI changes that were already undone are not counted. The day Undo is itself one history entry, so it can be undone again.
