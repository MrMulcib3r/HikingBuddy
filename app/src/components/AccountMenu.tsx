import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Bot, ChevronDown, Cloud, CloudOff, History, Hourglass, LogIn, LogOut, RefreshCw, TriangleAlert } from 'lucide-react';
import { useAuth } from '../account/AuthContext';
import { useAccount } from '../account/AccountContext';
import type { AccountUser } from '../account/api';
import type { SaveStatus } from '../account/accountStore';
import { ActivityPanel } from './ActivityPanel';
import { SignInDialog } from './SignInDialog';
import { useOpenConnectAi } from './ConnectAIDialog';
import { Icon } from './ui';

/**
 * Design system AccountMenu (PRD v33, FR-23): the right end of the header.
 * Guest: "Sign in". Signed in: avatar + first name with a menu (Connect to AI, Activity, Sign
 * out). The "Connect to AI" header button (FR-28) sits next to it for both, see App.tsx.
 */
export function SignInButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-secondary btn-small" onClick={() => setOpen(true)}>
        <Icon icon={LogIn} />
        Sign in
      </button>
      {open && <SignInDialog onClose={() => setOpen(false)} />}
    </>
  );
}

/** Replaces the data-file status while signed in (the data file isn't used with an account). */
export function SaveStatusChip() {
  const account = useAccount();
  if (!account) return null;
  const view = statusView(account.sync.status);
  if (!view) return null;
  return (
    <span className={`save-status save-status-${view.tone}`} role="status" data-tip={view.tip} data-tip-pos="below">
      <Icon icon={view.icon} size={16} />
      {view.label}
    </span>
  );
}

function statusView(status: SaveStatus) {
  switch (status.kind) {
    case 'saved':
      return { tone: 'saved', icon: Cloud, label: 'Saved', tip: 'All changes are saved to your account' };
    case 'saving':
    case 'loading':
      return { tone: 'saving', icon: RefreshCw, label: 'Saving…', tip: undefined };
    case 'offline':
      return { tone: 'warning', icon: CloudOff, label: 'Offline · changes kept', tip: 'Changes are kept in this browser and saved when you are back online' };
    case 'limit':
      return { tone: 'warning', icon: Hourglass, label: 'Daily limit reached', tip: "Changes are kept in this browser and saved after the limit resets" };
    case 'signedOut':
      return { tone: 'warning', icon: CloudOff, label: 'Not saving · signed out', tip: 'Sign in again to save your changes' };
    case 'outdated':
    case 'error':
      return { tone: 'warning', icon: TriangleAlert, label: 'Not saved yet', tip: 'Changes are kept in this browser' };
  }
}

export function Avatar({ user }: { user: AccountUser }) {
  const [broken, setBroken] = useState(false);
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return (
    <span className="avatar" aria-hidden="true">
      {user.picture && !broken ? <img src={user.picture} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} /> : initials}
    </span>
  );
}

export function AccountMenu() {
  const account = useAccount();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const openConnectAi = useOpenConnectAi();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    // Keyboard users land on the first item (design system: Enter / Space / ArrowDown opens it).
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!account) return null;
  const { user } = account;
  const firstName = user.name.split(/\s+/)[0] ?? user.name;

  const items = () => [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
  function openMenu() {
    setOpen(true);
  }
  function closeMenu() {
    setOpen(false);
    buttonRef.current?.focus();
  }
  function onButtonKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenu();
    }
  }
  function onMenuKey(e: KeyboardEvent) {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = (index + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
      list[next]?.focus();
    }
  }

  return (
    <div className="account">
      <button
        ref={buttonRef}
        type="button"
        className="account-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu, ${user.name}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onButtonKey}
      >
        <Avatar user={user} />
        <span className="account-name">{firstName}</span>
        <Icon icon={ChevronDown} size={16} />
      </button>
      {open && (
        <ul ref={menuRef} className="account-menu" role="menu" aria-label="Account" onKeyDown={onMenuKey}>
          <li className="account-menu-head" role="none">
            <Avatar user={user} />
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </li>
          <li role="none">
            <button
              type="button"
              className="account-menu-item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                openConnectAi();
              }}
            >
              <Icon icon={Bot} />
              Connect to AI
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              className="account-menu-item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setActivityOpen(true);
              }}
            >
              <Icon icon={History} />
              Activity
            </button>
          </li>
          <li role="separator" className="account-menu-sep" />
          <li role="none">
            <button
              type="button"
              className="account-menu-item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
            >
              <Icon icon={LogOut} />
              Sign out
            </button>
          </li>
        </ul>
      )}
      {activityOpen && (
        <ActivityPanel
          onClose={() => {
            setActivityOpen(false);
            buttonRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
