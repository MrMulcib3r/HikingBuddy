import { useState } from 'react';
import { Backpack, HardDriveUpload, List, Map as MapIcon } from 'lucide-react';
import { countsOf } from '../core/importState';
import { plural } from '../utils/text';
import type { AppState } from '../types';
import { Dialog, DialogActions, Icon } from './ui';

/**
 * Design system ImportDialog (PRD v33, FR-23): right after the first sign-in, when this browser
 * (or its connected data file, whose working copy is in the browser) has HikingBuddy data.
 * Blocking — no click-outside, no Escape — because both answers matter. Never a silent
 * overwrite, and the local data stays in this browser either way.
 */
export function ImportLocalDialog({
  local,
  account,
  accountEmpty,
  onImport,
  onSkip,
}: {
  local: AppState;
  account: AppState;
  accountEmpty: boolean;
  onImport: () => Promise<void>;
  onSkip: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const counts = countsOf(local);

  async function doImport() {
    setBusy(true);
    setError(null);
    try {
      await onImport();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <Dialog title="Import your local gear?" titleIcon={HardDriveUpload} labelledBy="import-local-title">
      <p className="dialog-message">
        This browser has HikingBuddy data that is not in your account yet.
        {!accountEmpty &&
          ` Your account already has ${plural(account.gearItems.length, 'item')} and ${plural(account.gearLists.length, 'gearlist')}. Imported items and gearlists are added as new, nothing is overwritten.`}
      </p>
      <div className="counts">
        <div className="count">
          <span className="count-n">{counts.items}</span>
          <span className="count-l">
            <Icon icon={Backpack} size={16} />
            {counts.items === 1 ? 'item' : 'items'} in Gear Vault
          </span>
        </div>
        <div className="count">
          <span className="count-n">{counts.gearlists}</span>
          <span className="count-l">
            <Icon icon={List} size={16} />
            {counts.gearlists === 1 ? 'gearlist' : 'gearlists'}
          </span>
        </div>
        {counts.hasTemplate && (
          <div className="count">
            <span className="count-n">1</span>
            <span className="count-l">
              <Icon icon={MapIcon} size={16} />
              template
            </span>
          </div>
        )}
      </div>
      <p className="fineprint">Your local data stays in this browser either way.</p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <DialogActions>
        <button type="button" className="btn btn-secondary" onClick={onSkip} disabled={busy}>
          {accountEmpty ? 'Start with an empty account' : "Don't import"}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => void doImport()} disabled={busy}>
          <Icon icon={HardDriveUpload} />
          {accountEmpty ? 'Import your local data to your account' : 'Import as new items and gearlists'}
        </button>
      </DialogActions>
    </Dialog>
  );
}
