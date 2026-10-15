import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CircleCheck, Mail, Send } from 'lucide-react';
import {
  HCAPTCHA_SITE_KEY,
  MESSAGE_MAX_LENGTH,
  isContactFormConfigured,
  isValidEmail,
  loadHCaptcha,
  sendContactMessage,
} from '../contact';
import { Dialog, DialogActions, Icon } from './ui';

type Status = 'editing' | 'sending' | 'sent' | 'failed';
type CaptchaState = 'loading' | 'ready' | 'unavailable';

/**
 * FR-21: "Contact" from the footer. A message goes to Martin's contact inbox through
 * Web3Forms (see ../contact.ts); the address itself is never shown or stored in the app.
 * Bot protection: hCaptcha + a hidden honeypot field.
 */
export function ContactDialog({ onClose }: { onClose: () => void }) {
  const configured = isContactFormConfigured();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<{ email?: string; message?: string; captcha?: string }>({});
  const [status, setStatus] = useState<Status>('editing');

  // ---- hCaptcha widget ----
  const captchaBox = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captcha, setCaptcha] = useState<CaptchaState>('loading');

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    loadHCaptcha()
      .then((api) => {
        if (cancelled || !captchaBox.current) return;
        widgetId.current = api.render(captchaBox.current, {
          sitekey: HCAPTCHA_SITE_KEY,
          callback: (token: string) => {
            setCaptchaToken(token);
            setErrors((e) => ({ ...e, captcha: undefined }));
          },
          'expired-callback': () => setCaptchaToken(''),
          'error-callback': () => setCaptchaToken(''),
        });
        setCaptcha('ready');
      })
      .catch(() => {
        if (!cancelled) setCaptcha('unavailable');
      });
    return () => {
      cancelled = true;
      if (widgetId.current !== null) {
        try {
          window.hcaptcha?.remove(widgetId.current);
        } catch {
          // widget already gone
        }
        widgetId.current = null;
      }
    };
  }, [configured]);

  // Escape closes, like the other dialogs.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = 'Enter your e-mail so I can reply, e.g. jane@example.com.';
    if (!message.trim()) next.message = 'Write a message.';
    if (!captchaToken) next.captcha = 'Confirm you are human (the check above).';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Honeypot filled → a bot. Pretend it worked and send nothing.
    if (honeypot) {
      setStatus('sent');
      return;
    }

    setStatus('sending');
    try {
      await sendContactMessage({ name, email, message, captchaToken });
      setStatus('sent');
    } catch {
      setStatus('failed');
      // A captcha answer can be used only once — ask for a new one before retrying.
      setCaptchaToken('');
      if (widgetId.current !== null) window.hcaptcha?.reset(widgetId.current);
    }
  }

  if (status === 'sent') {
    return (
      <Dialog title="Message sent" titleIcon={CircleCheck} labelledBy="contact-title" onBackdropClick={onClose}>
        <p className="dialog-message">Thanks for writing! I'll reply to {email.trim() || 'your e-mail'} as soon as I can.</p>
        <DialogActions>
          <button type="button" className="btn btn-primary" onClick={onClose} autoFocus>
            Close
          </button>
        </DialogActions>
      </Dialog>
    );
  }

  const sending = status === 'sending';

  // Clicking outside deliberately does not close the dialog — it would throw away the
  // message (same rule as "Add item to Gear Vault"). Close with Cancel or Escape.
  return (
    <Dialog title="Contact" titleIcon={Mail} labelledBy="contact-title">
      <p className="dialog-message">Questions, ideas or a bug? Send me a message and I'll reply by e-mail.</p>
      {!configured ? (
        <>
          <p className="form-error">The contact form isn't set up yet.</p>
          <DialogActions>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </DialogActions>
        </>
      ) : (
        <form className="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
          <label className="field">
            <span>Name (optional)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane" autoComplete="name" maxLength={100} autoFocus />
          </label>
          <label className={`field ${errors.email ? 'is-error' : ''}`}>
            <span>Your e-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jane@example.com"
              autoComplete="email"
              maxLength={200}
              aria-invalid={errors.email ? true : undefined}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label className={`field ${errors.message ? 'is-error' : ''}`}>
            <span>Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. It would be great if…"
              rows={6}
              maxLength={MESSAGE_MAX_LENGTH}
              aria-invalid={errors.message ? true : undefined}
            />
            {errors.message && <span className="field-error">{errors.message}</span>}
          </label>
          {/* Honeypot: invisible to people (and skipped by keyboard and screen readers),
              but simple bots fill in every field they find. */}
          <div className="contact-honeypot" aria-hidden="true">
            <label>
              Leave this empty
              <input type="text" name="botcheck" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </label>
          </div>
          <div className="contact-captcha">
            <div ref={captchaBox} />
            {captcha === 'loading' && <p className="dialog-hint">Loading the "I am human" check…</p>}
            {captcha === 'unavailable' && (
              <p className="form-error">The "I am human" check couldn't load. Check your connection or ad blocker and open the form again.</p>
            )}
            {errors.captcha && <p className="form-error">{errors.captcha}</p>}
          </div>
          {status === 'failed' && <p className="form-error">The message couldn't be sent. Check your connection, confirm the check again and retry.</p>}
          <DialogActions>
            <button type="button" className="btn btn-ghost dialog-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={sending || captcha === 'unavailable'}>
              <Icon icon={Send} />
              {sending ? 'Sending…' : 'Send message'}
            </button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
}
