/**
 * HikingBuddy in-chat widget (PRD v33, FR-27, MCP Apps). The AI app loads this page in a
 * sandboxed frame next to a tool call, sends it the tool's result, and lets it call our MCP
 * tools and open links. One page for every widget: the result's `structuredContent.view` says
 * which one to draw (src/core/widgetViews.ts). Light card only in v1 (dark mode: BACKLOG).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Widget } from './Widget';
import './widget.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Widget />
  </StrictMode>
);
