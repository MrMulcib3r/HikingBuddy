import { useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { buildShareUrl } from '../share';
import type { GearList } from '../types';

/** FR-18: read-only link to the gearlist as it is right now (data lives in the link). */
export function ShareDialog({ list, onClose }: { list: GearList; onClose: () => void }) {
  const { state } = useApp();
  // Built once when the dialog opens — the link is a copy of this moment.
  const [url] = useState(() => buildShareUrl(list, state.unitPreference));
  const [copied, setCopied] = useState<'no' | 'yes' | 'failed'>('no');
  const inputRef = useRef<HTMLInputElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied('yes');
    } catch {
      // Clipboard not allowed (e.g. not https) — select the text so Ctrl+C works.
      inputRef.current?.select();
      setCopied('failed');
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="share-title">Share "{list.name}"</h3>
        <p className="dialog-message">Anyone with this link can see the gearlist — read-only, with its weights. Nothing else from your app is shared.</p>
        <div className="share-link-row">
          <input ref={inputRef} className="share-link-input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Share link" />
          <button type="button" className="btn btn-primary btn-small" onClick={() => void copy()}>
            {copied === 'yes' ? 'Copied!' : 'Copy link'}
          </button>
        </div>
        {copied === 'failed' && <p className="dialog-hint">Couldn't copy automatically — the link is selected, press Ctrl+C.</p>}
        <p className="dialog-hint">This link contains a copy of the gearlist as it is now. Later changes won't appear in it.</p>
        <div className="dialog-actions">
          <a className="btn btn-ghost" href={url} target="_blank" rel="noreferrer">
            Open preview
          </a>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
