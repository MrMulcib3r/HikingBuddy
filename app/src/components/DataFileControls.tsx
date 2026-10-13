import { useState } from 'react';
import { CircleAlert, HardDriveUpload, Info, TriangleAlert } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { useDataFile } from '../state/DataFileContext';
import { pickExistingDataFile, pickNewDataFile } from '../dataFile';
import { ConfirmDialog } from './ConfirmDialog';
import { plural } from '../utils/text';
import { ActionIcon } from './icons/actionIcons';
import { Banner, Dialog, DialogActions, Icon } from './ui';
import type { AppState } from '../types';

/** FR-16, header part: "Connect data file", or where the data is being saved right now. */
export function DataFileControls() {
  const { status, disconnect } = useDataFile();
  const [connectOpen, setConnectOpen] = useState(false);

  if (status.kind === 'unsupported') {
    return (
      <span
        className="badge"
        data-tip="Saving to a file needs Chrome or Edge on a computer. Use Export backup to keep a copy."
        data-tip-pos="below"
      >
        <Icon icon={ActionIcon.dataFile} size={14} />
        Auto-save to file: Chrome / Edge only
      </span>
    );
  }
  if (status.kind === 'starting') return null;

  if (status.kind === 'none') {
    return (
      <>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => setConnectOpen(true)}>
          <Icon icon={ActionIcon.dataFile} />
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
          className={`badge data-file-status ${status.save === 'error' ? 'badge-warning' : 'badge-success'}`}
          data-tip={status.save === 'error' ? `${status.error ?? ''} — it will try again with your next change.` : 'Every change is saved to this file automatically.'}
          data-tip-pos="below"
          aria-live="polite"
        >
          <Icon icon={status.save === 'error' ? TriangleAlert : ActionIcon.dataFile} size={14} />
          {label}
        </span>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => void disconnect()}>
          <Icon icon={ActionIcon.disconnect} />
          Disconnect
        </button>
      </span>
    );
  }

  // reconnect / missing / conflict — the banner under the header explains and offers the actions.
  return (
    <span className="badge badge-warning data-file-status">
      <Icon icon={TriangleAlert} size={14} />
      Not saving to file
    </span>
  );
}

/** FR-16, everything that needs more room than the header: the reconnect / missing-file
 * banner, the conflict dialog, and one-off notices. */
export function DataFileBanner() {
  const { state } = useApp();
  const { status, notice, dismissNotice, reconnect, disconnect, resolveConflict } = useDataFile();
  const [connectOpen, setConnectOpen] = useState(false);
  const hasBanner = status.kind === 'reconnect' || status.kind === 'missing' || notice !== null;

  return (
    <>
      {hasBanner && (
        <div className="header-banners">
          {status.kind === 'reconnect' && (
            <Banner
              tone="warning"
              icon={TriangleAlert}
              role="alert"
              actions={
                <>
                  <button type="button" className="btn btn-primary btn-small" onClick={() => void reconnect()}>
                    Reconnect
                  </button>
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => void disconnect()}>
                    Disconnect
                  </button>
                </>
              }
            >
              <span className="data-file-banner">
                <strong>Reconnect to your data file</strong> "{status.fileName}" — until then, changes are saved only in this browser.
              </span>
            </Banner>
          )}

          {status.kind === 'missing' && (
            <Banner
              tone="danger"
              icon={CircleAlert}
              role="alert"
              actions={
                <>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => setConnectOpen(true)}>
                    Connect another file
                  </button>
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => void disconnect()}>
                    Disconnect
                  </button>
                </>
              }
            >
              <span className="data-file-banner">
                <strong>Can't find your data file</strong> "{status.fileName}" — it may have been moved, renamed or deleted. Your data is still
                saved in this browser.
              </span>
            </Banner>
          )}

          {notice && (
            <Banner tone={notice.error ? 'danger' : 'success'} icon={notice.error ? CircleAlert : Info} onClose={dismissNotice}>
              <span className="data-file-banner">{notice.text}</span>
            </Banner>
          )}
        </div>
      )}

      {connectOpen && <ConnectDialog onClose={() => setConnectOpen(false)} />}

      {status.kind === 'conflict' && (
        <Dialog title={`"${status.fileName}" already contains data`} titleIcon={ActionIcon.dataFile} labelledBy="data-conflict-title">
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
          <DialogActions>
            <button type="button" className="btn btn-ghost dialog-cancel" onClick={() => void resolveConflict('cancel')}>
              Cancel
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void resolveConflict('load-file')}>
              <Icon icon={HardDriveUpload} />
              Load data from file
            </button>
            <button type="button" className="btn btn-danger" onClick={() => void resolveConflict('overwrite-file')}>
              <Icon icon={ActionIcon.exportBackup} />
              Overwrite file with current data
            </button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

function describeCounts(s: AppState): string {
  return `${plural(s.gearItems.length, 'item')} in Gear Vault, ${plural(s.gearLists.length, 'gearlist')}${s.templates.length ? ', a template' : ''}`;
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
    <Dialog title="Connect data file" titleIcon={ActionIcon.dataFile} labelledBy="connect-file-title" onBackdropClick={onClose}>
      <p className="dialog-message">
        HikingBuddy will save all your data to a file on this computer automatically after every change, so it survives even clearing the
        browser's data.
      </p>
      <p className="dialog-hint">
        Tip: keep the file in a folder synced to the cloud (OneDrive, Google Drive) — it's then backed up and reachable from another computer
        too.
      </p>
      <DialogActions>
        <button type="button" className="btn btn-ghost dialog-cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => void pick('existing')}>
          <Icon icon={HardDriveUpload} />
          Choose existing file
        </button>
        <button type="button" className="btn btn-primary" onClick={() => void pick('new')}>
          <Icon icon={ActionIcon.add} />
          Create new file
        </button>
      </DialogActions>
    </Dialog>
  );
}
