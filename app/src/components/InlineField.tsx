import { useEffect, useRef, useState } from 'react';

interface InlineTextFieldProps {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowEmpty?: boolean;
}

/** Click-to-edit text field (Excel/lighterpack style) — click the text, it becomes an
 * input, Enter or blur commits, Escape cancels. No separate "Edit" button/mode. */
export function InlineTextField({ value, onCommit, placeholder, className, allowEmpty }: InlineTextFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if ((trimmed || allowEmpty) && trimmed !== value) {
      onCommit(trimmed);
    } else {
      setDraft(value);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`inline-edit-input ${className ?? ''}`}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <span
      className={`inline-edit-text ${className ?? ''}`}
      onClick={(e) => {
        e.stopPropagation();
        setDraft(value);
        setEditing(true);
      }}
      title="Click to edit"
    >
      {value || <em className="inline-edit-placeholder">{placeholder ?? '—'}</em>}
    </span>
  );
}

interface InlineNumberFieldProps {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  step?: number | 'any';
  format: (value: number) => string;
  className?: string;
  integer?: boolean;
}

export function InlineNumberField({ value, onCommit, min = 0, step = 'any', format, className, integer }: InlineNumberFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    const parsed = Number(draft);
    const valid = Number.isFinite(parsed) && parsed >= min && (!integer || Number.isInteger(parsed));
    if (valid && parsed !== value) {
      onCommit(parsed);
    } else {
      setDraft(String(value));
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        className={`inline-edit-input inline-edit-number ${className ?? ''}`}
        value={draft}
        min={min}
        step={step}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(String(value));
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <span
      className={`inline-edit-text ${className ?? ''}`}
      onClick={(e) => {
        e.stopPropagation();
        setDraft(String(value));
        setEditing(true);
      }}
      title="Click to edit"
    >
      {format(value)}
    </span>
  );
}
