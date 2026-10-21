# ConnectAIDialog

The "Connect to AI" pop-up (PRD v33, FR-28): two or three short steps for Claude and for ChatGPT, the MCP server address with a Copy button, and OK. Nothing more.

- Opened from the header button "Connect to AI" and from the account menu.
- Title "CONNECT TO AI" (Lucide `bot`). One line: "Let your AI app read and edit your HikingBuddy gear. Every change it makes shows up in Activity, where you can undo it."
- **Claude / ChatGPT** as two tabs (`hb-tabs`, `role="tablist"`; Claude first). Each tab: `hb-steps`, max three steps, menu names in bold exactly as the app shows them:
  - Claude: 1. In Claude, open **Customize › Connectors** and click **Add custom connector**. 2. Name it **HikingBuddy**, paste the server address below and click **Add**. 3. Click **Connect** and sign in with the same Google account.
  - ChatGPT: 1. In ChatGPT on the web, open **Settings › Apps › Advanced settings** and turn on **Developer mode**. 2. Click **Create app**, name it **HikingBuddy**, paste the server address below and choose **OAuth**. 3. In a chat, pick **Developer mode** from the **+** menu, choose HikingBuddy and sign in with the same Google account. Caption: "Needs ChatGPT Plus or Pro, on the web."
  - Steps checked against Claude's and OpenAI's help pages on 2026-10-21. Menu names change often: keep the step texts in one place in the code and re-check them before release.
- **Server address** (`hb-copyfield`): read-only monospace field `https://<domain>/mcp` and a "Copy" button (`hb-btn--secondary`, Lucide `copy`). After copying: "Copied" with `check` in `forest` for 2 s, announced with `aria-live="polite"`. The address is the same in both tabs.
- **OK** (primary) closes the pop-up. No Cancel, no "connected clients" list (revoking lives in Activity).
- **Guest variant:** same title; text "Connecting an AI app needs a HikingBuddy account, so the AI can reach your gear from anywhere."; actions "Not now" (ghost) and Sign in with Google. After sign-in the normal pop-up opens.
