# AccountMenu

The right end of the header in its two states: a guest sees "Connect to AI" and "Sign in"; a signed-in user sees "Connect to AI", their avatar and first name, and a menu with Connect to AI, Activity and Sign out (PRD v33, FR-23, FR-28).

- **Guest:** header stays as today (data-file status, Export / Import, unit toggle), then "Connect to AI" (`hb-btn--secondary --sm`, Lucide `bot`) and "Sign in" (`hb-btn--secondary --sm`, Lucide `log-in`). "Sign in" opens the SignInWithGoogle dialog; "Connect to AI" opens the guest variant of ConnectAIDialog.
- **Signed in:** the data-file status is replaced by the save status (`hb-status`): "Saved" (Lucide `cloud`, forest icon), "Saving…" (`refresh-cw`), "Offline · changes kept" (`cloud-off`, warning) or "Daily limit reached" (`hourglass`, warning). The data file is not used with an account (FR-23). Export / Import and the unit toggle stay.
- **Account button** (`hb-account`): Google profile picture in `hb-avatar` (32px circle; initials on `accent-soft` when there is no picture) + first name + `chevron-down`. Under 560px only the avatar shows; the button keeps `aria-label="Account menu, Martin Malínek"`.
- **Menu** (`hb-menu`, web only): head with full name and e-mail, then Connect to AI (`bot`), Activity (`history`), separator, Sign out (`log-out`). Revoking AI access lives in the Activity panel, not here, so the menu stays three items (as specified).
- Keyboard: Enter / Space / ArrowDown opens the menu and focuses the first item; arrows move; Escape closes and returns focus to the button. `aria-haspopup="menu"`, `aria-expanded`.
- Icons: `bot` means "AI client" everywhere in the app (button, Activity, badges). It was free in the icon map; `plug` / `unplug` stay reserved for the data file.
