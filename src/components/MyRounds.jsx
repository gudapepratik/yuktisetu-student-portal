import React from 'react';
import { CheckCircle2, XCircle, UserX, Circle, Clock, PartyPopper } from 'lucide-react';
import { formatDateTime } from '../utils/time';

/**
 * The drive's rounds as THIS student sees them (decided 2026-10-30).
 *
 * The server sends only what is theirs: nothing unless they were shortlisted;
 * while they are in the drive, every round with the upcoming ones' date and
 * venue; once out, the rounds up to the one they went out in. Only published
 * results -- a volunteer's draft mark never reaches a student.
 */
const OUTCOME = {
  ADVANCED: { Icon: CheckCircle2, color: 'var(--success)' },
  NOT_ADVANCED: { Icon: XCircle, color: 'var(--danger)' },
  ABSENT: { Icon: UserX, color: 'var(--warning)' },
};

export function MyRounds({ rounds, status }) {
  if (!rounds || rounds.length === 0) return null;
  const offered = status === 'OFFERED' || status === 'OFFER_ACCEPTED';
  return (
    <div>
      <div className="profile-section-title">Your rounds</div>
      {offered && (
        <div className="alert alert-success" style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', marginBottom: '10px' }}>
          <PartyPopper size={16} /> <span><strong>Congratulations, you have been selected.</strong> The company will send your offer letter directly.</span>
        </div>
      )}
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rounds.map((r) => {
          const o = r.myOutcome ? OUTCOME[r.myOutcome] : null;
          const Icon = o ? o.Icon : r.current ? Clock : Circle;
          return (
            <li key={r.seq} style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: '8px',
              border: `1px solid ${r.current ? 'var(--warning-border, var(--border-subtle))' : 'var(--border-subtle)'}`,
              background: r.current ? 'var(--warning-bg)' : 'transparent',
            }}>
              <Icon size={16} color={o ? o.color : r.current ? 'var(--warning)' : 'var(--text-muted)'} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '12.5px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>
                  Round {r.seq}: {r.name}
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · {r.roundType}</span>
                </div>
                {r.myOutcomeLabel && (
                  <div style={{ color: o?.color, fontWeight: 600 }}>{r.myOutcomeLabel}</div>
                )}
                {!r.myOutcome && (
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {r.current ? 'Your next round. ' : 'Upcoming. '}
                    {r.scheduledAt ? formatDateTime(r.scheduledAt) : 'Date to be announced'}
                    {r.venue ? ` · ${r.venue}` : ''}
                  </div>
                )}
                {!r.myOutcome && r.instructions && (
                  <div style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap', marginTop: '2px' }}>{r.instructions}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
