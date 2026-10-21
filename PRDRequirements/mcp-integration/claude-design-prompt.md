# Prompt for Claude Design: design system update for accounts, MCP widgets and activity history (PRD v33)

Copy everything below the line into Claude Design, together with the current design system (`design/2026-10-redesign/design-system/`).

---

Context: HikingBuddy is an ultralight gear-list web app (LighterPack-like). We have an existing design system (light theme only, icons with tooltips instead of text, pack weight split into Base + Consumables with Worn shown separately, a backpack weight visualization with a defined layer order, one backpack shape and icon set, fonts Barlow Condensed and Overpass).

What changes (PRD v33):
- Users can sign in with Google. Guest mode (no account) stays exactly as today.
- HikingBuddy exposes a remote MCP server. Users connect their own AI client (Claude, ChatGPT) and the AI can do everything the user can do, including deleting (soft delete with Undo). Answers include interactive HikingBuddy UI rendered inside the chat (MCP Apps). There is no chat window on the HikingBuddy web.
- Every change is recorded in an activity history, marked as made by "You" or "AI (client name)", with Undo.

Please revise and extend the design system for:

1. In-chat widgets (rendered in a sandboxed iframe inside the AI client's conversation column: narrow width, no own navigation, must look native next to chat text, must stay readable on mobile AI apps):
   - Pack summary card (total / Base / Consumables / Worn weight, category breakdown; a compact version of the backpack visualization if it fits)
   - Gear list view (compact, scrollable, item weight and category icon)
   - Proposed changes view: items the AI wants to add, remove or change, with Confirm / Reject per item and "Confirm all"
   - Single item card (name, weight, category, note)
   - Success state after saving, with a link "Open in HikingBuddy"
   - Error state (incl. "HikingBuddy reached today's free limit, try again tomorrow"), empty state, loading state

2. Web additions:
   - Header states: guest ("Sign in" button) and signed in (avatar/name with a menu: Connect to AI, Activity, Sign out)
   - Sign-in with Google (button and a short explanation of what an account adds: same data on every device, connecting an AI client)
   - First sign-in dialog when local data exists: "Import your local data to your account" / "Start with an empty account", with counts of items and gearlists
   - "Connect to AI" pop-up: 2-3 short steps for Claude and for ChatGPT, the MCP server URL with a Copy button, and an OK button that closes it. Nothing more. Guest variant: explains that signing in is needed, with "Sign in with Google".
   - Activity panel in three levels: (1) day as a section header (display only); (2) AI sessions as the main Undo unit, e.g. "Claude, 14:02–14:10, 27 changes" with one Undo button and expandable to single changes; the user's own edits with a "You" badge; (3) per day an "Undo all AI changes from this day" action (reverts AI changes only, shows a confirmation with the count and conflicts first). Also Undo for a single change, a short description of what changed, a conflict warning when Undo would overwrite a later change, and how soft-deleted items look
   - Revoke access for connected AI clients (in the account menu or Activity)

3. Dark mode: prepare a dark variant of the in-chat widgets (AI clients often run in dark mode) and the tokens needed. It will not be implemented yet, so keep it as a separate, clearly marked part.

Constraints: keep existing tokens, icons and product decisions unless a change is needed for the in-chat context; explain any change. UI text in English. Output: updated design system plus an implementation brief for Claude Code, same structure as the existing one.
