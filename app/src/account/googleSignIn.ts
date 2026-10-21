/**
 * Google Identity Services (the official "Sign in with Google" button, FR-23). The script is
 * loaded only when the Sign in dialog opens — nothing from Google loads before that (same rule
 * as hCaptcha in the contact form, FR-21).
 */
interface GoogleIdApi {
  initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: 'popup'; auto_select?: boolean }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

let loading: Promise<GoogleIdApi> | null = null;

export function loadGoogleIdentity(): Promise<GoogleIdApi> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error('Google sign-in did not load.')));
      script.onerror = () => {
        loading = null;
        reject(new Error('Google sign-in could not be loaded. Check your connection or an ad blocker.'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}
