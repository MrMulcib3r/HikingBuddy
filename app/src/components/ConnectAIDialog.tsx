import { createContext, useContext, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Bot, Check, Copy } from 'lucide-react';
import { useAuth } from '../account/AuthContext';
import { CONNECT_AI_GUIDES, splitBold, type ConnectAiGuide } from './connectAiSteps';
import { GoogleSignInButton } from './SignInDialog';
import { Dialog, DialogActions, Icon } from './ui';

/**
 * Design system ConnectAIDialog (PRD v33, FR-28): how to connect Claude or ChatGPT to the MCP
 * server (step texts in connectAiSteps.ts), the server address with Copy, and OK.
 *
 * The open/closed state lives above the guest/account switch (see App.tsx): signing in from the
 * guest variant swaps the whole app, and the pop-up must stay open and turn into the guide.
 */
const ConnectAiContext = createContext<() => void>(() => {});

/** Opens the "Connect to AI" pop-up (header button, account menu). */
export const useOpenConnectAi = () => useContext(ConnectAiContext);

export function ConnectAiProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <ConnectAiContext.Provider value={() => setOpen(true)}>
      {children}
      {open && <ConnectAIDialog onClose={() => setOpen(false)} />}
    </ConnectAiContext.Provider>
  );
}

export function ConnectAiButton() {
  const openConnectAi = useOpenConnectAi();
  return (
    <button type="button" className="btn btn-secondary btn-small" onClick={openConnectAi}>
      <Icon icon={Bot} />
      Connect to AI
    </button>
  );
}

function ConnectAIDialog({ onClose }: { onClose: () => void }) {
  const { status } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (status.kind !== 'signedIn') {
    return (
      <Dialog title="Connect to AI" titleIcon={Bot} labelledBy="connect-ai-title" onBackdropClick={onClose}>
        <p className="dialog-message">Connecting an AI app needs a HikingBuddy account, so the AI can reach your gear from anywhere.</p>
        <p className="fineprint">Without an account HikingBuddy keeps working as it does now, in this browser.</p>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <DialogActions>
          <button type="button" className="btn btn-ghost dialog-cancel" onClick={onClose}>
            Not now
          </button>
          <GoogleSignInButton onError={setError} />
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog title="Connect to AI" titleIcon={Bot} labelledBy="connect-ai-title" choice onBackdropClick={onClose}>
      <p className="dialog-message">Let your AI app read and edit your HikingBuddy gear. Every change it makes shows up in Activity, where you can undo it.</p>
      <ConnectAiGuides />
      <ServerAddress />
      <DialogActions>
        <button type="button" className="btn btn-primary" onClick={onClose} autoFocus>
          OK
        </button>
      </DialogActions>
    </Dialog>
  );
}

function ConnectAiGuides() {
  const [selected, setSelected] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Tabs pattern: arrows move between the tabs, only the selected one is in the Tab order.
  function onKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (selected + (e.key === 'ArrowRight' ? 1 : -1) + CONNECT_AI_GUIDES.length) % CONNECT_AI_GUIDES.length;
    setSelected(next);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div className="connect-ai-guides">
      <div ref={tabsRef} className="tabs" role="tablist" aria-label="AI app" onKeyDown={onKey}>
        {CONNECT_AI_GUIDES.map((g, i) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            id={`connect-ai-tab-${g.id}`}
            aria-selected={i === selected}
            aria-controls={`connect-ai-panel-${g.id}`}
            tabIndex={i === selected ? 0 : -1}
            onClick={() => setSelected(i)}
          >
            {g.label}
          </button>
        ))}
      </div>
      {/* All panels share one grid cell, so the pop-up keeps its height when switching tabs. */}
      <div className="connect-ai-panels">
        {CONNECT_AI_GUIDES.map((g, i) => (
          <div
            key={g.id}
            role="tabpanel"
            id={`connect-ai-panel-${g.id}`}
            aria-labelledby={`connect-ai-tab-${g.id}`}
            className={i === selected ? undefined : 'is-inactive'}
            aria-hidden={i !== selected}
          >
            <GuideSteps guide={g} />
          </div>
        ))}
      </div>
    </div>
  );
}

function GuideSteps({ guide }: { guide: ConnectAiGuide }) {
  return (
    <>
      <ol className="steps">
        {guide.steps.map((step) => (
          <li key={step}>
            <span>
              {splitBold(step).map((part, i) => (part.bold ? <b key={i}>{part.text}</b> : part.text))}
            </span>
          </li>
        ))}
      </ol>
      {guide.caption && <p className="fineprint connect-ai-caption">{guide.caption}</p>}
    </>
  );
}

function ServerAddress() {
  // Same Worker serves the app and /mcp, so the address is this site's own (also locally).
  const address = `${window.location.origin}/mcp`;
  const [copied, setCopied] = useState<'no' | 'yes' | 'failed'>('no');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (copied !== 'yes') return;
    const timer = window.setTimeout(() => setCopied('no'), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied('yes');
    } catch {
      // Clipboard not allowed — select the text so Ctrl+C works.
      inputRef.current?.select();
      setCopied('failed');
    }
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor="connect-ai-address">
        Server address
      </label>
      <div className="copyfield">
        <input ref={inputRef} id="connect-ai-address" className="copyfield-input" readOnly value={address} onFocus={(e) => e.target.select()} />
        <button type="button" className={`btn btn-secondary ${copied === 'yes' ? 'is-copied' : ''}`} onClick={() => void copy()}>
          <Icon icon={copied === 'yes' ? Check : Copy} />
          {copied === 'yes' ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {copied === 'yes' ? 'Server address copied' : ''}
      </p>
      {copied === 'failed' && <p className="dialog-hint">Couldn't copy automatically — the address is selected, press Ctrl+C.</p>}
    </div>
  );
}
