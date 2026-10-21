import { TriangleAlert, Undo2 } from 'lucide-react';
import type { UndoConflict } from '../account/accountStore';
import type { UnitPreference } from '../types';
import { plural } from '../utils/text';
import { ConflictLine } from './RichText';
import { Dialog, DialogActions, Icon } from './ui';

interface UndoDialogProps {
  /** "UNDO AI CHANGES FROM TODAY?" */
  title: string;
  /** "made by AI today" / "made by Claude at 14:02" */
  madeBy: string;
  count: number;
  conflicting: number;
  byClient: { client: string; count: number }[];
  conflicts: UndoConflict[];
  unit: UnitPreference;
  busy: boolean;
  error: string | null;
  onConfirm: (mode: 'all' | 'keep_later') => void;
  onCancel: () => void;
}

/** Design system UndoDialog (PRD v33, FR-25): confirmation before a large Undo — always for
 * "Undo all AI changes from this day", and for an AI step with more than 3 conflicts. */
export function UndoDialog({ title, madeBy, count, conflicting, byClient, conflicts, unit, busy, error, onConfirm, onCancel }: UndoDialogProps) {
  const clients = byClient.map((c) => `${c.client} (${plural(c.count, 'change')})`);
  const rest = count - conflicting;
  return (
    <Dialog title={title} titleIcon={Undo2} labelledBy="undo-dialog-title" onBackdropClick={busy ? undefined : onCancel}>
      <p className="dialog-message">
        This reverts <b>{plural(count, 'change')}</b> {madeBy}
        {byClient.length > 1 ? `: ${clients.slice(0, -1).join(', ')} and ${clients.at(-1)}` : ''}. Your own changes stay as they are.
      </p>
      {conflicts.length > 0 && (
        <div className="undo-conflicts">
          <p className="undo-conflicts-head">
            <Icon icon={TriangleAlert} size={16} />
            <span>
              <b>{conflicting === 1 ? '1 of them conflicts' : `${conflicting} of them conflict`}</b> with later changes:
            </span>
          </p>
          <ul>
            {conflicts.map((c, i) => (
              <li key={i}>
                <ConflictLine conflict={c} unit={unit} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="act-error" role="alert">{error}</p>}
      <DialogActions>
        <button type="button" className="btn btn-ghost dialog-cancel" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        {conflicts.length > 0 ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => onConfirm('all')} disabled={busy}>
              Undo all {count}
            </button>
            {rest > 0 && (
              <button type="button" className="btn btn-primary" onClick={() => onConfirm('keep_later')} disabled={busy}>
                Undo {rest}, keep later changes
              </button>
            )}
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => onConfirm('all')} disabled={busy}>
            <Icon icon={Undo2} />
            Undo {plural(count, 'change')}
          </button>
        )}
      </DialogActions>
    </Dialog>
  );
}
