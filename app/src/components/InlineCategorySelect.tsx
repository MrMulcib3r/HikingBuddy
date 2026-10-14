import { useState } from 'react';
import type { Category } from '../types';
import { openOnMouseDownWhileEditing } from './InlineField';

interface InlineCategorySelectProps {
  categories: Category[];
  categoryId: string | null;
  categoryName: string;
  onChange: (categoryId: string | null) => void;
  onCreateCategory?: (name: string) => string;
}

const NEW_CATEGORY_VALUE = '__new__';

/** Click-to-edit category picker — click the category name, it becomes a dropdown
 * (with an inline "+ Add new category…" option), pick one and it reverts to text. */
export function InlineCategorySelect({ categories, categoryId, categoryName, onChange, onCreateCategory }: InlineCategorySelectProps) {
  const [mode, setMode] = useState<'text' | 'select' | 'new'>('text');
  const [newName, setNewName] = useState('');

  if (mode === 'new') {
    return (
      <input
        autoFocus
        className="inline-edit-input"
        value={newName}
        placeholder="New category"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const trimmed = newName.trim();
            if (trimmed && onCreateCategory) {
              onChange(onCreateCategory(trimmed));
            }
            setNewName('');
            setMode('text');
          }
          if (e.key === 'Escape') {
            setNewName('');
            setMode('text');
          }
        }}
        onBlur={() => {
          setNewName('');
          setMode('text');
        }}
      />
    );
  }

  if (mode === 'select') {
    return (
      <select
        autoFocus
        className="inline-edit-input"
        value={categoryId ?? ''}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          if (e.target.value === NEW_CATEGORY_VALUE) {
            setMode('new');
            return;
          }
          onChange(e.target.value || null);
          setMode('text');
        }}
        onBlur={() => setMode('text')}
      >
        <option value="">Uncategorized</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
        {onCreateCategory && <option value={NEW_CATEGORY_VALUE}>+ Add new category…</option>}
      </select>
    );
  }

  return (
    <span
      className="inline-edit-text"
      onMouseDown={openOnMouseDownWhileEditing(() => setMode('select'))}
      onClick={(e) => {
        e.stopPropagation();
        setMode('select');
      }}
      title="Click to edit"
    >
      {categoryName}
    </span>
  );
}
