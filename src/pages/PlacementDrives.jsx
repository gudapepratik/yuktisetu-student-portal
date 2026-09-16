import React, { useState, useEffect } from 'react';
import { drivesApi } from '../api/drives';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import {
  Briefcase, Building2, MapPin, CalendarClock, IndianRupee, Users,
  CheckCircle2, XCircle, AlertTriangle, ExternalLink, Info, RefreshCw,
} from 'lucide-react';

const TABS = [
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'all', label: 'All' },
];

const STATUS_CONFIG = {
  PUBLISHED: { label: 'Open', color: 'var(--success)', bg: 'var(--success-bg)', Icon: CheckCircle2 },
  APPLICATIONS_CLOSED: { label: 'Applications closed', color: 'var(--text-muted)', bg: 'rgba(101,112,125,0.14)', Icon: XCircle },
  IN_PROGRESS: { label: 'In progress', color: 'var(--warning)', bg: 'var(--warning-bg)', Icon: AlertTriangle },
  COMPLETED: { label: 'Completed', color: 'var(--text-muted)', bg: 'rgba(101,112,125,0.14)', Icon: XCircle },
};

const APPLICATION_LABEL = {
  APPLIED: 'Applied',
  WITHDRAWN: 'Withdrawn',
  IN_REVIEW: 'Under review',
  SHORTLISTED: 'Shortlisted',
  REJECTED: 'Not selected',
  DISQUALIFIED: 'Disqualified',
  OFFERED: 'Offered',
  OFFER_ACCEPTED: 'Offer accepted',
  OFFER_DECLINED: 'Offer declined',
};

/**
 * Turns a backend failure code into something a student can act on.
 *
 * The codes are stable and this wording is not, deliberately: the TnP can reword
 * any of it without the backend changing, and an unrecognised code still renders
 * rather than leaving the student with a blank reason.
 */
const FAILURE_TEXT = {
  PROFILE_INCOMPLETE: 'Your profile is missing details the TnP requires.',
  CGPA_BELOW_MIN: 'Your CGPA is below this drive’s minimum.',
  SEMESTER_GPA_BELOW_MIN: 'One of your semester GPAs is below the minimum.',
  TENTH_BELOW_MIN: 'Your 10th percentage is below the minimum.',
  TWELFTH_BELOW_MIN: 'Your 12th percentage is below the minimum.',
  DIPLOMA_BELOW_MIN: 'Your diploma percentage is below the minimum.',
  TWELFTH_OR_DIPLOMA_BELOW_MIN: 'Neither your 12th nor your diploma percentage meets the minimum.',
  ACTIVE_BACKLOGS_EXCEEDED: 'You have more active backlogs than this drive allows.',
  TOTAL_BACKLOGS_EXCEEDED: 'You have more backlogs in total than this drive allows.',
  GAP_YEARS_EXCEEDED: 'Your academic gap exceeds what this drive allows.',
  COCUBES_BELOW_MIN: 'Your CoCubes score is below the minimum.',
  LIVE_INTERNSHIP_HELD: 'You already hold an internship offer, so you cannot sit for another internship drive.',
  ALREADY_PLACED: 'You are already placed, and this drive is not open to placed students.',
  PLACED_UPLIFT_NOT_MET: 'This drive does not pay enough above your current offer to qualify.',
  INTERN_UPLIFT_NOT_MET: 'This drive’s stipend does not clear the required uplift over your current internship.',
  PENDING_OFFER_HELD: 'You are holding an offer you have not yet responded to.',
  MAX_LIVE_OFFERS_REACHED: 'You already hold the maximum number of offers this drive allows.',
  COOLING_OFF_ACTIVE: 'You accepted another offer too recently.',
  ADMIN_DENIED: 'The TnP has not cleared you for this drive.',
  ADMIN_DECISION_PENDING: 'The TnP still needs to review whether you may sit for this drive.',
  NEEDS_REVIEW: 'Some of your details need to be checked by the TnP first.',
};

function describeFailure(code) {
  if (FAILURE_TEXT[code]) return FAILURE_TEXT[code];
  if (code.startsWith('MISSING_DATA:')) {
    return `Your profile has no value recorded for ${code.split(':')[1]}.`;
  }
  if (code.startsWith('CUSTOM:')) {
    return `You do not meet a company-specific requirement (${code.split(':')[1]}).`;
  }
  return code;
}

