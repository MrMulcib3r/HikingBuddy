import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { useGuestStore } from './state/guestStore';
import { DataFileProvider } from './state/DataFileContext';
import { isEmptyState, loadState } from './storage';
import { AuthProvider, useAuth } from './account/AuthContext';
import { AccountContext, useAccount } from './account/AccountContext';
import { useAccountStore } from './account/accountStore';
import type { AccountUser } from './account/api';
import { GearVaultPanel } from './components/GearVaultPanel';
import { GearListsPanel } from './components/GearListsPanel';
import { UnitToggle } from './components/UnitToggle';
import { BackupControls } from './components/BackupControls';
import { DataFileBanner, DataFileControls } from './components/DataFileControls';
import { LoadDemoButton, WelcomeCard } from './components/DemoData';
import { SharedGearlistPage } from './components/SharedGearlistPage';
import { AppFrame } from './components/AppFrame';
import { AccountMenu, SaveStatusChip, SignInButton } from './components/AccountMenu';
import { AccountBanners } from './components/AccountBanners';
import { ImportLocalDialog } from './components/ImportLocalDialog';
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

  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

/** PRD v33, FR-23: guest mode (exactly as before) or the signed-in account. */
function Root() {
  const { status } = useAuth();
  if (status.kind === 'loading') return <AppFrame actions={null}>{null}</AppFrame>;
  if (status.kind === 'signedIn') return <AccountApp key={status.user.id} user={status.user} />;
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

const importOfferedKey = (userId: string) => `hikingbuddy-import-offered-${userId}`;

/** Signed in: the server's copy is the source of truth (FR-24); the data file isn't used. */
function AccountApp({ user }: { user: AccountUser }) {
  const { store, sync } = useAccountStore(user.id);
  const account = useMemo(() => ({ user, sync }), [user, sync]);

  // Signed in again after the session ran out: send what was kept meanwhile.
  const { retry } = sync;
  useEffect(() => {
    retry();
  }, [user, retry]);

  // FR-23: the first sign-in in a browser that has guest data offers to import it, once.
  const [local] = useState(() => loadState());
  const [offered, setOffered] = useState(() => readFlag(importOfferedKey(user.id)));
  const markOffered = useCallback(() => {
    writeFlag(importOfferedKey(user.id));
    setOffered(true);
  }, [user.id]);
  const offerImport = !offered && !sync.loading && !isEmptyState(local);

  return (
    <AccountContext.Provider value={account}>
      <AppProvider store={store}>
        <AppShell />
        {offerImport && (
          <ImportLocalDialog
            local={local}
            account={store.state}
            accountEmpty={sync.accountEmpty}
            onImport={async () => {
              await sync.importState(local, sync.accountEmpty ? 'replace_empty' : 'as_new');
              markOffered();
            }}
            onSkip={markOffered}
          />
        )}
      </AppProvider>
    </AccountContext.Provider>
  );
}

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
function writeFlag(key: string) {
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // storage blocked: the dialog may show again next time, nothing worse
  }
}

function AppShell() {
  const { state } = useApp();
  const account = useAccount();
  // FR-17: a completely empty app shows a welcome card instead of two empty panels.
  // "Start empty" hides it for this visit only — nothing to store.
  const [startedEmpty, setStartedEmpty] = useState(false);
  const loading = account?.sync.loading ?? false;
  const showWelcome = !loading && isEmptyState(state) && !startedEmpty;
  // FR-23: with an account, demo data only goes into an empty account.
  const demoAllowed = !account || account.sync.accountEmpty;

  return (
    <AppFrame
      actions={
        <>
          {account ? <SaveStatusChip /> : <DataFileControls />}
          <div className="header-group">
            {demoAllowed && <LoadDemoButton />}
            <BackupControls />
          </div>
          <UnitToggle />
          {account ? <AccountMenu /> : <SignInButton />}
        </>
      }
    >
      {account ? <AccountBanners /> : <DataFileBanner />}
      {loading ? (
        <main className="welcome">
          <div className="welcome-card" role="status">
            <p>{account?.sync.status.kind === 'offline' ? "You are offline — your account can't be loaded yet." : 'Loading your gear…'}</p>
          </div>
        </main>
      ) : showWelcome ? (
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
