/**
 * Contact form (FR-21) — sending a message to Martin without a server and without his
 * e-mail address appearing anywhere in the app or the repository.
 *
 * How it works, in plain words: the app sends the form to Web3Forms (a free "form to
 * e-mail" service). Web3Forms knows which inbox to deliver to from the access key below;
 * the key itself does not reveal the address and can only ever send to that one inbox, so
 * it is safe to have in the public code (that is how Web3Forms is meant to be used).
 * Bots are stopped by hCaptcha ("I am human" check, verified by Web3Forms) and by a hidden
 * "honeypot" field that people never see but naive bots fill in.
 */

/**
 * Web3Forms access key for the contact inbox. Get it at https://web3forms.com (enter the
 * contact address, the key arrives by e-mail) and paste it here. While it is empty the
 * contact dialog says the form isn't set up and doesn't send anything.
 */
export const CONTACT_FORM_ACCESS_KEY = '4c3f9db0-2e9c-44d7-a1d7-0d8e84c7421a';

/** Web3Forms' shared hCaptcha site key — the one the free plan must use (their docs). */
export const HCAPTCHA_SITE_KEY = '50b2fe65-b00b-4b9e-ad62-3ba471098be2';

const ENDPOINT = 'https://api.web3forms.com/submit';

/** Subject starts with the project name, so one shared inbox for several projects can sort
 * messages with a simple mail filter. */
const SUBJECT = 'HikingBuddy: new message from the contact form';

export const MESSAGE_MAX_LENGTH = 5000;

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
  captchaToken: string;
}

export function isContactFormConfigured(): boolean {
  return CONTACT_FORM_ACCESS_KEY.trim() !== '';
}

/** Deliberately simple: something@something.something, no spaces. The real check is
 * whether Martin's reply arrives. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Sends the message. Resolves when Web3Forms accepted it; throws with a short reason
 * otherwise (no connection, captcha rejected, service error). */
export async function sendContactMessage(msg: ContactMessage): Promise<void> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: CONTACT_FORM_ACCESS_KEY,
        subject: SUBJECT,
        from_name: 'HikingBuddy contact form',
        name: msg.name.trim() || '(not given)',
        email: msg.email.trim(),
        message: msg.message.trim(),
        page: window.location.origin + window.location.pathname,
        'h-captcha-response': msg.captchaToken,
      }),
    });
  } catch {
    throw new Error('network');
  }
  let ok = response.ok;
  try {
    const data = (await response.json()) as { success?: boolean };
    ok = ok && data.success !== false;
  } catch {
    // Non-JSON answer — rely on the HTTP status.
  }
  if (!ok) throw new Error('rejected');
}

// ---------- hCaptcha loader ----------
// Loaded only when the contact dialog opens, so the rest of the app never talks to a third
// party. Written by hand instead of adding an npm package: it is ~30 lines and keeps the
// app's dependency list short.

interface HCaptchaApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    hcaptcha?: HCaptchaApi;
    __hbHcaptchaOnLoad?: () => void;
  }
}

let loading: Promise<HCaptchaApi> | null = null;

export function loadHCaptcha(): Promise<HCaptchaApi> {
  if (window.hcaptcha) return Promise.resolve(window.hcaptcha);
  if (loading) return loading;
  loading = new Promise<HCaptchaApi>((resolve, reject) => {
    window.__hbHcaptchaOnLoad = () => {
      if (window.hcaptcha) resolve(window.hcaptcha);
      else reject(new Error('hcaptcha missing'));
    };
    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off&onload=__hbHcaptchaOnLoad';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loading = null; // allow a retry next time the dialog opens
      script.remove();
      reject(new Error('hcaptcha failed to load'));
    };
    document.head.appendChild(script);
  });
  return loading;
}
