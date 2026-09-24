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
}: VaultEditDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="vault-edit-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="vault-edit-title">{title}</h3>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions dialog-actions-three">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCopy}>
            {copyLabel}
          </button>
          <button type="button" className={continueDanger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onContinue}>
            {continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
