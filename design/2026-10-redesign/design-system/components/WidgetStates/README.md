# WidgetStates

Loading, success, empty and error states of the in-chat widgets (PRD v33, FR-27). Same frame as every widget; an icon in a 40px circle, a title in `w-title` and one or two sentences. Never colour alone: every state has its words and its icon.

| State | Icon | Title | Text | Action |
|---|---|---|---|---|
| Loading | – | – | Skeleton in the layout of the widget that is coming (pack block, three number lines, category rows). No spinner. Shimmer off under `prefers-reduced-motion`. | – |
| Saved | `circle-check`, forest | "Saved to Jeseníky, 3 days" | "4 changes applied, 1 rejected. Base weight is now **4.96 kg**." + "You can undo any change in Activity on HikingBuddy." | "Open in HikingBuddy" |
| Empty gearlist | `backpack`, muted | "Jeseníky, 3 days has no gear yet" | "Ask in the chat to add gear from your Gear Vault." | – |
| Empty Gear Vault | `package-open`, muted | "Your Gear Vault is empty" | "Ask in the chat to add your gear, or add it in HikingBuddy." | "Open in HikingBuddy" |
| Daily limit | `hourglass`, warning | "HikingBuddy reached today's free limit" | "Try again tomorrow. Your gear is safe and nothing was changed." | – |
| Error | `circle-x`, danger | "Couldn't reach HikingBuddy" | "Nothing was changed. Try again in a moment." | "Try again" (secondary) |
| Access ended | `key-round`, muted | "HikingBuddy is not connected" | "Your access ended or was revoked. Reconnect HikingBuddy in your AI app's connector settings." | – |
| Out of date | `refresh-cw`, warning | "This proposal is out of date" | "Jeseníky, 3 days changed after it was made. Ask for a new proposal." | – |

- The limit message is warning, not danger: nothing broke and the user's data is fine (PRD 4a: D1 returns errors until midnight UTC).
- The text answer from the tool says the same thing, so clients without widgets still make sense (FR-26).
