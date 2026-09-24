import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { sortByOrder } from '../utils/reorder';
import { makeDragHandlers } from '../utils/dnd';
import type { GearList } from '../types';
import { GearListDetail } from './GearListDetail';

export function GearListsPanel() {
  const { state, createList } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const sortedLists = useMemo(() => sortByOrder(state.gearLists), [state.gearLists]);
  // Bez postranního seznamu musí být vždy něco vybrané — když vybraný gearlist neexistuje
  // (start appky, smazání), ukáže se první v pořadí.
  const selected = sortedLists.find((l) => l.id === selectedId) ?? sortedLists[0] ?? null;

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
        {selected ? (
          <GearlistSwitcher lists={sortedLists} selected={selected} onSelect={setSelectedId} />
        ) : (
          <h2>Gearlists</h2>
        )}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setCreating(false);
            }}
          />
          <button type="button" className="btn btn-primary btn-small" onClick={handleCreate}>
            Create
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setCreating(false)}>
            Cancel
          </button>
        </div>
      )}

      {selected ? (
        <GearListDetail key={selected.id} list={selected} onDeleted={() => setSelectedId(null)} />
      ) : (
        <p className="empty-hint">No gearlists yet — create your first one with "+ New gearlist".</p>
      )}
    </section>
  );
}

interface GearlistSwitcherProps {
  lists: GearList[];
  selected: GearList;
  onSelect: (id: string) => void;
}

/** The open gearlist's name doubles as a dropdown for switching to another gearlist —
 * replaces the old sidebar column so the list itself gets the full panel width. Gearlists
 * can still be reordered by dragging inside the dropdown (FR-13). */
function GearlistSwitcher({ lists, selected, onSelect }: GearlistSwitcherProps) {
  const { reorderLists } = useApp();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="gearlist-switcher" ref={rootRef}>
      <button
        type="button"
        className="gearlist-switcher-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Switch gearlist"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="gearlist-switcher-name">{selected.name}</span>
        <span className="gearlist-switcher-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <ul className="gearlist-switcher-menu" role="listbox" aria-label="Gearlists">
          {lists.map((list) => (
            <li
              key={list.id}
              role="option"
              aria-selected={list.id === selected.id}
              className={`gearlist-switcher-item ${list.id === selected.id ? 'active' : ''}`}
              onClick={() => {
                onSelect(list.id);
                setOpen(false);
              }}
              {...makeDragHandlers(list.id, reorderLists)}
            >
              <span className="drag-handle" title="Drag to reorder">
                ⠿
              </span>
              <span className="gearlist-switcher-item-name">{list.name}</span>
              {list.snapshot && (
                <span className="status-snapshot" title="Snapshot saved">
                  📷
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
