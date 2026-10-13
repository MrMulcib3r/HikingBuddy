import { List } from 'lucide-react';
import { TEMPLATE_NAME } from '../constants';
import { ActionIcon } from './icons/actionIcons';
import { CarabinerIcon } from './icons/HikerIcons';
import { Dialog, DialogActions, Icon } from './ui';

interface VaultEditDialogProps {
  title: string;
  message: string;
  onCancel: () => void;
  onCopy: () => void;
  onContinue: () => void;
  /** Button labels — default to the edit wording; deleting a used item reuses this dialog
   * with its own labels (keep rows as custom entries / delete everywhere). */
  copyLabel?: string;
  continueLabel?: string;
  continueDanger?: boolean;
  /** Names of the gearlists that the change would touch — listed under the message so the
   * user knows exactly what they're agreeing to (BACKLOG CR, 2026-09-24). */
  affectedLists?: string[];
}

/**
 * FR-5: shown whenever an edit would change a Gear Vault item that's already used in one
 * or more gearlists — either editing the item directly in Gear Vault, or editing a linked
 * item's name/category/weight directly inside a gearlist (same underlying operation).
 *
 * Always a blocking dialog, never a toast — data must never change under the user without
 * their explicit choice. Three options, no default/silent path:
 * - Cancel: discard the edit.
 * - Create a copy of the item: adds a new Gear Vault item with the new values; every
 *   existing gearlist (including the one being edited from, if any) keeps pointing at the
 *   old, unchanged item — except the specific row being edited, which switches to the copy.
 * - Continue: applies the edit to the shared item, so it updates in every gearlist that uses it.
 */
export function VaultEditDialog({
  title,
  message,
  onCancel,
  onCopy,
  onContinue,
  copyLabel = 'Create a copy of the item',
  continueLabel = 'Continue',
  continueDanger = false,
  affectedLists = [],
}: VaultEditDialogProps) {
  return (
    <Dialog title={title} titleIcon={CarabinerIcon} choice labelledBy="vault-edit-title" onBackdropClick={onCancel}>
      <p className="dialog-message">{message}</p>
      {affectedLists.length > 0 && (
        <div className="affected-lists">
          <span className="label">Affected gearlists:</span>
          <ul>
            {affectedLists.map((name, i) => (
              <li key={i}>
                <Icon icon={name.startsWith(TEMPLATE_NAME) ? ActionIcon.template : List} size={16} />
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
      <DialogActions>
        <button type="button" className="btn btn-ghost dialog-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCopy}>
          <Icon icon={continueDanger ? ActionIcon.keepInGearlists : ActionIcon.createCopy} />
          {copyLabel}
        </button>
        <button type="button" className={continueDanger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onContinue}>
          <Icon icon={continueDanger ? ActionIcon.delete : ActionIcon.confirm} />
          {continueLabel}
        </button>
      </DialogActions>
    </Dialog>
  );
}
