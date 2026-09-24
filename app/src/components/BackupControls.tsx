import { useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { buildBackup, parseBackup } from '../storage';
import { ConfirmDialog } from './ConfirmDialog';

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
    <div className="backup-controls">
      <button type="button" className="btn btn-ghost btn-small" onClick={handleExport} title="Save all your data as a file on this computer">
        Export backup
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-small"
        onClick={() => fileInputRef.current?.click()}
        title="Restore data from a previously exported backup file"
      >
        Import backup
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
          danger
          message={`This replaces everything currently in Gear Vault and your gearlists (${state.gearItems.length} item(s), ${state.gearLists.length} gearlist(s)) with the contents of the backup file (${pendingImport.gearItems.length} item(s), ${pendingImport.gearLists.length} gearlist(s)). This can't be undone unless you have another backup. Continue?`}
          confirmLabel="Replace with backup"
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
