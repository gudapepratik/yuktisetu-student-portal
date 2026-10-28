import React, { useCallback, useEffect, useState } from 'react';
import { drivesApi } from '../api/drives';
import { useToast } from './Toast';
import { Modal } from './Modal';
import { AlertTriangle, CheckCircle2, Loader2, ShieldQuestion, Info, RefreshCw } from 'lucide-react';

/**
 * The student's coding-handle checks, shown on the Dashboard and the Drives page.
 *
 * When a coding profile cannot be read for a drive they applied to, they are
 * told why and get ONE re-check per platform before the deadline. Renders
 * nothing when all is well, which is the usual case.
 *
 * The wording lives here, keyed on stable status codes from drive-service, so
 * it can be reworded without a backend change.
 */

const DEADLINE_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
});

function formatWhen(iso) {
  return iso ? DEADLINE_FORMAT.format(new Date(iso)) : '';
}

const FLAG_TEXT = {
  SERVER_ERROR: 'We could not read it because of a server error, on our side or the platform’s, not because of anything you did. A TnP member will evaluate you.',
  NO_RECHECK: 'It could not be read, and it was not re-checked before the deadline. A TnP member will evaluate you.',
  AFTER_DEADLINE: 'It could not be read, and the deadline had already passed, so there was no time to re-check. A TnP member will evaluate you.',
  NOTHING_LEFT: 'None of the coding platforms you listed could be read, so there is nothing to score you on automatically. A TnP member will evaluate you.',
};

function describe(item) {
  switch (item.status) {
    case 'NEEDS_RECHECK':
      if (!item.canRecheck) {
        return 'This could not be read, and the deadline has passed. It will go to the TnP Cell for review.';
      }
      return item.outcome === 'NO_HANDLE'
        ? `You listed ${item.platformLabel} on your profile without a username.`
        : `No ${item.platformLabel} account named “${item.handle}” was found. Common causes: a typo, a renamed account, a private profile, or the profile link pasted instead of the username.`;
    case 'CHECKING':
      return `Reading “${item.handle}” now. This usually takes under a minute.`;
    case 'CONFIRMED':
      return `“${item.handle}” was read successfully.`;
    case 'SCORED_ON_OTHERS':
      return `Your re-check of “${item.handle}” did not succeed either. This may be a problem with our reader or with ${item.platformLabel}, rather than your username. You will be scored on the best of your other platforms. Contact the TnP Cell if this is wrong.`;
    case 'WITH_TNP':
      return FLAG_TEXT[item.flagReason] || 'A TnP member will evaluate you.';
    default:
      return '';
  }
}

const STYLE = {
  NEEDS_RECHECK: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)', Icon: AlertTriangle, label: 'Action needed' },
  CHECKING: { color: 'var(--accent-blue)', bg: 'var(--bg-subtle)', border: 'var(--border-subtle)', Icon: Loader2, label: 'Checking' },
  CONFIRMED: { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)', Icon: CheckCircle2, label: 'Confirmed' },
  SCORED_ON_OTHERS: { color: 'var(--text-secondary)', bg: 'var(--bg-subtle)', border: 'var(--border-subtle)', Icon: Info, label: 'Scored on other platforms' },
  WITH_TNP: { color: 'var(--accent-blue)', bg: 'var(--bg-subtle)', border: 'var(--border-subtle)', Icon: ShieldQuestion, label: 'With the TnP Cell' },
};

/** Same rule the backend enforces, checked early so the common mistake gets a clear message. */
const HANDLE_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/;

export function CodingChecks() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);   // the item being re-checked
  const [handle, setHandle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await drivesApi.getCodingChecks();
      setItems(data?.items || []);
    } catch {
      // A banner that cannot load is not worth an error toast on every page view.
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // While a re-check is being read, look again every few seconds -- the result
  // arrives in well under a minute. Stops by itself once nothing is CHECKING.
  const checking = items.some((i) => i.status === 'CHECKING');
  useEffect(() => {
    if (!checking) return undefined;
    const t = setTimeout(load, 5000);
    return () => clearTimeout(t);
  }, [checking, items, load]);

  const openRecheck = (item) => {
    setEditing(item);
    setHandle(item.handle && item.outcome !== 'NO_HANDLE' ? item.handle : '');
    setError('');
  };

  const closeRecheck = useCallback(() => {
    if (!submitting) setEditing(null);
  }, [submitting]);

  const submit = async () => {
    const value = handle.trim();
    if (!HANDLE_PATTERN.test(value)) {
      setError('Enter just the username, not the profile link, and no spaces.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await drivesApi.recheckCodingHandle(editing.platform, value);
      setItems(data?.items || []);
      setEditing(null);
      toast.success(`Re-checking ${editing.platformLabel}. We will let you know the result.`);
    } catch (err) {
      setError(err.message || 'Could not start the re-check. Please try again.');
      if (err.code === 'CODING_RECHECK_UNAVAILABLE') load();
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) return null;

  const changed = editing && handle.trim() && handle.trim() !== editing.handle;

  return (
    <div className="panel" style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontWeight: 600, fontSize: '14.5px' }}>Coding profiles</div>
        <button className="btn btn-ghost btn-sm" onClick={load} style={{ marginLeft: 'auto' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {items.map((item) => {
        const st = STYLE[item.status] || STYLE.WITH_TNP;
        const Icon = st.Icon;
        return (
          <div key={`${item.platform}-${item.status}-${item.flagReason || ''}`}
               style={{ border: `1px solid ${st.border}`, background: st.bg, borderRadius: '10px', padding: '12px 14px',
                        display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start' }}>
            <Icon size={18} style={{ color: st.color, flexShrink: 0, marginTop: '1px' }} />
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600 }}>{item.platformLabel}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: st.color }}>{st.label}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                {describe(item)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {item.drives.map((d) => `${d.title} at ${d.companyName}`).join(' · ')}
                {item.canRecheck && item.recheckBy && <> · re-check by {formatWhen(item.recheckBy)}</>}
              </div>
            </div>
            {item.canRecheck && (
              <button className="btn btn-primary btn-sm" onClick={() => openRecheck(item)}
                      style={{ alignSelf: 'center' }}>
                Check username
              </button>
            )}
          </div>
        );
      })}

      <Modal
        isOpen={Boolean(editing)}
        onClose={closeRecheck}
        title={editing ? `Re-check ${editing.platformLabel}` : ''}
        size="sm"
        footer={editing && (
          <>
            <button className="btn btn-ghost" onClick={closeRecheck} disabled={submitting}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={submitting || !handle.trim()}>
              {submitting ? 'Starting…' : 'Re-check'}
            </button>
          </>
        )}
      >
        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="recheck-handle">{editing.platformLabel} username</label>
              <input
                id="recheck-handle"
                className="form-control"
                value={handle}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => { setHandle(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                placeholder="your_username"
              />
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              You can re-check <strong>once</strong>. Make sure the username is exactly as it appears on
              your {editing.platformLabel} profile, and that the profile is public.
              {changed && (
                <> Your profile will be updated to “{handle.trim()}”, and every open drive above reads the new one.
                  Update the profile link on your Profile page too.</>
              )}
            </div>
            {error && (
              <div style={{ fontSize: '12.5px', color: 'var(--danger)', background: 'var(--danger-bg)',
                            border: '1px solid var(--danger-border)', borderRadius: '8px', padding: '8px 10px' }}>
                {error}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
