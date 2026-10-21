# WidgetDark

**Prepared, not implemented.** Dark variant of the in-chat widgets for AI apps running dark (BACKLOG ⚪ Někdy, PRD FR-27 "tmavý režim zatím ne"). The web app stays light only.

- Tokens: the `dark` theme in `tokens.json` (every colour the widgets use; landscape colours have no dark value because widgets don't use them). Text: ink 13.4:1, ink-muted 8.4:1, ink-subtle 6.0:1 on the dark surface; ember `accent` #E3784B with dark `on-accent` text (5.9:1).
- Ground: transparent in dark, so the chat shows through (`[data-theme="dark"] .hbw`); hairlines in `line`. Light v1 keeps its own `surface` card, because a transparent light-only widget would put dark text on a dark chat.
- Category colours: lifted to stay 3:1 or better on the dark ground while keeping the light set's lightness order, so neighbouring pack layers still differ in lightness.
- Mini pack: outline in `ink` (light in dark), empty interior `surface-sunken`, tier gear in `surface-hover`.
- How it switches (when built): read `hostContext.theme` and `hostcontextchanged`, set `data-theme` on the widget's own `<html>` and `<meta name="color-scheme" content="light dark">`. Until then the widget ignores the host theme and always renders light.
