/**
 * The in-chat widget's state (PRD v33, FR-27, MCP Apps). The AI app loads this page in a
 * sandboxed frame next to a tool call, sends it the tool's result, and lets it call our MCP
 * tools and open links. One page for every widget: the result's `structuredContent.view` says
 * which one to draw (src/core/widgetViews.ts). Light card only in v1 (dark mode: BACKLOG).
 */
import { useCallback, useEffect, useState } from 'react';
import { useApp, useHostStyles, type App } from '@modelcontextprotocol/ext-apps/react';
import type { ProposalView, StateView, WidgetView } from '../src/core/widgetViews';
import { Proposal, type Decision } from './Proposal';
import { GearList, ItemCard, Skeleton, StateCard, Summary } from './views';

const hasHostFont = (app: App) => Boolean(app.getHostContext()?.styles?.variables?.['--font-sans']);

type ToolResult = Awaited<ReturnType<App['callServerTool']>>;

const viewOf = (result: ToolResult): WidgetView | null => {
  const v = result.structuredContent as WidgetView | undefined;
  return v && typeof v === 'object' && 'view' in v ? v : null;
};

const textOf = (result: ToolResult): string =>
  result.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('\n');

/** A failed call from the widget (network, revoked access, limits) as a state to show. */
function stateForError(err: unknown, unit: StateView['unit']): StateView | string {
  const text = String(err instanceof Error ? err.message : err);
  if (/401|unauthori[sz]ed|invalid_token|revoked/i.test(text)) {
    return { view: 'state', unit, link: null, state: 'access', title: 'HikingBuddy is not connected', text: "Your access ended or was revoked. Reconnect HikingBuddy in your AI app's connector settings." };
  }
  if (/429|too many/i.test(text)) return 'Too many requests to HikingBuddy. Wait a minute and try again.';
  return "Couldn't reach HikingBuddy. Nothing was changed. Try again in a moment.";
}

export function Widget() {
  // waiting: nothing yet; loading: the tool runs; ready: a view; none: the result has no widget.
  const [phase, setPhase] = useState<'waiting' | 'loading' | 'ready' | 'none'>('waiting');
  const [view, setView] = useState<WidgetView | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  // Bumped when the AI app's context (style variables) changes, so the page re-reads it.
  const [, setContextVersion] = useState(0);

  const show = useCallback((result: ToolResult) => {
    const v = viewOf(result);
    setView(v);
    setPhase(v ? 'ready' : 'none');
  }, []);

  const { app } = useApp({
    appInfo: { name: 'HikingBuddy', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (created) => {
      created.ontoolinput = () => setPhase((p) => (p === 'ready' ? p : 'loading'));
      created.ontoolresult = (result) => show(result);
      created.ontoolcancelled = () => setPhase('none');
      created.onhostcontextchanged = () => setContextVersion((n) => n + 1);
    },
  });
  useHostStyles(app, app?.getHostContext());

  // The AI app's chat font, when it sends one (design: "--hbw-font: var(--font-sans)" of the host).
  const hostFont = app ? hasHostFont(app) : false;
  useEffect(() => {
    document.documentElement.classList.toggle('hbw-host-font', hostFont);
  }, [hostFont]);

  const openLink = useCallback(
    (url: string) => {
      if (!app) return;
      app.openLink({ url }).catch(() => window.open(url, '_blank', 'noopener'));
    },
    [app]
  );

  const proposalId = view?.view === 'proposal' ? view.id : null;

  // A chat opened again shows the proposal as the tool returned it then: ask for its state now.
  useEffect(() => {
    if (!app || !proposalId) return;
    app
      .callServerTool({ name: 'get_proposal', arguments: { proposal_id: proposalId } })
      .then((result) => {
        const v = viewOf(result);
        if (v) setView(v);
      })
      .catch(() => {
        // Keep what the tool returned; a decision will report a real problem.
      });
  }, [app, proposalId]);

  const decide = useCallback(
    async (decisions: { change_id: string; decision: Decision }[]) => {
      if (!app || !proposalId || view?.view !== 'proposal') return;
      const unit = view.unit;
      setBusy(true);
      setGeneralError(null);
      setErrors((e) => {
        const next = { ...e };
        for (const d of decisions) delete next[d.change_id];
        return next;
      });
      try {
        const result = await app.callServerTool({ name: 'decide_proposed_changes', arguments: { proposal_id: proposalId, decisions } });
        const v = viewOf(result);
        if (result.isError) {
          const message = textOf(result).replace(/^Nothing was changed\.\s*/, '');
          if (v && v.view === 'state') setView(v);
          else if (decisions.length === 1) setErrors((e) => ({ ...e, [decisions[0].change_id]: message }));
          else setGeneralError(message);
          // Out of date, or decided in another window: show the current state.
          const fresh = viewOf(await app.callServerTool({ name: 'get_proposal', arguments: { proposal_id: proposalId } }));
          if (fresh) setView(fresh);
        } else if (v) {
          setView(v);
          if (v.view === 'proposal') tellModel(app, v);
        }
      } catch (err) {
        const s = stateForError(err, unit);
        if (typeof s === 'string') setGeneralError(s);
        else setView(s);
      } finally {
        setBusy(false);
      }
    },
    [app, proposalId, view]
  );

  if (phase === 'none') return null;
  if (phase !== 'ready' || !view) return <Skeleton />;
  switch (view.view) {
    case 'summary':
      return <Summary view={view} openLink={openLink} />;
    case 'gear':
      return <GearList view={view} openLink={openLink} />;
    case 'item':
      return <ItemCard view={view} openLink={openLink} />;
    case 'proposal':
      return <Proposal view={view} busy={busy} errors={errors} generalError={generalError} decide={decide} openLink={openLink} />;
    case 'state':
      return <StateCard view={view} openLink={openLink} />;
  }
}

/** Lets the AI know what the user decided in the widget, for its next answer. */
function tellModel(app: App, v: ProposalView) {
  const line = (status: string) =>
    v.changes
      .filter((c) => c.status === status)
      .map((c) => c.name)
      .join(', ') || 'none';
  const text = `The user decided in the HikingBuddy widget on proposal ${v.id} for "${v.listName}". Confirmed and saved: ${line('confirmed')}. Rejected: ${line('rejected')}. Still open: ${line('open')}. Don't make these changes again with other tools.`;
  app.updateModelContext({ content: [{ type: 'text', text }] }).catch(() => {
    // Not every AI app supports this; the widget works without it.
  });
}
