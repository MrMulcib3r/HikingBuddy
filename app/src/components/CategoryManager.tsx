import { useState } from 'react';
import { useApp } from '../state/AppContext';

/** FR-2: kategorie jsou od začátku plně editovatelné — přejmenovat, smazat, přidat vlastní. */
export function CategoryManager({ onClose }: { onClose: () => void }) {
  const { state, addCategory, renameCategory, deleteCategory } = useApp();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addCategory(trimmed);
    setNewName('');
  }

  function startEdit(id: string, current: string) {
    setEditingId(id);
    setEditingName(current);
  }

  function commitEdit() {
    if (editingId && editingName.trim()) {
      renameCategory(editingId, editingName.trim());
    }
    setEditingId(null);
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>Kategorie</h3>
        <p className="dialog-hint">Předdefinovaný seznam je jen startovní bod — uprav si ho podle sebe.</p>
        <ul className="category-list">
          {state.categories.map((c) => (
            <li key={c.id} className="category-row">
              {editingId === c.id ? (
                <input
                  value={editingName}
                  autoFocus
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                />
              ) : (
                <span onClick={() => startEdit(c.id, c.name)} className="category-name">
                  {c.name}
                </span>
              )}
              <button type="button" className="btn btn-ghost btn-small" onClick={() => deleteCategory(c.id)}>
                Smazat
              </button>
            </li>
          ))}
        </ul>
        <div className="field-row">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nová kategorie"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button type="button" className="btn btn-primary btn-small" onClick={handleAdd}>
            Přidat
          </button>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}
