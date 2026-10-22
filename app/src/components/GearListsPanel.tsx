import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { sortByOrder } from '../utils/reorder';
import { makeDragHandlers } from '../utils/dnd';
import type { GearList } from '../types';
import { TEMPLATE_NAME } from '../constants';
import { clearAppLink, readAppLink } from '../utils/appLink';
import { GearListDetail } from './GearListDetail';
import { ActionIcon } from './icons/actionIcons';
import { Icon } from './ui';

export function GearListsPanel() {
  const { state, createList, createListFromTemplate } = useApp();
  // FR-27: "Open in HikingBuddy" from the AI chat opens #gearlist=<id>.
  const [selectedId, setSelectedId] = useState<string | null>(() => readAppLink('gearlist'));
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

  useEffect(() => {
    const onHashChange = () => {
      const linked = readAppLink('gearlist');
      if (linked) setSelectedId(linked);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  // The linked gearlist is shown (the account's data may arrive a moment later): drop the hash.
  useEffect(() => {
    if (selected && selected.id === readAppLink('gearlist')) clearAppLink('gearlist');
  }, [selected]);

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = template && fromTemplate ? createListFromTemplate(trimmed, template.id) : createList(trimmed);
    setSelectedId(id);
    setNewName('');
    setCreating(false);
  }

  // Text + icon, not icon only: it is the panel's main action and a lone + was easy to miss
  // (Martin, 2026-10-13 — a deliberate exception to the design system's icon-only + rule).
  const newButton = (
    <button
      type="button"
      className="btn btn-secondary btn-small"
      onClick={() => {
        setFromTemplate(true);
        setCreating(true);
      }}
    >
      <Icon icon={ActionIcon.newGearlist} />
      New gearlist
    </button>
  );

  const newListForm = creating && (
    <div className="new-list-form">
      {template && (
        <div className="segmented" role="radiogroup" aria-label="Start from">
          <button type="button" role="radio" aria-checked={!fromTemplate} onClick={() => setFromTemplate(false)}>
            Blank gearlist
          </button>
          <button type="button" role="radio" aria-checked={fromTemplate} onClick={() => setFromTemplate(true)}>
            From template ({template.items.length})
          </button>
        </div>
      )}
      <div className="field-row">
        <input
          autoFocus
          value={newName}
          placeholder="e.g. Nordkalottleden 2027"
          aria-label="Gearlist name"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
            if (e.key === 'Escape') setCreating(false);
          }}
        />
        <button type="button" className="btn btn-primary" onClick={handleCreate}>
          Create
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <section className="panel gear-lists-panel">
      {/* Panel header like "GEAR VAULT" (design system v2), with New gearlist (+). */}
      <header className="panel-header">
        <h2 className="panel-title">Gearlists</h2>
        <div className="panel-header-actions">{newButton}</div>
      </header>
      {newListForm}
      {selected ? (
        <GearListDetail
          key={selected.id}
          list={selected}
          isTemplate={selected === selectedTemplate}
          onDeleted={() => setSelectedId(null)}
          switcher={<GearlistSwitcher lists={sortedLists} template={template} selected={selected} onSelect={setSelectedId} />}
        />
      ) : (
        <div className="panel-body">
          <p className="empty-hint">No gearlists yet — create your first one with "New gearlist" (+).</p>
        </div>
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
        <span className="gearlist-switcher-name">
          {selected === template ? (
            <>
              <Icon icon={ActionIcon.template} size={28} />
              {TEMPLATE_NAME}
            </>
          ) : (
            selected.name
          )}
        </span>
        <span className="gearlist-switcher-caret" aria-hidden="true">
          <Icon icon={ChevronDown} size={22} />
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
                <Icon icon={ActionIcon.template} size={16} />
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
                <Icon icon={ActionIcon.drag} size={16} />
              </span>
              <span className="gearlist-switcher-item-name">{list.name}</span>
              {list.snapshot && (
                <span className="status-snapshot badge badge-success badge-icon" role="img" aria-label="Snapshot saved" title="Snapshot saved">
                  <Icon icon={ActionIcon.saveSnapshot} size={14} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
