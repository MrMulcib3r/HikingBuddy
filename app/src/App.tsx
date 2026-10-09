import { AppProvider } from './state/AppContext';
import { DataFileProvider } from './state/DataFileContext';
import { GearVaultPanel } from './components/GearVaultPanel';
import { GearListsPanel } from './components/GearListsPanel';
import { UnitToggle } from './components/UnitToggle';
import { BackupControls } from './components/BackupControls';
import { DataFileBanner, DataFileControls } from './components/DataFileControls';
import './App.css';

function App() {
  return (
    <AppProvider>
      <DataFileProvider>
        <div className="app-shell">
          <header className="app-header">
            <h1>HikingBuddy</h1>
            <div className="app-header-actions">
              <DataFileControls />
              <BackupControls />
              <UnitToggle />
            </div>
          </header>
          <DataFileBanner />
          <main className="app-main">
            <GearVaultPanel />
            <GearListsPanel />
          </main>
        </div>
      </DataFileProvider>
    </AppProvider>
  );
}

export default App;
