import { AppProvider } from './state/AppContext';
import { GearVaultPanel } from './components/GearVaultPanel';
import { GearListsPanel } from './components/GearListsPanel';
import { UnitToggle } from './components/UnitToggle';
import { BackupControls } from './components/BackupControls';
import './App.css';

function App() {
  return (
    <AppProvider>
      <div className="app-shell">
        <header className="app-header">
          <h1>HikingBuddy</h1>
          <div className="app-header-actions">
            <BackupControls />
            <UnitToggle />
          </div>
        </header>
        <main className="app-main">
          <GearVaultPanel />
          <GearListsPanel />
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
