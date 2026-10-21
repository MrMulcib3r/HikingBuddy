import { useCallback, useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import { api, ApiError } from '../account/api';
import { formatClock, formatDayMonth } from '../utils/text';
import { ConfirmDialog } from './ConfirmDialog';
import { Icon } from './ui';

/**
 * Design system ActivityPanel, "Connected AI apps" (PRD v33, FR-26): AI apps that have access to
 * the account through the MCP server, each with "Revoke access" (asks first). Revoking ends the
 * app's access at once; its past changes stay in Activity and can still be undone.
 */
interface ConnectedApp {
  name: string;
  connectedAt: string;
  lastChangeAt: string | null;
}

export function ConnectedAiApps({ refreshKey, onDialogChange }: { refreshKey: unknown; onDialogChange: (open: boolean) => void }) {
  const [apps, setApps] = useState<ConnectedApp[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ apps: ConnectedApp[] }>('/api/ai-apps');
      setApps(res.apps);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError && err.kind === 'offline' ? null : 'Connected AI apps could not be loaded.');
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load, refreshKey]);

  useEffect(() => onDialogChange(confirm !== null), [confirm, onDialogChange]);

  async function revoke(name: string) {
    setBusy(true);
    try {
      const res = await api<{ apps: ConnectedApp[] }>('/api/ai-apps/revoke', { method: 'POST', body: { name } });
      setApps(res.apps);
      setError(null);
      setConfirm(null);
    } catch (err) {
      setConfirm(null);
      setError(err instanceof ApiError && err.kind === 'offline' ? 'Revoking access needs a connection.' : 'Access could not be revoked. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  if (apps === null && !error) return null;

  return (
    <div className="act-apps">
      <span className="label">Connected AI apps</span>
      {apps?.length === 0 && <p className="act-apps-empty">No AI app connected.</p>}
      {apps?.map((app) => (
        <div key={app.name} className="act-app">
          <span className="act-app-ico">
            <Icon icon={Bot} size={16} />
          </span>
          <div>
            <strong>{app.name}</strong>
            <span>
              Connected {formatDayMonth(new Date(app.connectedAt))} · {app.lastChangeAt ? `last change ${dayWord(app.lastChangeAt)} ${formatClock(app.lastChangeAt)}` : 'no changes yet'}
            </span>
          </div>
          <button type="button" className="btn btn-ghost btn-small act-revoke" disabled={busy} onClick={() => setConfirm(app.name)}>
            Revoke access
          </button>
        </div>
      ))}
      {error && (
        <p className="act-error" role="alert">
          {error}
        </p>
      )}
      {confirm && (
        <div onClick={(e) => e.stopPropagation()}>
          <ConfirmDialog
            title={`Revoke access for ${confirm}?`}
            message={`${confirm} can no longer read or change your gear until you connect it again. Its past changes stay here and can still be undone.`}
            confirmLabel="Revoke access"
            danger
            onCancel={() => setConfirm(null)}
            onConfirm={() => void revoke(confirm)}
          />
        </div>
      )}
    </div>
  );
}

/** "today" / "yesterday" / "18 Oct". */
function dayWord(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'today';
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'yesterday';
  return formatDayMonth(d);
}
