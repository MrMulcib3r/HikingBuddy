import { useState } from 'react';
import { CircleAlert, CloudOff, Hourglass, LogIn, RefreshCw, TriangleAlert } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { SignInDialog } from './SignInDialog';
import { Banner, Icon } from './ui';

/**
 * Design system Banner, PRD v33 variants (signed in, server = source of truth): what is wrong
 * with saving, and that the unsaved changes are kept in this browser. Warning, not danger:
 * nothing is lost.
 */
export function AccountBanners() {
  const account = useAccount();
  const [signInOpen, setSignInOpen] = useState(false);
  if (!account) return null;
  const { status, notice, dismissNotice, retry } = account.sync;

  const tryAgain = (
    <button type="button" className="btn btn-secondary btn-small" onClick={retry}>
      <Icon icon={RefreshCw} />
      Try again
    </button>
  );

  const banner =
    status.kind === 'offline' ? (
      <Banner tone="warning" icon={CloudOff} role="alert" actions={tryAgain}>
        <strong>You are offline.</strong> Your changes are kept in this browser and saved when you are back online.
      </Banner>
    ) : status.kind === 'limit' ? (
      <Banner tone="warning" icon={Hourglass} role="alert">
        <strong>HikingBuddy reached today's free limit.</strong> Your unsaved changes are kept in this browser. Try again tomorrow.
      </Banner>
    ) : status.kind === 'signedOut' ? (
      <Banner
        tone="warning"
        icon={LogIn}
        role="alert"
        actions={
          <button type="button" className="btn btn-secondary btn-small" onClick={() => setSignInOpen(true)}>
            <Icon icon={LogIn} />
            Sign in
          </button>
        }
      >
        <strong>You are signed out.</strong> Your changes are kept in this browser. Sign in again to save them.
      </Banner>
    ) : status.kind === 'outdated' ? (
      <Banner
        tone="warning"
        icon={TriangleAlert}
        role="alert"
        actions={
          <button type="button" className="btn btn-secondary btn-small" onClick={() => window.location.reload()}>
            <Icon icon={RefreshCw} />
            Reload
          </button>
        }
      >
        <strong>HikingBuddy was updated.</strong> Reload the page to keep saving — your changes are kept in this browser.
      </Banner>
    ) : status.kind === 'error' ? (
      <Banner tone="warning" icon={TriangleAlert} role="alert" actions={tryAgain}>
        <strong>Your changes aren't saved yet.</strong> They are kept in this browser. {status.message}
      </Banner>
    ) : null;

  if (!banner && !notice && !signInOpen) return null;
  return (
    <>
      {(banner || notice) && (
        <div className="header-banners">
          {banner}
          {notice && (
            <Banner tone="danger" icon={CircleAlert} onClose={dismissNotice}>
              {notice}
            </Banner>
          )}
        </div>
      )}
      {signInOpen && <SignInDialog onClose={() => setSignInOpen(false)} />}
    </>
  );
}
