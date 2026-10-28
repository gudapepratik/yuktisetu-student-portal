import React, { useEffect, useState } from 'react';
import { drivesApi } from '../api/drives';
import { Award, Info } from 'lucide-react';

/**
 * A student's standing among a drive's applicants, and how it was worked out.
 * Called "standing", never "score" (decided 2026-10-27): it is relative to who
 * applied, and the word has to say so.
 *
 * Renders nothing unless the server returns something, and it returns nothing
 * unless the TnP has turned score visibility on AND the drive's shortlist has
 * been published. There is no rank here by design: a student is shown how their
 * number was built, never where it placed them.
 */

const FACTOR_LABEL = {
  ACADEMIC_PERFORMANCE: 'Academic performance',
  CODING_PROFICIENCY: 'Coding proficiency',
  SKILL_MATCH: 'Skill match',
  EXPERIENCE_RELEVANCE: 'Experience relevance',
  CERTIFICATIONS: 'Certifications',
};

const fmt = (v, d = 1) => (v === null || v === undefined ? '—' : Number(v).toFixed(d));

/** Shared fetch: one request per page view, whichever component asks first. */
let pending = null;
function loadScores() {
  if (!pending) {
    pending = drivesApi.getMyScores()
      .then((d) => d?.items || [])
      .catch(() => [])
      .finally(() => { setTimeout(() => { pending = null; }, 0); });
  }
  return pending;
}

function useMyScores() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let alive = true;
    loadScores().then((list) => { if (alive) setItems(list); });
    return () => { alive = false; };
  }, []);
  return items;
}

/** The score for one drive, for the drive's detail view. */
export function DriveScore({ postingId }) {
  const items = useMyScores();
  const score = items.find((s) => s.postingId === postingId);
  if (!score) return null;
  return <ScoreCard score={score} />;
}

/** Every drive the student has a visible score for, for the Dashboard. */
export function MyScoresPanel() {
  const items = useMyScores();
  if (items.length === 0) return null;
  return (
    <div className="panel" style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14.5px' }}>
        <Award size={16} /> Your standing in drives
      </div>
      {items.map((s) => (
        <div key={s.postingId}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            {s.postingTitle} at {s.companyName}
          </div>
          <ScoreCard score={s} compact />
        </div>
      ))}
    </div>
  );
}

function ScoreCard({ score, compact = false }) {
  const factors = score.factors || [];
  const shortlisted = score.applicationStatus === 'SHORTLISTED';
  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px 14px',
                  background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standing among applicants</span>
        <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{fmt(score.composite, 0)}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 100</span>
        {Number(score.threshold) > 0 && (
          <span style={{ fontSize: '12px', color: score.meetsThreshold ? 'var(--success)' : 'var(--text-secondary)' }}>
            · this drive’s minimum {fmt(score.threshold, 0)} {score.meetsThreshold ? '(met)' : '(not met)'}
          </span>
        )}
        <span style={{ fontSize: '12px', fontWeight: 600, marginLeft: 'auto',
                       color: shortlisted ? 'var(--success)' : 'var(--text-secondary)' }}>
          {shortlisted ? 'Shortlisted' : 'Not shortlisted'}
        </span>
      </div>

      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '-4px' }}>
        You placed ahead of about {fmt(score.composite, 0)}% of the {score.poolSize} students who applied to this drive,
        on the factors below.
      </div>

      {factors.map((f) => {
        const share = Number(f.weightApplied || 0);
        const p = f.percentile == null ? null : Number(f.percentile);
        return (
          <div key={f.factor}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px', gap: '8px' }}>
              <span>
                <strong>{FACTOR_LABEL[f.factor] || f.factor}</strong>
                <span style={{ color: 'var(--text-muted)' }}> · weight {fmt(share)}%</span>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {f.excludedReason ? 'not counted' : `ahead of ${fmt(p, 0)}% → ${fmt(f.contribution, 1)} of your ${fmt(score.composite, 0)}`}
              </span>
            </div>
            {!f.excludedReason && (
              <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.max(0, Math.min(100, p || 0))}%`, height: '100%', background: 'var(--accent-blue)' }} />
              </div>
            )}
            {!compact && (
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                {f.excludedReason
                  ? f.excludedReason
                  : f.kind === 'NONE'
                    ? 'Nothing recorded for this factor, so it counts at the bottom of the range.'
                    : `Compared with ${f.sampleSize} applicants to this drive.`}
                {f.floorFailed && ' Below this drive’s minimum for this factor.'}
              </div>
            )}
          </div>
        );
      })}

      {!compact && score.coding && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {score.coding.platform
            ? <>Coding was judged on <strong>{score.coding.platform}</strong>, where you stand highest among this drive’s applicants.</>
            : 'No coding platform counted for this drive.'}
          {score.coding.notCounted?.length > 0 && <> Not counted: {score.coding.notCounted.join('; ')}.</>}
        </div>
      )}
      {score.weightsRenormalised && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          One factor could not be measured for you, so your other factors count for 100%.
        </div>
      )}
      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', gap: '6px' }}>
        <Info size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          Your standing compares you with this drive’s own {score.poolSize} applicants, using the weights the TnP set
          for this company. It is not a mark: the same profile can stand higher or lower on another drive.
        </span>
      </div>
    </div>
  );
}
