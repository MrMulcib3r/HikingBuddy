import { useEffect, useMemo, useState } from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { useGuestStore } from './state/guestStore';
import { DataFileProvider } from './state/DataFileContext';
import { isEmptyState } from './storage';
import { GearVaultPanel } from './components/GearVaultPanel';
import { GearListsPanel } from './components/GearListsPanel';
import { UnitToggle } from './components/UnitToggle';
import { BackupControls } from './components/BackupControls';
import { DataFileBanner, DataFileControls } from './components/DataFileControls';
import { LoadDemoButton, WelcomeCard } from './components/DemoData';
import { SharedGearlistPage } from './components/SharedGearlistPage';
import { AppFrame } from './components/AppFrame';
import { isShareHash, parseShareHash } from './share';
import './App.css';

function App() {
  // FR-18: a share link (#share=…) opens the read-only shared gearlist page instead of the
  // app. It deliberately sits outside AppProvider, so the visitor's own data is never
  // loaded, changed or saved by opening a link.
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const shared = useMemo(() => (isShareHash(hash) ? parseShareHash(hash) : undefined), [hash]);
  if (shared !== undefined) return <SharedGearlistPage key={hash} shared={shared} />;

  return <GuestApp />;
}

/** No account: data in this browser and the optional data file, exactly as before v33. */
function GuestApp() {
  const store = useGuestStore();
  return (
    <AppProvider store={store}>
      <DataFileProvider>
        <AppShell />
      </DataFileProvider>
    </AppProvider>
  );
}

function AppShell() {
  const { state } = useApp();
  // FR-17: a completely empty app shows a welcome card instead of two empty panels.
  // "Start empty" hides it for this visit only — nothing to store.
  const [startedEmpty, setStartedEmpty] = useState(false);
  const showWelcome = isEmptyState(state) && !startedEmpty;

  return (
    <AppFrame
      actions={
        <>
          <DataFileControls />
          <div className="header-group">
            <LoadDemoButton />
            <BackupControls />
          </div>
          <UnitToggle />
        </>
      }
    >
      <DataFileBanner />
      {showWelcome ? (
        <WelcomeCard onStartEmpty={() => setStartedEmpty(true)} />
      ) : (
        <main className="app-main">
          <GearVaultPanel />
          <GearListsPanel />
        </main>
      )}
    </AppFrame>
  );
}

export default App;