function formatMoney(min, max) {
  if (!min && !max) return null;
  const lakh = (v) => `${(Number(v) / 100000).toFixed(1)}L`;
  if (min && max && Number(min) !== Number(max)) return `₹${lakh(min)} – ₹${lakh(max)}`;
  return `₹${lakh(max || min)}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * The student's drive list.
 *
 * Only drives this student is eligible for are ever returned, so there is no
 * client-side filtering of a global list — the server decides visibility, and a
 * drive that is absent was never theirs to see.
 *
 * applyOpen comes from the server rather than being derived here: the deadline is
 * enforced against the server clock, and a browser running minutes slow would
 * otherwise render an enabled button whose every press fails.
 */
export function PlacementDrives() {
  const { toast } = useToast();

  const [tab, setTab] = useState('open');
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { fetchDrives(); }, [tab]);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const data = await drivesApi.listDrives(tab);
      setDrives(data || []);
    } catch (err) {
      setDrives([]);
      toast.error(err.message || 'Could not load your drives');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (postingId) => {
    try {
      const [d, e] = await Promise.all([
        drivesApi.getDrive(postingId),
        drivesApi.myEligibility(postingId).catch(() => null),
      ]);
      setDetail(d);
      setEligibility(e);
    } catch (err) {
      toast.error(err.message || 'Could not open this drive');
    }
  };

  const apply = async (postingId) => {
    setBusyId(postingId);
    try {
      await drivesApi.applyToDrive(postingId);
      toast.success('Applied. You can withdraw any time before the deadline.');
      setDetail(null);
      await fetchDrives();
    } catch (err) {
      // ELIGIBILITY_CHANGED carries the live reasons in its message — the student
      // was eligible when this list was drawn, so a bare refusal would be baffling.
      toast.error(err.message || 'Could not submit your application');
    } finally {
      setBusyId(null);
    }
  };

  const withdraw = async (postingId) => {
    setBusyId(postingId);
    try {
      await drivesApi.withdrawApplication(postingId);
      toast.info('Application withdrawn.');
      setDetail(null);
      await fetchDrives();
    } catch (err) {
      toast.error(err.message || 'Could not withdraw your application');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="content-container page-fade-in">
      <div className="page-header">
        <div className="page-eyebrow">
          <Briefcase size={13} /> Placement
        </div>
        <h1 className="page-title">Drives</h1>
        <p className="page-desc">
          Every drive you are eligible for. Applying takes one tap — your profile is already
          attached, so there is nothing to fill in.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', alignItems: 'center' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={fetchDrives} disabled={loading}
                style={{ marginLeft: 'auto' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading your drives...</div>
      ) : drives.length === 0 ? (
        <div className="empty-state">
          <Briefcase className="empty-icon" size={34} />
          <div className="empty-title">No drives here yet</div>
          <div className="empty-desc">
            {tab === 'open'
              ? 'When the TnP publishes a drive you are eligible for, it will appear here.'
              : 'Nothing in this view.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {drives.map((d) => {
            const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.PUBLISHED;
            const StatusIcon = cfg.Icon;
            const pay = formatMoney(d.ctcMin, d.ctcMax);
            const applied = d.myApplicationStatus === 'APPLIED';

            return (
              <div key={d.postingId} className="panel"
                   style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14.5px' }}>{d.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <Building2 size={12} /> {d.companyName}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10.5px', padding: '3px 8px', borderRadius: '20px',
                    color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap',
                    display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600,
                  }}>
                    <StatusIcon size={11} /> {cfg.label}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={12} /> {d.jobType?.replaceAll('_', ' ')}
                  </span>
                  {pay && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <IndianRupee size={12} /> {pay}
                    </span>
                  )}
                  {d.workMode && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {d.workMode}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CalendarClock size={12} /> Closes {formatDate(d.applicationDeadline)}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '6px', alignItems: 'center' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openDetail(d.postingId)}>
                    <Info size={12} /> Details
                  </button>
                  {applied ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={!d.applyOpen || busyId === d.postingId}
                      onClick={() => withdraw(d.postingId)}
                      style={{ marginLeft: 'auto' }}
                    >
                      {d.applyOpen ? 'Withdraw' : 'Applied'}
                    </button>
                  ) : d.myApplicationStatus && d.myApplicationStatus !== 'WITHDRAWN' ? (
                    <span className="badge badge-info" style={{ marginLeft: 'auto' }}>
                      {APPLICATION_LABEL[d.myApplicationStatus] || d.myApplicationStatus}
                    </span>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={!d.applyOpen || busyId === d.postingId}
                      onClick={() => apply(d.postingId)}
                      style={{ marginLeft: 'auto' }}
                      title={d.applyOpen ? undefined : 'Applications are closed for this drive'}
                    >
                      {busyId === d.postingId ? 'Applying...' : 'Easy Apply'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- Detail ---------------- */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail?.title || ''} wide>
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={13} /> {detail.companyName}
                {detail.companyWebsite && (
                  <a href={detail.companyWebsite} target="_blank" rel="noreferrer" className="auth-link"
                     style={{ fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <ExternalLink size={11} /> Website
                  </a>
                )}
              </div>
              {detail.companyDescription && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {detail.companyDescription}
                </p>
              )}
            </div>

            {detail.description && (
              <div>
                <div className="profile-section-title">About the role</div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {detail.description}
                </p>
              </div>
            )}

            <div className="form-grid">
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Package</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  {formatMoney(detail.ctcMin, detail.ctcMax) || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Openings</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  <Users size={12} style={{ verticalAlign: '-2px' }} /> {detail.vacancyCount ?? '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applications close</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{formatDate(detail.applicationDeadline)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Drive date</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{formatDate(detail.driveDate)}</div>
              </div>
            </div>

            {(detail.mandatorySkills?.length > 0 || detail.preferredSkills?.length > 0) && (
              <div>
                <div className="profile-section-title">Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {detail.mandatorySkills?.map((s) => (
                    <span key={`m-${s}`} className="badge badge-active">{s}</span>
                  ))}
                  {detail.preferredSkills?.map((s) => (
                    <span key={`p-${s}`} className="badge badge-pending">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {detail.criteriaSummary?.length > 0 && (
              <div>
                <div className="profile-section-title">Eligibility bar</div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  {detail.criteriaSummary.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </div>
            )}

            {eligibility && !eligibility.eligible && (
              <div className="alert alert-danger">
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>You cannot apply to this drive</div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px' }}>
                  {eligibility.failureCodes.map((c) => <li key={c}>{describeFailure(c)}</li>)}
                </ul>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Close</button>
              {detail.myApplicationStatus === 'APPLIED' ? (
                <button className="btn btn-secondary"
                        disabled={!detail.applyOpen || busyId === detail.postingId}
                        onClick={() => withdraw(detail.postingId)}>
                  Withdraw application
                </button>
              ) : (
                <button className="btn btn-primary"
                        disabled={!detail.applyOpen || busyId === detail.postingId || (eligibility && !eligibility.eligible)}
                        onClick={() => apply(detail.postingId)}>
                  {busyId === detail.postingId ? 'Applying...' : 'Easy Apply'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
