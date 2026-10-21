import type { RichPart } from '../core/history';
import type { UndoConflict } from '../account/accountStore';
import type { UnitPreference } from '../types';
import { formatWeight } from '../utils/weight';
import { formatClock, formatDayShort } from '../utils/text';

/** Activity descriptions (FR-25): names in bold, deleted names struck through, weights in the
 * user's units, times and dates in the user's time zone. */
export function RichText({ parts, unit }: { parts: RichPart[]; unit: UnitPreference }) {
  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === 'string') return <span key={i}>{part}</span>;
        if ('b' in part) return <b key={i}>{part.b}</b>;
        if ('del' in part) return <span key={i} className="act-del">{part.del}</span>;
        if ('w' in part) return <span key={i}>{formatWeight(part.w, unit)}</span>;
        if ('time' in part) return <span key={i}>{formatClock(part.time)}</span>;
        return <span key={i}>{formatDayShort(part.date)}</span>;
      })}
    </>
  );
}

/** One later change in an Undo conflict: what, who, when. */
export function ConflictLine({ conflict, unit }: { conflict: UndoConflict; unit: UnitPreference }) {
  const who = conflict.actor === 'ai' ? (conflict.client ?? 'AI') : 'you';
  return (
    <>
      <RichText parts={conflict.text} unit={unit} />
      {conflict.at && (
        <span className="act-conflict-who">
          {' '}
          ({who}, {formatClock(conflict.at)})
        </span>
      )}
    </>
  );
}
