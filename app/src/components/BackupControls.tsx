import { useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { useAccount } from '../account/AccountContext';
import { buildBackup, parseBackup } from '../storage';
import { ConfirmDialog } from './ConfirmDialog';
import { plural } from '../utils/text';
import { ActionIcon } from './icons/actionIcons';
import { Icon } from './ui';

/**
 * The only thing in this MVP (no account/server yet, see PRD section 2/6) that makes data
 * survive something outside the app's control — most importantly the user clearing their
 * browser's site data, which wipes localStorage (and would wipe IndexedDB just as
 * completely; the problem is "this lives only in browser storage", not which browser API).
 * Export writes a real file to disk; Import reads one back. Everything else (the automatic
 * schema migration in storage.ts) protects against the *app* changing shape — this protects
 * against the *browser* losing the data outright.
 */
export function BackupControls() {
  const { state, replaceState } = useApp();
  // Signed in (PRD v33, FR-23): a backup goes into the account like the local-data import —
  // into an empty account as it is, otherwise added as new; the account is never overwritten.
  const account = useAccount();
  const addsAsNew = account !== null && !account.sync.accountEmpty;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof parseBackup> | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function handleExport() {
    const backup = buildBackup(state);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hikingbuddy-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseBackup(String(reader.result));
        setImportError(null);
        setPendingImport(imported);
      } catch {
        setImportError(`"${file.name}" doesn't look like a HikingBuddy backup file.`);
      }
    };
    reader.onerror = () => setImportError(`Could not read "${file.name}".`);
    reader.readAsText(file);
  }

  return (
    <div className="backup-controls header-group">
      <button type="button" className="btn btn-ghost btn-small" onClick={handleExport} data-tip="Save all your data as a file on this computer" data-tip-pos="below">
        <Icon icon={ActionIcon.exportBackup} />
        Export
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-small"
        onClick={() => fileInputRef.current?.click()}
        data-tip="Restore data from an exported backup file"
        data-tip-pos="below"
      >
        <Icon icon={ActionIcon.importBackup} />
        Import
      </button>
      <input ref={fileInputRef} type="file" accept="application/json" className="visually-hidden" onChange={handleFileChange} />

      {importError && (
        <ConfirmDialog
          title="Import failed"
          message={importError}
          confirmLabel="OK"
          onConfirm={() => setImportError(null)}
          onCancel={() => setImportError(null)}
        />
      )}

      {pendingImport && (
        <ConfirmDialog
          title="Import backup"
          danger={!account}
          message={addsAsNew
            ? `The backup's ${plural(pendingImport.gearItems.length, 'item')} and ${plural(pendingImport.gearLists.length, 'gearlist')} are added to your account as new items and gearlists. Nothing in your account is overwritten. Continue?`
            : account
              ? `This imports the backup (${plural(pendingImport.gearItems.length, 'item')}, ${plural(pendingImport.gearLists.length, 'gearlist')}) into your account. Continue?`
              : `This replaces everything currently in Gear Vault and your gearlists (${plural(state.gearItems.length, 'item')}, ${plural(state.gearLists.length, 'gearlist')}) with the contents of the backup file (${plural(pendingImport.gearItems.length, 'item')}, ${plural(pendingImport.gearLists.length, 'gearlist')}). This can't be undone unless you have another backup. Continue?`}
          confirmLabel={addsAsNew ? 'Import as new' : account ? 'Import backup' : 'Replace with backup'}
          confirmIcon={ActionIcon.importBackup}
          onConfirm={() => {
            replaceState(pendingImport);
            setPendingImport(null);
          }}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  );
}
