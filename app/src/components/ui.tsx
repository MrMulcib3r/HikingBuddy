import type { ComponentType, MouseEvent, ReactNode } from 'react';
import { X } from 'lucide-react';
import { ICON_STROKE } from './icons/actionIcons';

/**
 * Small building blocks of the FR-19 design system (design/2026-10-redesign/design-system/
 * components): IconButton, Dialog, Banner, Badge. Behaviour lives in the feature
 * components; these only give every place the same look.
 */

type IconComponent = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' }>;

/** Renders a Lucide icon (or one of the custom hiker icons) at the standard size/stroke. */
export function Icon({ icon: I, size = 18 }: { icon: IconComponent; size?: number }) {
  return <I size={size} strokeWidth={ICON_STROKE} aria-hidden="true" />;
}

interface IconButtonProps {
  /** Full name of the action — used for the tooltip AND aria-label (design rule: an icon
   * alone is never enough). */
  label: string;
  icon: IconComponent;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: 'plain' | 'outlined';
  danger?: boolean;
  small?: boolean;
  disabled?: boolean;
  /** Tooltip below the button — for buttons at the top of the window or of a scrolling panel,
   * where a tooltip above would be cut off. */
  tipBelow?: boolean;
  /** Tooltip aligned to the button's right edge — for buttons near the right edge. */
  tipEnd?: boolean;
  className?: string;
}

export function IconButton({ label, icon, onClick, variant = 'plain', danger, small, disabled, tipBelow, tipEnd, className }: IconButtonProps) {
  const classes = [
    'icon-btn',
    variant === 'outlined' ? 'icon-btn-outlined' : '',
    danger ? 'icon-btn-danger' : '',
    small ? 'icon-btn-sm' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      className={classes}
      aria-label={label}
      data-tip={label}
      data-tip-pos={tipBelow ? 'below' : undefined}
      data-tip-align={tipEnd ? 'end' : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon icon={icon} />
    </button>
  );
}

interface DialogProps {
  title: ReactNode;
  /** Icon in front of the title (e.g. the carabiner on the "used elsewhere" dialog). */
  titleIcon?: IconComponent;
  wide?: boolean;
  /** 560px — the 3-way "used elsewhere" dialog, so its three buttons fit on one row. */
  choice?: boolean;
  /** Called when the scrim (outside the window) is clicked. Leave undefined for dialogs that
   * must not close that way (the add-item form, blocking choices). */
  onBackdropClick?: () => void;
  labelledBy?: string;
  children: ReactNode;
}

/** Modal frame: plum scrim, surface window, uppercase display title. Actions are passed as
 * children inside <DialogActions>. */
export function Dialog({ title, titleIcon, wide, choice, onBackdropClick, labelledBy = 'dialog-title', children }: DialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onBackdropClick}>
      <div
        className={`dialog ${wide ? 'dialog-wide' : ''} ${choice ? 'dialog-choice' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={labelledBy} className="dialog-title">
          {titleIcon && <Icon icon={titleIcon} size={20} />}
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

/** Bottom-right action row. A child with className "dialog-cancel" is pushed to the left. */
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="dialog-actions">{children}</div>;
}

interface BannerProps {
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  icon: IconComponent;
  children: ReactNode;
  actions?: ReactNode;
  /** Shows a close (×) icon button. */
  onClose?: () => void;
  closeLabel?: string;
  role?: 'alert' | 'status' | 'note';
}

/** Full-width message: icon, bold first phrase + one sentence, actions on the right. */
export function Banner({ tone = 'neutral', icon, children, actions, onClose, closeLabel = 'Close', role = 'status' }: BannerProps) {
  return (
    <div className={`banner banner-${tone}`} role={role}>
      <span className="banner-icon">
        <Icon icon={icon} />
      </span>
      <div className="banner-body">{children}</div>
      {(actions || onClose) && (
        <div className="banner-actions">
          {actions}
          {onClose && <IconButton label={closeLabel} icon={X} small onClick={onClose} />}
        </div>
      )}
    </div>
  );
}

interface BadgeProps {
  tone?: 'neutral' | 'linked' | 'success' | 'warning';
  icon?: IconComponent;
  /** Icon-only badge: the text goes to the tooltip and aria-label. */
  iconOnly?: boolean;
  children: ReactNode;
  tip?: string;
  /** Tooltip aligned to the badge's right edge (badges near the right edge of a panel). */
  tipEnd?: boolean;
}

export function Badge({ tone = 'neutral', icon, iconOnly, children, tip, tipEnd }: BadgeProps) {
  if (iconOnly && icon) {
    const label = typeof children === 'string' ? children : tip;
    return (
      <span className={`badge badge-${tone} badge-icon`} role="img" aria-label={label} data-tip={tip ?? label} data-tip-align="end">
        <Icon icon={icon} size={14} />
      </span>
    );
  }
  return (
    <span className={`badge badge-${tone}`} data-tip={tip} data-tip-align={tipEnd ? 'end' : undefined}>
      {icon && <Icon icon={icon} size={14} />}
      {children}
    </span>
  );
}
