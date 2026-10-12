import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { sortByOrder } from '../utils/reorder';
import { makeDragHandlers } from '../utils/dnd';
import type { GearList } from '../types';
import { TEMPLATE_NAME } from '../constants';
import { GearListDetail } from './GearListDetail';

export function GearListsPanel() {
  const { state, createList, createListFromTemplate } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const template = state.templates[0] ?? null;
  // T-4: with a template, a new gearlist can start blank or pre-filled from it.
  const [fromTemplate, setFromTemplate] = useState(true);

  const sortedLists = useMemo(() => sortByOrder(state.gearLists), [state.gearLists]);
  // Bez postranního seznamu musí být vždy něco vybrané — když vybraný gearlist neexistuje
  // (start appky, smazání), ukáže se první v pořadí.
  const selectedTemplate = template && template.id === selectedId ? template : null;
  const selected = selectedTemplate ?? sortedLists.find((l) => l.id === selectedId) ?? sortedLists[0] ?? null;

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = template && fromTemplate ? createListFromTemplate(trimmed, template.id) : createList(trimmed);
    setSelectedId(id);
    setNewName('');
    setCreating(false);
  }

  return (
    <section className="panel gear-lists-panel">
      <header className="panel-header">
        {selected ? (
          <GearlistSwitcher lists={sortedLists} template={template} selected={selected} onSelect={setSelectedId} />
        ) : (
          <h2>Gearlists</h2>
        )}
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={() => {
            setFromTemplate(true);
            setCreating(true);
          }}
        >
          + New gearlist
        </button>
      </header>

      {creating && (
        <div className="new-list-form">
          {template && (
            <div className="segmented" role="radiogroup" aria-label="Start from">
              <button type="button" role="radio" aria-checked={!fromTemplate} className={!fromTemplate ? 'active' : ''} onClick={() => setFromTemplate(false)}>
                Blank gearlist
              </button>
              <button type="button" role="radio" aria-checked={fromTemplate} className={fromTemplate ? 'active' : ''} onClick={() => setFromTemplate(true)}>
                From template ({template.items.length})
              </button>
            </div>
          )}
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
        <GearListDetail key={selected.id} list={selected} isTemplate={selected === selectedTemplate} onDeleted={() => setSelectedId(null)} />
      ) : (
        <p className="empty-hint">No gearlists yet — create your first one with "+ New gearlist".</p>
      )}
    </section>
  );
}

interface GearlistSwitcherProps {
  lists: GearList[];
  template: GearList | null;
  selected: GearList;
  onSelect: (id: string) => void;
}

/** The open gearlist's name doubles as a dropdown for switching to another gearlist —
 * replaces the old sidebar column so the list itself gets the full panel width. Gearlists
 * can still be reordered by dragging inside the dropdown (FR-13). */
function GearlistSwitcher({ lists, template, selected, onSelect }: GearlistSwitcherProps) {
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
        <span className="gearlist-switcher-name">{selected === template ? `📋 ${TEMPLATE_NAME}` : selected.name}</span>
        <span className="gearlist-switcher-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <ul className="gearlist-switcher-menu" role="listbox" aria-label="Gearlists">
          {/* T-3: the template is pinned on top and isn't draggable among the gearlists. */}
          {template && (
            <li
              role="option"
              aria-selected={template.id === selected.id}
              className={`gearlist-switcher-item gearlist-switcher-template ${template.id === selected.id ? 'active' : ''}`}
              onClick={() => {
                onSelect(template.id);
                setOpen(false);
              }}
            >
              <span className="drag-handle" aria-hidden="true">
                📋
              </span>
              <span className="gearlist-switcher-item-name">{TEMPLATE_NAME}</span>
            </li>
          )}
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
              {...makeDragHandlers(list.id, reorderLists, 'gearlist')}
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
