import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { sortByOrder } from '../utils/reorder';
import { makeDragHandlers } from '../utils/dnd';
import { GearListDetail } from './GearListDetail';

export function GearListsPanel() {
  const { state, createList, reorderLists } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(state.gearLists[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const sortedLists = useMemo(() => sortByOrder(state.gearLists), [state.gearLists]);
  const selected = state.gearLists.find((l) => l.id === selectedId) ?? null;

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = createList(trimmed);
    setSelectedId(id);
    setNewName('');
    setCreating(false);
  }

  return (
    <section className="panel gear-lists-panel">
      <header className="panel-header">
        <h2>Gearlists</h2>
        <button type="button" className="btn btn-primary btn-small" onClick={() => setCreating(true)}>
          + New gearlist
        </button>
      </header>

      {creating && (
        <div className="new-list-form">
          <input
            autoFocus
            value={newName}
            placeholder="e.g. Nordkalottleden 2027"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button type="button" className="btn btn-primary btn-small" onClick={handleCreate}>
            Create
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setCreating(false)}>
            Cancel
          </button>
        </div>
      )}

      <div className="gear-lists-body">
        <ul className="list-sidebar">
          {sortedLists.length === 0 && <p className="empty-hint">No gearlists yet.</p>}
          {sortedLists.map((list) => (
            <li
              key={list.id}
              className={`list-sidebar-item ${list.id === selectedId ? 'active' : ''}`}
              onClick={() => setSelectedId(list.id)}
              {...makeDragHandlers(list.id, reorderLists)}
            >
              <span className="drag-handle" title="Drag to reorder">
                ⠿
              </span>
              <span className="list-sidebar-name">{list.name}</span>
              {list.snapshot && (
                <span className="status-badge status-snapshot" title="Snapshot saved">
                  📷
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="list-detail-container">
          {selected ? (
            <GearListDetail list={selected} onDeleted={() => setSelectedId(null)} />
          ) : (
            <p className="empty-hint">Select a gearlist on the left, or create a new one.</p>
          )}
        </div>
      </div>
    </section>
  );
}
