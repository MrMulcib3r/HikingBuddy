import { useState, type ReactNode } from 'react';
import { Mail } from 'lucide-react';
import landscapeUrl from '../assets/trail-landscape.svg';
import { LogoMark } from './icons/HikerIcons';
import { ContactDialog } from './ContactDialog';
import { Icon } from './ui';

/**
 * FR-19 AppShell frame shared by the app and the shared gearlist page: the trail landscape
 * anchored to the bottom of the window behind everything (mood only, never under text), the
 * header with the mark + "HikingBuddy", and the footer with "Contact" (FR-21).
 */
export function AppFrame({ actions, children }: { actions: ReactNode; children: ReactNode }) {
  const [contactOpen, setContactOpen] = useState(false);
  return (
    <div className="app-shell">
      <div className="app-backdrop" aria-hidden="true">
        <img src={landscapeUrl} alt="" />
      </div>
      <header className="app-header">
        <h1 className="brand">
          <LogoMark />
          HikingBuddy
        </h1>
        <div className="app-header-actions">{actions}</div>
      </header>
      {children}
      <footer className="app-footer">
        {/* On a surface pill, so the text never sits directly on the landscape. */}
        <button type="button" className="footer-link" onClick={() => setContactOpen(true)}>
          <Icon icon={Mail} size={16} />
          Contact
        </button>
      </footer>
      {contactOpen && <ContactDialog onClose={() => setContactOpen(false)} />}
    </div>
  );
}
