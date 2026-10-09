import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { useDataFile } from '../state/DataFileContext';
import { pickExistingDataFile, pickNewDataFile } from '../dataFile';
import { ConfirmDialog } from './ConfirmDialog';
import type { AppState } from '../types';

/** FR-16, header part: "Connect data file", or where the data is being saved right now. */
export function DataFileControls() {
  const { status, disconnect } = useDataFile();
  const [connectOpen, setConnectOpen] = useState(false);

  if (status.kind === 'unsupported') {
    return (
      <span
        className="data-file-status data-file-status-muted"
        title="Automatic saving to a file on your computer works in Chrome and Edge on a computer. Here your data is saved in this browser — use Export backup to keep a copy."
      >
        Auto-save to file: Chrome / Edge only
      </span>
    );
  }
  if (status.kind === 'starting') return null;

  if (status.kind === 'none') {
    return (
      <>
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={() => setConnectOpen(true)}
          title="Save your data automatically to a file on this computer"
        >
          Connect data file
        </button>
        {connectOpen && <ConnectDialog onClose={() => setConnectOpen(false)} />}
      </>
    );
  }

  if (status.kind === 'connected') {
    const label =
      status.save === 'saving'
        ? 'Saving…'
        : status.save === 'error'
          ? `Couldn't save to ${status.fileName}`
          : status.savedAt
            ? `Saved to ${status.fileName} · ${status.savedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
            : `Saved to ${status.fileName}`;
    return (
      <span className="data-file-connected">
        <span
          className={`data-file-status ${status.save === 'error' ? 'data-file-status-error' : ''}`}
          title={status.save === 'error' ? `${status.error ?? ''} — it will try again with your next change.` : 'Every change is saved to this file automatically.'}
          aria-live="polite"
        >
          <span className={`data-file-dot data-file-dot-${status.save}`} aria-hidden="true" />
          {label}
        </span>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => void disconnect()} title="Stop saving to this file. Your data stays in the browser and in the file.">
          Disconnect
        </button>
      </span>
    );
  }

  // reconnect / missing / conflict — the banner under the header explains and offers the actions.
  return <span className="data-file-status data-file-status-warning">Not saving to file</span>;
}

/** FR-16, everything that needs more room than the header: the reconnect / missing-file
 * banner, the conflict dialog, and one-off notices. */
export function DataFileBanner() {
  const { state } = useApp();
  const { status, notice, dismissNotice, reconnect, disconnect, resolveConflict } = useDataFile();
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <>
      {status.kind === 'reconnect' && (
        <div className="data-file-banner" role="alert">
          <span>
            <strong>Reconnect to your data file</strong> "{status.fileName}" — until then, changes are saved only in this browser.
          </span>
          <button type="button" className="btn btn-primary btn-small" onClick={() => void reconnect()}>
            Reconnect
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => void disconnect()}>
            Disconnect
          </button>
        </div>
      )}

      {status.kind === 'missing' && (
        <div className="data-file-banner data-file-banner-error" role="alert">
          <span>
            <strong>Can't find your data file</strong> "{status.fileName}" — it may have been moved, renamed or deleted. Your data is still saved
            in this browser.
          </span>
          <button type="button" className="btn btn-primary btn-small" onClick={() => setConnectOpen(true)}>
            Connect another file
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => void disconnect()}>
            Disconnect
          </button>
        </div>
      )}

      {notice && (
        <div className={`data-file-banner ${notice.error ? 'data-file-banner-error' : 'data-file-banner-info'}`} role="status">
          <span>{notice.text}</span>
          <button type="button" className="template-banner-close" aria-label="Close" title="Close" onClick={dismissNotice}>
            ×
          </button>
        </div>
      )}

      {connectOpen && <ConnectDialog onClose={() => setConnectOpen(false)} />}

      {status.kind === 'conflict' && (
        <div className="dialog-backdrop" role="presentation">
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="data-conflict-title">
            <h3 id="data-conflict-title">"{status.fileName}" already contains data</h3>
            <p className="dialog-message">
              {status.reason === 'connect'
                ? 'The file and the app hold different data. Which one do you want to keep? The other one will be replaced.'
                : 'The data in this browser and in the file are different (for example, you made changes while the file wasn’t connected, or the file was changed on another computer). Which one do you want to keep? The other one will be replaced.'}
            </p>
            <table className="data-compare">
              <tbody>
                <tr>
                  <th scope="row">In the app</th>
                  <td>{describeCounts(state)}</td>
                </tr>
                <tr>
                  <th scope="row">In the file</th>
                  <td>{describeCounts(status.fileState)}</td>
                </tr>
              </tbody>
            </table>
            <div className="dialog-actions dialog-actions-three">
              <button type="button" className="btn btn-ghost" onClick={() => void resolveConflict('cancel')}>
                Cancel
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => void resolveConflict('load-file')}>
                Load data from file
              </button>
              <button type="button" className="btn btn-danger" onClick={() => void resolveConflict('overwrite-file')}>
                Overwrite file with current data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function describeCounts(s: AppState): string {
  return `${s.gearItems.length} item(s) in Gear Vault, ${s.gearLists.length} gearlist(s)${s.templates.length ? ', a template' : ''}`;
}

/** Explains the feature once, then opens the browser's own file dialog. */
function ConnectDialog({ onClose }: { onClose: () => void }) {
  const { connect } = useDataFile();
  const [error, setError] = useState<string | null>(null);

  async function pick(kind: 'new' | 'existing') {
    try {
      const handle = kind === 'new' ? await pickNewDataFile() : await pickExistingDataFile();
      if (!handle) return; // user closed the browser's dialog
      onClose();
      await connect(handle);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (error) {
    return <ConfirmDialog title="Couldn't open the file dialog" message={error} confirmLabel="OK" onConfirm={onClose} onCancel={onClose} />;
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="connect-file-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="connect-file-title">Connect data file</h3>
        <p className="dialog-message">
          HikingBuddy will save all your data to a file on this computer automatically after every change, so it survives even clearing the
          browser's data.
        </p>
        <p className="dialog-hint">
          Tip: keep the file in a folder synced to the cloud (OneDrive, Google Drive) — it's then backed up and reachable from another
          computer too.
        </p>
        <div className="dialog-actions dialog-actions-three">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => void pick('existing')}>
            Choose existing file
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void pick('new')}>
            Create new file
          </button>
        </div>
      </div>
    </div>
  );
}
