import { useState } from 'react';
import { useApp } from '../state/AppContext';

/** FR-2: categories are fully editable from the start — rename, delete, add your own. */
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
        <h3>Categories</h3>
        <p className="dialog-hint">The predefined list is just a starting point — make it your own.</p>
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
                Delete
              </button>
            </li>
          ))}
        </ul>
        <div className="field-row">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button type="button" className="btn btn-primary btn-small" onClick={handleAdd}>
            Add
          </button>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
