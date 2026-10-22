/**
 * WidgetProposedChanges (PRD v33/v38, FR-27): what the AI wants to change, saved only after the
 * user confirms. Confirm on a row saves it at once (its own AI step in Activity); "Confirm all"
 * saves every undecided row without an FR-5 choice as one step and skips the rows that need a
 * choice; Reject only marks a row (Undo brings it back). The server keeps the decisions, so a
 * chat opened again shows them (worker/mcp/proposals.ts).
 */
import { Archive, Check, CircleCheck, CopyPlus, Info, Minus, Pencil, Plus, Trash2, X, type LucideIcon } from 'lucide-react';
import type { ProposalChangeView, ProposalView } from '../src/core/widgetViews';
import { CarabinerIcon } from '../src/components/icons/HikerIcons';
import { formatWeight } from '../src/utils/weight';
import { Foot, Frame, Head, OpenInApp, OutOfDate, State, type OpenLink } from './views';

export type Decision = 'confirm' | 'create_copy' | 'update_everywhere' | 'keep' | 'delete_everywhere' | 'reject' | 'reopen';

const STROKE = 1.75;

const KINDS: Record<ProposalChangeView['kind'], { label: string; icon: LucideIcon }> = {
  add: { label: 'Add', icon: Plus },
  remove: { label: 'Remove', icon: Minus },
  delete: { label: 'Delete', icon: Trash2 },
  change: { label: 'Change', icon: Pencil },
};

function Btn({ icon: I, label, variant, onClick, disabled }: { icon?: LucideIcon; label: string; variant: 'ghost' | 'secondary' | 'primary'; onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" className={`hb-btn hb-btn--${variant}${variant === 'primary' ? '' : ' hb-btn--sm'}`} onClick={onClick} disabled={disabled}>
      {I && <I size={18} strokeWidth={STROKE} aria-hidden="true" />}
      {label}
    </button>
  );
}

function listNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function Change({ change: c, unit, busy, error, decide }: { change: ProposalChangeView; unit: ProposalView['unit']; busy: boolean; error?: string; decide: (d: Decision) => void }) {
  const kind = KINDS[c.kind];
  const KindIcon = kind.icon;
  return (
    <li className={`hbw-change ${c.status === 'confirmed' ? 'is-confirmed' : c.status === 'rejected' ? 'is-rejected' : ''}`}>
      <div className="hbw-change-main">
        <span className={`hbw-kind hbw-kind--${c.kind}`}>
          <KindIcon strokeWidth={STROKE} aria-hidden="true" />
          {kind.label}
        </span>
        <span className="hbw-change-name">{c.name}</span>
        <span className="hbw-change-w">{formatWeight(c.grams, unit)}</span>
        {(c.detail.length > 0 || c.reason) && (
          <span className="hbw-change-detail">
            {c.detail.map((p, i) => (typeof p === 'string' ? <span key={i}>{p}</span> : <s key={i}>{p.old}</s>))}
            {c.detail.length > 0 && c.reason ? '. ' : ''}
            {c.reason}
          </span>
        )}
      </div>
      {c.status === 'open' && c.choice && (
        <div className="hbw-change-note">
          <CarabinerIcon className="hb-ico" />
          <span>
            Also in {c.choice.lists.length === 1 ? '1 other gearlist' : `${c.choice.lists.length} other gearlists`}: {c.choice.lists.join(', ')}.
          </span>
        </div>
      )}
      {error && (
        <div className="hbw-change-note hbw-change-note--error" role="alert">
          <Info strokeWidth={STROKE} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      <div className="hbw-change-actions">
        {c.status === 'confirmed' && (
          <span className="hbw-decided hbw-decided--yes">
            <Check strokeWidth={STROKE} aria-hidden="true" />
            Confirmed
          </span>
        )}
        {c.status === 'rejected' && (
          <>
            <span className="hbw-decided hbw-decided--no">
              <X strokeWidth={STROKE} aria-hidden="true" />
              Rejected
            </span>
            <Btn label="Undo" variant="ghost" onClick={() => decide('reopen')} disabled={busy} />
          </>
        )}
        {c.status === 'open' && (
          <>
            <Btn icon={X} label="Reject" variant="ghost" onClick={() => decide('reject')} disabled={busy} />
            {!c.choice && <Btn icon={Check} label="Confirm" variant="secondary" onClick={() => decide('confirm')} disabled={busy} />}
            {c.choice?.type === 'fr5' && (
              <>
                <Btn icon={CopyPlus} label="Create a copy" variant="secondary" onClick={() => decide('create_copy')} disabled={busy} />
                <Btn icon={Check} label="Update everywhere" variant="secondary" onClick={() => decide('update_everywhere')} disabled={busy} />
              </>
            )}
            {c.choice?.type === 'delete' && (
              <>
                <Btn icon={Archive} label="Keep in gearlists" variant="secondary" onClick={() => decide('keep')} disabled={busy} />
                <Btn icon={Trash2} label="Delete everywhere" variant="secondary" onClick={() => decide('delete_everywhere')} disabled={busy} />
              </>
            )}
          </>
        )}
      </div>
    </li>
  );
}

export function Proposal({
  view,
  busy,
  errors,
  generalError,
  decide,
  openLink,
}: {
  view: ProposalView;
  busy: boolean;
  /** Per change id: why its last Confirm failed. */
  errors: Record<string, string>;
  generalError: string | null;
  decide: (decisions: { change_id: string; decision: Decision }[]) => void;
  openLink: OpenLink;
}) {
  const w = (g: number) => formatWeight(g, view.unit);
  const confirmed = view.changes.filter((c) => c.status === 'confirmed').length;
  const rejected = view.changes.filter((c) => c.status === 'rejected').length;

  if (view.status === 'stale') return <OutOfDate listName={view.listName} />;
  if (view.status === 'done') {
    if (confirmed === 0) {
      return <State icon={X} tone="muted" title={`Nothing saved to ${view.listName}`} text={`All ${view.changes.length} proposed changes were rejected. Nothing was changed.`} />;
    }
    return (
      <State
        icon={CircleCheck}
        tone="success"
        title={`Saved to ${view.listName}`}
        text={
          <>
            {confirmed} {confirmed === 1 ? 'change' : 'changes'} applied{rejected > 0 ? `, ${rejected} rejected` : ''}. Base weight is now <b>{w(view.impact.after)}</b>.
            <br />
            You can undo any change in Activity on HikingBuddy.
          </>
        }
        foot={<OpenInApp view={view} openLink={openLink} />}
      />
    );
  }

  const open = view.changes.filter((c) => c.status === 'open');
  const plain = open.filter((c) => !c.choice);
  const needChoice = open.filter((c) => c.choice);
  const delta = view.impact.after - view.impact.before;
  return (
    <Frame label={`Proposed changes for ${view.listName}`}>
      <Head label="Proposed changes" title={view.listName} meta={`${view.changes.length} ${view.changes.length === 1 ? 'change' : 'changes'} · ${confirmed + rejected} decided`} />
      <div className="hbw-impact">
        <span>Base weight</span>
        <b>
          {w(view.impact.before)} → {w(view.impact.after)}
        </b>
        {delta !== 0 && (
          <span className={delta < 0 ? 'hbw-delta--down' : 'hbw-delta--up'}>
            {delta < 0 ? '−' : '+'}
            {w(Math.abs(delta))}
          </span>
        )}
      </div>
      <ul className="hbw-changes">
        {view.changes.map((c) => (
          <Change key={c.id} change={c} unit={view.unit} busy={busy} error={errors[c.id]} decide={(d) => decide([{ change_id: c.id, decision: d }])} />
        ))}
      </ul>
      <Foot>
        <div className="hbw-foot--stack" style={{ width: '100%' }}>
          {generalError && (
            <div className="hbw-change-note hbw-change-note--error" role="alert">
              <Info strokeWidth={STROKE} aria-hidden="true" />
              <span>{generalError}</span>
            </div>
          )}
          {needChoice.length > 0 && plain.length > 0 && (
            <div className="hbw-change-note">
              <Info strokeWidth={STROKE} aria-hidden="true" />
              <span>
                {listNames(needChoice.map((c) => c.name))} {needChoice.length === 1 ? 'needs' : 'need'} your choice. Confirm all skips {needChoice.length === 1 ? 'it' : 'them'}.
              </span>
            </div>
          )}
          <div className="hbw-foot-actions">
            <button type="button" className="hb-btn hb-btn--secondary" disabled={busy || open.length === 0} onClick={() => decide(open.map((c) => ({ change_id: c.id, decision: 'reject' })))}>
              <X size={18} strokeWidth={STROKE} aria-hidden="true" />
              Reject all
            </button>
            <button type="button" className="hb-btn hb-btn--primary" disabled={busy || plain.length === 0} onClick={() => decide(plain.map((c) => ({ change_id: c.id, decision: 'confirm' })))}>
              <Check size={18} strokeWidth={STROKE} aria-hidden="true" />
              Confirm all ({plain.length})
            </button>
          </div>
        </div>
      </Foot>
    </Frame>
  );
}
