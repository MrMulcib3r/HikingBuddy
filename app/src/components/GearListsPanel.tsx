import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { GearListDetail } from './GearListDetail';

export function GearListsPanel() {
  const { state, createDraftList } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(state.gearLists[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const selected = state.gearLists.find((l) => l.id === selectedId) ?? null;

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = createDraftList(trimmed);
    setSelectedId(id);
    setNewName('');
    setCreating(false);
  }

  return (
    <section className="panel gear-lists-panel">
      <header className="panel-header">
        <h2>Gearlisty</h2>
        <button type="button" className="btn btn-primary btn-small" onClick={() => setCreating(true)}>
          + Nový gearlist
        </button>
      </header>

      {creating && (
        <div className="new-list-form">
          <input
            autoFocus
            value={newName}
            placeholder="např. Nordkalottleden 2027"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button type="button" className="btn btn-primary btn-small" onClick={handleCreate}>
            Vytvořit
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setCreating(false)}>
            Zrušit
          </button>
        </div>
      )}

      <div className="gear-lists-body">
        <ul className="list-sidebar">
          {state.gearLists.length === 0 && <p className="empty-hint">Zatím žádné gearlisty.</p>}
          {state.gearLists.map((list) => (
            <li
              key={list.id}
              className={`list-sidebar-item ${list.id === selectedId ? 'active' : ''}`}
              onClick={() => setSelectedId(list.id)}
            >
              <span>{list.name}</span>
              <span className={`status-badge status-${list.status}`}>{list.status === 'draft' ? 'Draft' : '🔒'}</span>
            </li>
          ))}
        </ul>
        <div className="list-detail-container">
          {selected ? (
            <GearListDetail
              list={selected}
              onDeleted={() => setSelectedId(null)}
              onDuplicated={(newId) => newId && setSelectedId(newId)}
            />
          ) : (
            <p className="empty-hint">Vyber gearlist vlevo, nebo vytvoř nový.</p>
          )}
        </div>
      </div>
    </section>
  );
}
