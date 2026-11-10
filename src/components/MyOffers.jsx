import React, { useCallback, useEffect, useState } from 'react';
import { offersApi } from '../api/offers';
import { useToast } from './Toast';
import { Modal } from './Modal';
import { formatDate } from '../utils/time';
import { Award, Check, X, LogOut } from 'lucide-react';

/**
 * The student's offers and what they can do with each (2026-11-01):
 *  - accept, or decline with a reason, while the offer is open;
 *  - once accepted, ask to withdraw, with a reason -- the TnP decides, and until
 *    then the offer stands and they count as placed.
 * The company never withdraws an offer here; if it does, the TnP records it and
 * the student sees it with the company's reason.
 */

const STATUS = {
  OFFERED: { label: 'Awaiting your answer', cls: 'badge-pending' },
  ACCEPTED: { label: 'Accepted', cls: 'badge-active' },
  JOINED: { label: 'Joined', cls: 'badge-active' },
  DECLINED: { label: 'Declined', cls: 'badge-inactive' },
  WITHDRAWN: { label: 'Withdrawn', cls: 'badge-inactive' },
  REVOKED: { label: 'Withdrawn by the company', cls: 'badge-inactive' },
  LAPSED: { label: 'Lapsed', cls: 'badge-inactive' },
};

function pkg(o) {
  if (o.ctcAmount != null) {
    const n = Number(o.ctcAmount);
    return n >= 100000 ? `₹${(n / 100000).toFixed(2)} LPA` : `₹${n.toLocaleString('en-IN')}`;
  }
  if (o.stipendAmount != null) return `₹${Number(o.stipendAmount).toLocaleString('en-IN')} ${o.stipendPeriod === 'MONTHLY' ? 'per month' : ''}`;
  return null;
}

/**
 * @param postingId when given, only that drive's offer (drive detail); otherwise all (dashboard)
 */
export function MyOffers({ postingId, compact = false }) {
  const toast = useToast();
  const [offers, setOffers] = useState(null);
  const [acting, setActing] = useState(null);  // { offer, kind: 'accept' | 'decline' | 'withdraw' }
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setOffers(await offersApi.list());
    } catch {
      setOffers([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = (offers || []).filter((o) => !postingId || o.postingId === Number(postingId));
  if (list.length === 0) return null;

  const close = () => { setActing(null); setReason(''); };

  const submit = async () => {
    setBusy(true);
    try {
      const { offer, kind } = acting;
      if (kind === 'accept') {
        await offersApi.accept(offer.offerId);
        toast.success(`You accepted the offer from ${offer.companyName}. Congratulations!`);
      } else if (kind === 'decline') {
        await offersApi.decline(offer.offerId, reason.trim());
        toast.success('Offer declined.');
      } else {
        await offersApi.requestWithdrawal(offer.offerId, reason.trim());
        toast.success('Withdrawal requested. The TnP will review it and you will be told the decision.');
      }
      close();
    } catch (err) {
      toast.error(err.message || 'That did not go through. Please try again.');
    } finally {
      setBusy(false);
      load();
    }
  };

  const needsReason = acting && acting.kind !== 'accept';

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Award size={16} />
        <strong>{list.length === 1 ? 'Your offer' : 'Your offers'}</strong>
      </div>
      <div style={{ display: 'grid', gap: '10px' }}>
        {list.map((o) => {
          const s = STATUS[o.status] || { label: o.status, cls: 'badge-pending' };
          const pending = o.withdrawalRequest?.status === 'PENDING';
          return (
            <div key={o.offerId} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                <strong>{o.companyName}</strong>
                {!compact && <span style={{ color: 'var(--text-secondary)' }}>· {o.postingTitle}</span>}
                <span className={`badge ${s.cls}`} style={{ marginLeft: 'auto' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {o.opportunity}{pkg(o) && <> · {pkg(o)}</>}{o.offerDate && <> · offered {formatDate(o.offerDate)}</>}
              </div>
              {o.declineReason && <div style={{ fontSize: '12.5px', marginTop: '6px' }}>You declined: “{o.declineReason}”</div>}
              {o.revokeReason && <div style={{ fontSize: '12.5px', marginTop: '6px' }}>The company withdrew this offer: “{o.revokeReason}”</div>}
              {pending && (
                <div className="alert" style={{ fontSize: '12.5px', marginTop: '8px' }}>
                  You asked to withdraw from this offer. The TnP is reviewing it; until then the offer stands.
                </div>
              )}
              {o.withdrawalRequest && o.withdrawalRequest.status !== 'PENDING' && (
                <div style={{ fontSize: '12.5px', marginTop: '6px' }}>
                  Your withdrawal request was {o.withdrawalRequest.status === 'APPROVED' ? 'approved' : 'not approved'}
                  {o.withdrawalRequest.decisionNote && <> — “{o.withdrawalRequest.decisionNote}”</>}.
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {o.canAccept && (
                  <button className="btn btn-primary btn-sm" onClick={() => setActing({ offer: o, kind: 'accept' })}>
                    <Check size={13} /> Accept
                  </button>
                )}
                {o.canDecline && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setActing({ offer: o, kind: 'decline' })}>
                    <X size={13} /> Decline
                  </button>
                )}
                {o.canRequestWithdrawal && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setActing({ offer: o, kind: 'withdraw' })}>
                    <LogOut size={13} /> Withdraw from this offer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={Boolean(acting)}
        onClose={close}
        size="sm"
        title={acting?.kind === 'accept' ? 'Accept this offer?' : acting?.kind === 'decline' ? 'Decline this offer?' : 'Withdraw from this offer?'}
        footer={acting && (
          <>
            <button className="btn btn-ghost" onClick={close} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={busy || (needsReason && reason.trim().length < 5)}>
              {busy ? 'Sending…' : acting.kind === 'accept' ? 'Accept offer' : acting.kind === 'decline' ? 'Decline offer' : 'Send request'}
            </button>
          </>
        )}
      >
        {acting && (
          <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
            <div><strong>{acting.offer.companyName}</strong> · {acting.offer.postingTitle}</div>
            {acting.kind === 'accept' && (
              <div style={{ color: 'var(--text-secondary)' }}>
                Once accepted you count as placed. Drives that are closed to placed students, or that need a higher
                package than this one, will no longer be open to you. To give it up later you will need the TnP’s approval.
              </div>
            )}
            {acting.kind === 'decline' && (
              <div style={{ color: 'var(--text-secondary)' }}>Declining cannot be undone. Please tell the TnP why.</div>
            )}
            {acting.kind === 'withdraw' && (
              <div style={{ color: 'var(--text-secondary)' }}>
                Your request goes to the TnP. The offer stands until they approve it.
              </div>
            )}
            {needsReason && (
              <div className="form-group">
                <label className="form-label" htmlFor="offer-reason">Reason *</label>
                <textarea id="offer-reason" className="form-control" rows={3} maxLength={500} autoFocus
                          value={reason} onChange={(e) => setReason(e.target.value)}
                          placeholder="A few words the TnP can read" />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
