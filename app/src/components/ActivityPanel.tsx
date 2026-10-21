import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { Bot, Camera, Check, ChevronDown, History, Map as MapIcon, Minus, Pencil, Plus, Trash2, TriangleAlert, Undo2, User, X } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { api, ApiError } from '../account/api';
import type { UndoConflict, UndoMode, UndoTargetRequest } from '../account/accountStore';
import { HISTORY_DAYS, type ChangeIcon, type RichPart } from '../core/history';
import { useApp } from '../state/AppContext';
import { formatClock, formatDayMonth, formatDayShort, plural } from '../utils/text';
import { ConflictLine, RichText } from './RichText';
import { UndoDialog } from './UndoDialog';
import { Badge, Icon, IconButton } from './ui';

/**
 * Design system ActivityPanel (PRD v33, FR-25): the change history of the last 30 days with
 * Undo, as a side sheet from the right. Three levels: day (with "Undo all AI changes from this
 * day"), entry (one AI step or one of your own edits = one Undo), single change (inside an
 * expanded AI step). Undo is done on the server; this only shows and asks.
 */
interface ChangeView {
  text: RichPart[];
  icon: ChangeIcon;
  deleted: boolean;
  undoneAt: string | null;
}
interface EntryView {
  id: string;
  at: string;
  actor: 'you' | 'ai';
  client: string | null;
  kind: 'change' | 'import' | 'undo' | 'redo';
  text: RichPart[];
  undoable: boolean;
  undoneAt: string | null;
  changes: ChangeView[];
}

const PAGE = 100;
const CHANGES_SHOWN = 10;

type IconComponent = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' }>;
const CHANGE_ICONS: Record<ChangeIcon, IconComponent> = {
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  remove: Minus,
  snapshot: Camera,
  template: MapIcon,
  undo: Undo2,
};

interface ConflictState {
  key: string;
  target: UndoTargetRequest;
  conflicts: UndoConflict[];
  /** "Undo the rest, keep my change": only for AI steps with several changes and for days. */
  canKeep: boolean;
}
interface DialogState {
  title: string;
  madeBy: string;
  target: UndoTargetRequest;
  count: number;
  conflicting: number;
  byClient: { client: string; count: number }[];
  conflicts: UndoConflict[];
}

