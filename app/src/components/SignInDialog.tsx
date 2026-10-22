import { useEffect, useRef, useState } from 'react';
import { Bot, History, LogIn, MonitorSmartphone } from 'lucide-react';
import { useAuth } from '../account/AuthContext';
import { loadGoogleIdentity } from '../account/googleSignIn';
import { Dialog, DialogActions, Icon } from './ui';

/**
 * Design system SignInWithGoogle (PRD v33, FR-23): what an account adds, and Google's own
 * button (rendered by Google Identity Services, so the "G" and the look follow Google's rules).
 * Google is the only sign-in method.
 */
export function SignInDialog({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog title="Sign in" titleIcon={LogIn} labelledBy="sign-in-title" onBackdropClick={onClose}>
      <p className="dialog-message">HikingBuddy works without an account. Signing in adds:</p>
      <ul className="benefits">
        <li>
          <span className="benefit-icon">
            <Icon icon={MonitorSmartphone} />
          </span>
          <div>
            <strong>The same gear on every device</strong>
            <span>Your Gear Vault and gearlists are saved to your account.</span>
          </div>
        </li>
        <li>
          <span className="benefit-icon">
            <Icon icon={Bot} />
          </span>
          <div>
            <strong>Connect your AI app</strong>
            <span>Claude or ChatGPT can read and edit your gear for you.</span>
          </div>
        </li>
        <li>
          <span className="benefit-icon">
            <Icon icon={History} />
          </span>
          <div>
            <strong>Activity with Undo</strong>
            <span>See every change, yours or the AI's, and undo it.</span>
          </div>
        </li>
      </ul>
      <p className="fineprint">HikingBuddy gets your name, e-mail and profile picture from Google. Your local gear stays in this browser.</p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <DialogActions>
        <button type="button" className="btn btn-ghost dialog-cancel" onClick={onClose}>
          Not now
        </button>
        <GoogleSignInButton onSignedIn={onClose} onError={setError} />
      </DialogActions>
    </Dialog>
  );
}

/**
 * Google's own "Sign in with Google" button (Google Identity Services). Shared by the Sign in
 * dialog and the guest variant of "Connect to AI" (FR-28).
 */
export function GoogleSignInButton({ onSignedIn, onError }: { onSignedIn?: () => void; onError: (message: string | null) => void }) {
  const { googleClientId, signInWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!googleClientId) return;
    let cancelled = false;
    loadGoogleIdentity()
      .then((gsi) => {
        if (cancelled || !buttonRef.current) return;
        gsi.initialize({
          client_id: googleClientId,
          ux_mode: 'popup',
          auto_select: false,
          callback: ({ credential }) => {
            setBusy(true);
            onError(null);
            signInWithGoogle(credential)
              .then(() => onSignedIn?.())
              .catch((err: unknown) => onError(err instanceof Error ? err.message : String(err)))
              .finally(() => setBusy(false));
          },
        });
        gsi.renderButton(buttonRef.current, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'rectangular', logo_alignment: 'left', locale: 'en' });
      })
      .catch((err: unknown) => !cancelled && onError(err instanceof Error ? err.message : String(err)));
    return () => {
      cancelled = true;
    };
  }, [googleClientId, signInWithGoogle, onSignedIn, onError]);

  if (googleClientId === null) return <span className="fineprint">Sign-in isn't set up yet.</span>;
  return <div className={`gsi-slot ${busy ? 'is-busy' : ''}`} ref={buttonRef} aria-busy={busy} />;
}
