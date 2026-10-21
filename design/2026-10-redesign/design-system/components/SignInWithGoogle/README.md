# SignInWithGoogle

The "Sign in with Google" button and the short dialog that says what an account adds (PRD v33, FR-23). Google is the only sign-in method.

- **Button** (`hb-gsi`): Google's own light button spec, not HikingBuddy styling: `gsi-fill` white, `gsi-stroke` border, `gsi-text` label, the Google "G" mark (20px) on the left, label "Sign in with Google". Use Google's official G asset (or let Google Identity Services render its button); the previews show a dashed placeholder where the mark goes, because the mark is Google's to supply. 40px; `--block` 44px full width in dialogs.
- **Dialog** (opened by the header's "Sign in"; `hb-dialog`): title "SIGN IN", one line "HikingBuddy works without an account. Signing in adds:", then `hb-benefits` with three rows:
  - `monitor-smartphone` **The same gear on every device**: your Gear Vault and gearlists are saved to your account.
  - `bot` **Connect your AI app**: Claude or ChatGPT can read and edit your gear for you.
  - `history` **Activity with Undo**: see every change, yours or the AI's, and undo it.
- Fine print (`hb-fineprint`): "HikingBuddy gets your name, e-mail and profile picture from Google. Your local gear stays in this browser." Actions: "Not now" (ghost, left) and the Google button (right). No other choices.
- After sign-in with local data present, ImportDialog follows.
