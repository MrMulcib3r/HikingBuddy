/**
 * The in-chat widget (PRD v33, FR-27, MCP Apps): one small HTML page (`ui://…`) for every tool
 * that shows something. Built separately from the web app (app/widget, `npm run build:widget`)
 * into widget-dist/ and inlined here, so the page needs nothing from the network: AI apps load
 * it in a sandboxed frame that blocks other origins by default.
 */
import type { McpServer } from '@modelcontextprotocol/server';
import { registerAppResource, RESOURCE_MIME_TYPE, RESOURCE_URI_META_KEY } from '@modelcontextprotocol/ext-apps/server';
import widgetJs from '../../widget-dist/widget.js?raw';
import widgetCss from '../../widget-dist/widget.css?raw';
import { hashText } from './hash';

const HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>HikingBuddy</title>
<style>${widgetCss}</style></head>
<body><div id="root"></div><script>${widgetJs.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;

/** The address changes with the content, so an AI app never shows a cached old widget. */
export const WIDGET_URI = `ui://hikingbuddy/widget-${hashText(HTML)}.html`;

/** Tools that answer with the widget. `ui/resourceUri` is the older key some hosts still read. */
export const WIDGET_META = { ui: { resourceUri: WIDGET_URI }, [RESOURCE_URI_META_KEY]: WIDGET_URI };

/** Tools only the widget may call (its buttons): hidden from the model's tool list. */
export const APP_ONLY_META = { ui: { visibility: ['app'] }, 'openai/widgetAccessible': true, 'openai/visibility': 'private' };

export function registerWidget(server: McpServer) {
  registerAppResource(
    server,
    'HikingBuddy widget',
    WIDGET_URI,
    { description: 'HikingBuddy gearlists, gear and proposed changes in the chat.' },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: HTML,
          // The widget draws its own card with a thin border (design: light card, v1).
          _meta: { ui: { prefersBorder: false } },
        },
      ],
    })
  );
}
