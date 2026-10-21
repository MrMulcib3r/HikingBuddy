# ActivityPanel

The change history with Undo (PRD v33, FR-25), as a side sheet (`hb-sheet`, 440px, from the right, modal on a scrim; full width under 560px). Opened from the account menu ("Activity"). Only for signed-in users.

**Top of the sheet**
- Head: "ACTIVITY" (`panel-title`, Lucide `history`) and a close IconButton (`x`). Intro (`hb-sheet-intro`): "Last 30 days. Undo puts things back the way they were before the change."
- **Connected AI apps** (`hb-act-apps`): one row per AI client with access: `bot` icon, client name as the client registered it ("Claude", "ChatGPT"), "Connected 18 Oct · last change today 14:10", and "Revoke access" (`hb-btn--ghost --sm`, danger on hover). Revoke asks first in a small Dialog: "Revoke access for Claude? Claude can no longer read or change your gear until you connect it again. Its past changes stay here and can still be undone." Cancel / Revoke access (danger). No AI connected: one line "No AI app connected." and the "Connect to AI" button.

**Three levels**
1. **Day** (`hb-act-day`, sticky): "TODAY · TUE 21 OCT", "YESTERDAY · MON 20 OCT", then "THU 16 OCT". Display only, except one action on the right when that day has AI changes: **"Undo all AI changes from this day"** (`hb-btn--ghost --sm`, `undo-2`). It reverts AI changes only and always opens UndoDialog first (count, then conflicts).
2. **Entry** (`hb-act-entry`), newest first:
   - **AI session = the main Undo unit.** Icon `bot` on `accent-soft`, AI badge with the client name (`hb-badge--ai`: "Claude"), time range and count ("14:02–14:10 · 27 changes"), a one-sentence summary ("Created gearlist **Jeseníky, 3 days** with 25 items and changed 2 Gear Vault items."). Actions: **Undo** (`hb-btn--secondary --sm`, `undo-2`) and a toggle "27 changes" / chevron that expands the single changes.
   - **Your own edit**: icon by kind, `hb-badge--you` "You", time, the description, Undo. One web action = one entry.
3. **Single change** (`hb-act-change`, inside an expanded session): time, kind icon (`plus` added, `pencil` changed, `trash-2` deleted, `minus` removed from a list, `camera` snapshot, `map` template), description, "Undo" (`hb-btn--ghost --sm`, with the word). Show the first 10, then "Show 17 more".

**Descriptions** (short, past tense, names in bold, values with units): "Added **Durston X-Mid 1** to **Jeseníky, 3 days**" · "Removed **Crocs** from **Jeseníky, 3 days**" · "Changed weight of **Sawyer Squeeze**: 85 g → 79 g" · "Marked **Rain jacket** as Worn in **Jeseníky, 3 days**" · "Renamed category **Misc** to **Repair kit**" · "Created gearlist **Jeseníky, 3 days** with 25 items" · "Deleted gearlist **Weekend Beskydy**" · "Saved snapshot of **Nordkalottleden 2027**" · "Undid Claude's changes from 14:02–14:10".

**States**
- **Conflict** (Undo would overwrite a later change): pressing Undo does not act yet; a `hb-conflict` box opens under the entry (`warning-soft`, `triangle-alert`): "Undo would overwrite 1 later change:" + the later change(s) as a list. Actions: Cancel (ghost), "Undo the rest, keep my change" (secondary, only for sessions and days), "Undo anyway" (primary). Single change with a conflict: Cancel / Undo anyway.
- **Undone**: the entry stays, text in `ink-subtle`, `hb-badge--undone` "Undone 14:40", no Undo button. The undo itself is a new entry ("Undid …") with its own Undo (redo).
- **Soft-deleted**: the description names the thing struck through (`hb-del`) and a `hb-badge--deleted` "Deleted · restorable until 20 Nov" (`trash-2`); its Undo restores it. Elsewhere in the app soft-deleted things are simply hidden; after 30 days they and their history entries are gone.
- Empty: "No changes in the last 30 days."
- Undo works at three sizes with the same button word: a single change, a session or your own edit, and a whole day's AI changes.
