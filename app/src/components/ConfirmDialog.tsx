import type { ComponentType } from 'react';
import { Dialog, DialogActions, Icon } from './ui';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Icon on the confirm button (dialog buttons carry icon + label, design system). */
  confirmIcon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Generic yes/no confirmation — snapshot overwrite, deletes, import, template… */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  confirmIcon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog title={title} labelledBy="confirm-title" onBackdropClick={onCancel}>
      <p className="dialog-message">{message}</p>
      <DialogActions>
        <button type="button" className="btn btn-ghost dialog-cancel" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
          {confirmIcon && <Icon icon={confirmIcon} />}
          {confirmLabel}
        </button>
      </DialogActions>
    </Dialog>
  );
}
