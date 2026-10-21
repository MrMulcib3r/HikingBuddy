import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { useOptionalDataFile } from '../state/DataFileContext';
import { isEmptyState, parseBackup } from '../storage';
import demoFileText from '../demo/demo-data.json?raw';
import { ConfirmDialog } from './ConfirmDialog';
import { plural } from '../utils/text';
import { LogoMark } from './icons/HikerIcons';

/**
 * FR-17 — "Load demo data" for presenting the app (an empty app shows nothing). The demo is
 * a file inside the app (`src/demo/demo-data.json`, Export format). It goes through
 * parseBackup(), i.e. through the same schema migrations as any old backup, so it keeps
 * loading correctly after future data-model changes.
 *
 * Never available while a data file is connected or remembered (FR-16): loading the demo
 * would then be auto-saved over Martin's real data. Signed in (PRD v33, FR-23) it is offered
 * only while the account is empty — App.tsx hides the header button otherwise.
 */
function loadDemoState() {
  return parseBackup(demoFileText);
}

const BLOCKED_MESSAGE = 'Disconnect your data file first — otherwise the demo data would be saved into it over your own data.';

type Step = 'idle' | 'confirm' | 'blocked';

function useLoadDemo() {
  const { state, replaceState } = useApp();
  const fileInUse = useOptionalDataFile()?.fileInUse ?? false;
  const [step, setStep] = useState<Step>('idle');

  function start() {
    if (fileInUse) setStep('blocked');
    else if (isEmptyState(state)) replaceState(loadDemoState());
    else setStep('confirm');
  }

  const dialog =
    step === 'blocked' ? (
      <ConfirmDialog title="Load demo data" message={BLOCKED_MESSAGE} confirmLabel="OK" onConfirm={() => setStep('idle')} onCancel={() => setStep('idle')} />
    ) : step === 'confirm' ? (
      <ConfirmDialog
        title="Load demo data"
        danger
        message={`This replaces everything currently in Gear Vault and your gearlists (${plural(state.gearItems.length, 'item')}, ${plural(state.gearLists.length, 'gearlist')}) with the demo data. This can't be undone unless you have a backup (Export backup). Continue?`}
        confirmLabel="Replace with demo data"
        onConfirm={() => {
          replaceState(loadDemoState());
          setStep('idle');
        }}
        onCancel={() => setStep('idle')}
      />
    ) : null;

  return { start, dialog, fileInUse };
}

/** Header button, next to Export / Import. */
export function LoadDemoButton() {
  const { start, dialog, fileInUse } = useLoadDemo();
  return (
    <>
      <button
        type="button"
        className={`btn btn-ghost btn-small ${fileInUse ? 'btn-looks-disabled' : ''}`}
        aria-disabled={fileInUse}
        onClick={start}
        data-tip={fileInUse ? BLOCKED_MESSAGE : 'Fill the app with example gear and gearlists to try it out'}
        data-tip-pos="below"
      >
        Load demo data
      </button>
      {dialog}
    </>
  );
}

/** Shown instead of the two panels while the app is completely empty. */
export function WelcomeCard({ onStartEmpty }: { onStartEmpty: () => void }) {
  const { start, dialog, fileInUse } = useLoadDemo();
  return (
    <main className="welcome">
      <div className="welcome-card">
        <LogoMark size={48} />
        <h2>Welcome to HikingBuddy</h2>
        <p>
          Keep all the gear you own in one <strong>Gear Vault</strong>, build a <strong>gearlist</strong> for every trip from it, and see your
          base weight at a glance.
        </p>
        <p>
          Unlike other gear-list apps, editing an item never silently changes your older gearlists — HikingBuddy always asks first.
        </p>
        <div className="welcome-actions">
          <button type="button" className="btn btn-primary" onClick={start} disabled={fileInUse}>
            Load demo data
          </button>
          <button type="button" className="btn btn-ghost" onClick={onStartEmpty}>
            Start empty
          </button>
        </div>
        {fileInUse && <p className="welcome-hint">{BLOCKED_MESSAGE}</p>}
      </div>
      {dialog}
    </main>
  );
}
