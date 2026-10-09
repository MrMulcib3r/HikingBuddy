import { useState } from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { DataFileProvider } from './state/DataFileContext';
import { isEmptyState } from './storage';
import { GearVaultPanel } from './components/GearVaultPanel';
import { GearListsPanel } from './components/GearListsPanel';
import { UnitToggle } from './components/UnitToggle';
import { BackupControls } from './components/BackupControls';
import { DataFileBanner, DataFileControls } from './components/DataFileControls';
import { LoadDemoButton, WelcomeCard } from './components/DemoData';
import './App.css';

function App() {
  return (
    <AppProvider>
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
    <div className="app-shell">
      <header className="app-header">
        <h1>HikingBuddy</h1>
        <div className="app-header-actions">
          <DataFileControls />
          <div className="backup-controls">
            <LoadDemoButton />
            <BackupControls />
          </div>
          <UnitToggle />
        </div>
      </header>
      <DataFileBanner />
      {showWelcome ? (
        <WelcomeCard onStartEmpty={() => setStartedEmpty(true)} />
      ) : (
        <main className="app-main">
          <GearVaultPanel />
          <GearListsPanel />
        </main>
      )}
    </div>
  );
}

export default App;
