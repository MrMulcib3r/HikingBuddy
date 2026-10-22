/**
 * FR-28: the step texts of the "Connect to AI" pop-up — the ONLY place they live.
 * Menu names in AI apps change often, so re-check them before every release:
 * - Claude: https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp
 * - ChatGPT: https://help.openai.com/en/articles/12584461 (and developers.openai.com/api/docs/guides/custom-mcp-server)
 * Last checked 2026-10-22. ChatGPT moved from "Developer mode › Create app" to Plugins; the
 * default sign-in choices in Claude's wizard work with our server (it supports both CIMD and DCR).
 *
 * Words between **double asterisks** are menu names / buttons, shown in bold exactly as the
 * AI app spells them. At most three steps per app (design system ConnectAIDialog).
 */
export interface ConnectAiGuide {
  id: 'claude' | 'chatgpt';
  label: string;
  steps: string[];
  /** Small print under the steps (who can use it). */
  caption?: string;
}

export const CONNECT_AI_GUIDES: ConnectAiGuide[] = [
  {
    id: 'claude',
    label: 'Claude',
    steps: [
      'In Claude, open **Customize › Connectors**, click **+** and choose **Add custom connector**.',
      'Name it **HikingBuddy**, paste the server address below, click **Continue** twice (keep the suggested settings) and then **Add**.',
      'Sign in with the same Google account you use in HikingBuddy and click **Allow** (if no sign-in opens, click **Connect** next to HikingBuddy).',
    ],
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    steps: [
      'In ChatGPT on the web, open **Plugins**, click **+** and choose **Add custom MCP server**.',
      'Name it **HikingBuddy**, paste the server address below, choose **OAuth**, tick **I understand and want to continue** and click **Create as a plugin**.',
      'Install the plugin, type **@** in a new chat, pick **HikingBuddy** and sign in with the same Google account.',
    ],
    // Martin, 2026-10-22: no product or plan names — plans and names change.
    caption: 'May need a paid plan that allows custom MCP servers.',
  },
];

/** "a **b** c" → [{ text: 'a ' }, { text: 'b', bold: true }, { text: ' c' }] */
export function splitBold(step: string): { text: string; bold: boolean }[] {
  return step
    .split('**')
    .map((text, i) => ({ text, bold: i % 2 === 1 }))
    .filter((part) => part.text !== '');
}
