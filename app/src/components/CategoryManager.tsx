import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { InlineTextField } from './InlineField';
import { ConfirmDialog } from './ConfirmDialog';
import { isTemplateCategory } from '../constants';
import type { Category } from '../types';

/** FR-2: categories are fully editable from the start — rename, delete, add your own. */
export function CategoryManager({ onClose }: { onClose: () => void }) {
  const { state, addCategory, renameCategory, deleteCategory } = useApp();
  const [newName, setNewName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const usedBy = (id: string) => state.gearItems.filter((g) => g.categoryId === id).length;

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addCategory(trimmed);
    setNewName('');
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>Categories</h3>
        <p className="dialog-hint">The predefined list is just a starting point — make it your own. Click a name to rename it. Categories you created yourself can also be deleted.</p>
        <ul className="category-list">
          {state.categories.map((c) => (
            <li key={c.id} className="category-row">
              <InlineTextField className="category-name" value={c.name} onCommit={(name) => renameCategory(c.id, name)} />
              {/* Default categories can't be deleted (PRD v15) — only your own. */}
              {!isTemplateCategory(c.id) && (
                <button type="button" className="btn btn-ghost btn-small" onClick={() => setPendingDelete(c)}>
                  Delete
                </button>
              )}
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
      {pendingDelete && (
        <div onClick={(e) => e.stopPropagation()}>
          <ConfirmDialog
            title="Delete category"
            danger
            message={
              usedBy(pendingDelete.id) > 0
                ? `Delete "${pendingDelete.name}"? ${usedBy(pendingDelete.id)} item(s) in Gear Vault use it and will become Uncategorized (the items themselves stay).`
                : `Delete "${pendingDelete.name}"? No items use it.`
            }
            confirmLabel="Delete"
            onConfirm={() => {
              deleteCategory(pendingDelete.id);
              setPendingDelete(null);
            }}
            onCancel={() => setPendingDelete(null)}
          />
        </div>
      )}
    </div>
  );
}