export function ActivityPanel({ onClose }: { onClose: () => void }) {
  const account = useAccount();
  const { state } = useApp();
  const unit = state.unitPreference;
  const [entries, setEntries] = useState<EntryView[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAllChanges, setShowAllChanges] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const dataVersion = account?.sync.dataVersion;
  const undo = account?.sync.undo;

  const reload = useCallback(async () => {
    try {
      const res = await api<{ entries: EntryView[] }>('/api/activity');
      setEntries(res.entries);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError && err.kind === 'offline' ? 'You are offline. Activity needs a connection.' : 'Activity could not be loaded. Try again in a moment.');
    }
  }, []);

  // On open, and whenever a change is saved (here or on another device after a refetch).
  useEffect(() => {
    const t = setTimeout(() => void reload(), 0);
    return () => clearTimeout(t);
  }, [reload, dataVersion]);

  useEffect(() => {
    sheetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !dialog) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, dialog]);

  const days = useMemo(() => groupByDay((entries ?? []).slice(0, limit)), [entries, limit]);

  if (!account || !undo) return null;

  async function run(key: string, target: UndoTargetRequest, mode: UndoMode, opts: { canKeep: boolean; dialogFor?: Omit<DialogState, 'target' | 'count' | 'conflicting' | 'byClient' | 'conflicts'> }) {
    setBusy(key);
    setErrors((e) => ({ ...e, [key]: '' }));
    try {
      const res = await undo!(target, mode);
      if (res.applied) {
        setConflict(null);
        setDialog(null);
        await reload();
      } else if (opts.dialogFor && (mode === 'check' || res.conflicts.length > 3)) {
        setConflict(null);
        setDialog({ ...opts.dialogFor, target, count: res.count, conflicting: res.conflicting, byClient: res.byClient, conflicts: res.conflicts });
      } else {
        setConflict({ key, target, conflicts: res.conflicts, canKeep: opts.canKeep });
      }
    } catch (err) {
      const message =
        err instanceof ApiError && err.kind === 'offline' ? 'Undo needs a connection. Try again when you are back online.' : err instanceof Error ? err.message : String(err);
      setErrors((e) => ({ ...e, [key]: message }));
      await reload();
    } finally {
      setBusy(null);
    }
  }

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  function conflictBox(key: string) {
    if (!conflict || conflict.key !== key) return null;
    const n = conflict.conflicts.length;
    return (
      <div className="act-conflict" role="alert">
        <div className="act-conflict-head">
          <Icon icon={TriangleAlert} size={18} />
          <b>Undo would overwrite {plural(n, 'later change')}:</b>
        </div>
        <ul>
          {conflict.conflicts.map((c, i) => (
            <li key={i}>
              <ConflictLine conflict={c} unit={unit} />
            </li>
          ))}
        </ul>
        <div className="act-conflict-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setConflict(null)} disabled={busy !== null}>
            Cancel
          </button>
          {conflict.canKeep && (
            <button type="button" className="btn btn-secondary btn-small" onClick={() => void run(key, conflict.target, 'keep_later', { canKeep: true })} disabled={busy !== null}>
              Undo the rest, keep my change
            </button>
          )}
          <button type="button" className="btn btn-primary btn-small" onClick={() => void run(key, conflict.target, 'all', { canKeep: conflict.canKeep })} disabled={busy !== null}>
            Undo anyway
          </button>
        </div>
      </div>
    );
  }

  function entryRow(entry: EntryView) {
    const ai = entry.actor === 'ai';
    const many = entry.changes.length > 1;
    const undone = entry.undoneAt !== null;
    const deleted = entry.changes.some((c) => c.deleted && !c.undoneAt);
    const isOpen = expanded.has(entry.id);
    const shownChanges = showAllChanges.has(entry.id) ? entry.changes : entry.changes.slice(0, CHANGES_SHOWN);
    const EntryIcon = ai ? Bot : CHANGE_ICONS[entry.changes[0]?.icon ?? 'edit'];
    const whose = ai ? `${entry.client ?? 'AI'}'s` : 'your';
    return (
      <div key={entry.id} className={`act-entry${ai ? ' act-entry-ai' : ''}${undone ? ' is-undone' : ''}`} data-entry={entry.id}>
        <span className="act-ico">
          <Icon icon={EntryIcon} size={16} />
        </span>
        <div className="act-main">
          <div className="act-title">
            {ai ? (
              <Badge tone="ai" icon={Bot}>
                {entry.client ?? 'AI'}
              </Badge>
            ) : (
              <Badge tone="you" icon={User}>
                You
              </Badge>
            )}
            <span className="act-time">
              {formatClock(entry.at)}
              {ai && many ? ` · ${plural(entry.changes.length, 'change')}` : ''}
            </span>
            {undone && (
              <Badge tone="undone" icon={Check}>
                Undone {undoneLabel(entry.at, entry.undoneAt!)}
              </Badge>
            )}
          </div>
          <p className="act-desc">
            <RichText parts={entry.text} unit={unit} />
          </p>
          {deleted && (
            <div>
              <Badge tone="deleted" icon={Trash2}>
                Restorable until {formatDayMonth(new Date(new Date(entry.at).getTime() + HISTORY_DAYS * 86_400_000))}
              </Badge>
            </div>
          )}
        </div>
        {(entry.undoable && !undone) || (ai && many) ? (
          <div className="act-actions">
            {entry.undoable && !undone && (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                disabled={busy !== null}
                onClick={() =>
                  void run(entry.id, { entryId: entry.id }, 'auto', {
                    canKeep: ai && many,
                    dialogFor: ai && many ? { title: `Undo ${whose} changes from ${formatClock(entry.at)}?`, madeBy: `made by ${entry.client ?? 'AI'} at ${formatClock(entry.at)}` } : undefined,
                  })
                }
              >
                <Icon icon={Undo2} />
                Undo
              </button>
            )}
            {ai && many && (
              <button type="button" className="btn btn-ghost btn-small act-toggle" aria-expanded={isOpen} onClick={() => setExpanded((s) => toggle(s, entry.id))}>
                {plural(entry.changes.length, 'change')}
                <Icon icon={ChevronDown} size={16} />
              </button>
            )}
          </div>
        ) : null}
        {errors[entry.id] && (
          <p className="act-error" role="alert">
            {errors[entry.id]}
          </p>
        )}
        {conflictBox(entry.id)}
        {ai && many && isOpen && (
          <>
            <ul className="act-changes">
              {shownChanges.map((change, index) => {
                const key = `${entry.id}#${index}`;
                const ChangeIco = CHANGE_ICONS[change.icon];
                return (
                  <li key={key} className={`act-change${change.undoneAt ? ' is-undone' : ''}`}>
                    <span className="act-time">{formatClock(entry.at)}</span>
                    <Icon icon={ChangeIco} size={16} />
                    <span>
                      <RichText parts={change.text} unit={unit} />
                    </span>
                    {change.undoneAt ? (
                      <Badge tone="undone" icon={Check}>
                        Undone
                      </Badge>
                    ) : (
                      entry.undoable && (
                        <button type="button" className="btn btn-ghost btn-small" disabled={busy !== null} onClick={() => void run(key, { entryId: entry.id, change: index }, 'auto', { canKeep: false })}>
                          Undo
                        </button>
                      )
                    )}
                    {errors[key] && (
                      <p className="act-error act-change-full" role="alert">
                        {errors[key]}
                      </p>
                    )}
                    {conflict?.key === key && <div className="act-change-full">{conflictBox(key)}</div>}
                  </li>
                );
              })}
            </ul>
            {entry.changes.length > CHANGES_SHOWN && !showAllChanges.has(entry.id) && (
              <button type="button" className="btn btn-ghost btn-small act-more" onClick={() => setShowAllChanges((s) => toggle(s, entry.id))}>
                Show {entry.changes.length - CHANGES_SHOWN} more
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return createPortal(
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <aside ref={sheetRef} tabIndex={-1} className="sheet" role="dialog" aria-modal="true" aria-labelledby="activity-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 className="panel-title sheet-title" id="activity-title">
            <Icon icon={History} />
            Activity
          </h2>
          <IconButton label="Close" icon={X} onClick={onClose} tipBelow tipEnd />
        </div>
        <div className="sheet-body">
          <p className="sheet-intro">Last 30 days. Undo puts things back the way they were before the change.</p>
          {loadError && (
            <p className="act-error act-load-error" role="alert">
              {loadError}
            </p>
          )}
          {entries === null && !loadError && <p className="sheet-intro">Loading…</p>}
          {entries !== null && entries.length === 0 && <p className="act-empty">No changes in the last 30 days.</p>}
          {days.map((day) => {
            const dayKey = `day:${day.key}`;
            return (
              <section key={day.key} aria-label={day.label}>
                <div className="act-day">
                  <span className="label">{day.label}</span>
                  {day.hasAiChanges && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      disabled={busy !== null}
                      onClick={() =>
                        void run(dayKey, { day: day.range }, 'check', {
                          canKeep: true,
                          dialogFor: {
                            title: `Undo AI changes from ${day.isToday ? 'today' : formatDayShort(day.range.from)}?`,
                            madeBy: `made by AI ${day.isToday ? 'today' : `on ${formatDayShort(day.range.from)}`}`,
                          },
                        })
                      }
                    >
                      <Icon icon={Undo2} />
                      Undo all AI changes from this day
                    </button>
                  )}
                </div>
                {errors[dayKey] && (
                  <p className="act-error act-day-error" role="alert">
                    {errors[dayKey]}
                  </p>
                )}
                {day.entries.map(entryRow)}
              </section>
            );
          })}
          {entries !== null && entries.length > limit && (
            <button type="button" className="btn btn-ghost btn-small act-older" onClick={() => setLimit((l) => l + PAGE)}>
              Show older
            </button>
          )}
        </div>
      </aside>
      {dialog && (
        <div onClick={(e) => e.stopPropagation()}>
          <UndoDialog
            title={dialog.title}
            madeBy={dialog.madeBy}
            count={dialog.count}
            conflicting={dialog.conflicting}
            byClient={dialog.byClient}
            conflicts={dialog.conflicts}
            unit={unit}
            busy={busy !== null}
            error={errors.dialog || null}
            onCancel={() => setDialog(null)}
            onConfirm={(mode) => void run('dialog', dialog.target, mode, { canKeep: true })}
          />
        </div>
      )}
    </div>,
    document.body
  );
}

function undoneLabel(entryAt: string, undoneAt: string): string {
  const same = new Date(entryAt).toDateString() === new Date(undoneAt).toDateString();
  return same ? formatClock(undoneAt) : `${formatDayMonth(new Date(undoneAt))} ${formatClock(undoneAt)}`;
}

interface DayGroup {
  key: string;
  label: string;
  isToday: boolean;
  range: { from: string; to: string };
  hasAiChanges: boolean;
  entries: EntryView[];
}

/** Newest day first; "Today · Tue 21 Oct", "Yesterday · Mon 20 Oct", "Thu 16 Oct". */
function groupByDay(entries: EntryView[]): DayGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const groups: DayGroup[] = [];
  for (const entry of entries) {
    const start = new Date(entry.at);
    start.setHours(0, 0, 0, 0);
    const key = start.toISOString();
    let group = groups.find((g) => g.key === key);
    if (!group) {
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      const isToday = start.getTime() === today.getTime();
      const prefix = isToday ? 'Today · ' : start.getTime() === yesterday.getTime() ? 'Yesterday · ' : '';
      group = { key, label: `${prefix}${formatDayShort(start)}`, isToday, range: { from: start.toISOString(), to: end.toISOString() }, hasAiChanges: false, entries: [] };
      groups.push(group);
    }
    group.entries.push(entry);
    if (entry.actor === 'ai' && entry.kind === 'change' && entry.undoable && entry.changes.some((c) => !c.undoneAt)) group.hasAiChanges = true;
  }
  return groups;
}
