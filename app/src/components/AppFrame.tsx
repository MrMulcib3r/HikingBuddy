import type { ReactNode } from 'react';
import landscapeUrl from '../assets/trail-landscape.svg';
import { LogoMark } from './icons/HikerIcons';

/**
 * FR-19 AppShell frame shared by the app and the shared gearlist page: the trail landscape
 * anchored to the bottom of the window behind everything (mood only, never under text) and
 * the header with the mark + "HikingBuddy".
 */
export function AppFrame({ actions, children }: { actions: ReactNode; children: ReactNode }) {
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
    </div>
  );
}
