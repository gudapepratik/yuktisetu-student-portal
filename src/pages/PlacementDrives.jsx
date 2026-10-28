import React, { useState, useEffect } from 'react';
import { drivesApi } from '../api/drives';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import {
  Briefcase, Building2, MapPin, CalendarClock, IndianRupee,
  CheckCircle2, XCircle, AlertTriangle, ExternalLink, Info, RefreshCw,
} from 'lucide-react';
import { CodingChecks } from '../components/CodingChecks';
import { DriveScore } from '../components/MyScores';
import { parseDriveId, navigateTo } from '../utils/routes';
import { formatDateTime } from '../utils/time';

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
  return formatDateTime(iso);
}

const LABEL = (v) => (v ? v.replaceAll('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()) : null);

function formatRupees(v) {
  return v == null ? null : `₹${Number(v).toLocaleString('en-IN')}`;
}

/**
 * Every fact about the role the TnP entered, label and value, skipping only the
 * ones that were left blank. The drive page shows all of it: a student should
 * never have to ask the TnP what a field in the JD said.
 */
function roleFacts(d) {
  const basis = d.packageBasis && d.packageBasis !== 'CTC' ? ` (${LABEL(d.packageBasis)})` : '';
  const stipend = d.stipendAmount != null
    ? `${formatRupees(d.stipendAmount)}${d.stipendPeriod === 'TOTAL' ? ' total' : ' / month'}`
    : null;
  let bond = null;
  if (d.bondMonths === 0) bond = 'No bond';
  else if (d.bondMonths != null || d.bondAmount != null) {
    bond = [d.bondMonths != null ? `${d.bondMonths} months` : null, formatRupees(d.bondAmount)]
      .filter(Boolean).join(', ');
  }
  const facts = [
    ['Job type', LABEL(d.jobType)],
    ['Work mode', LABEL(d.workMode)],
    ['Package', formatMoney(d.ctcMin, d.ctcMax) ? formatMoney(d.ctcMin, d.ctcMax) + basis : null],
    ['Stipend', stipend],
    ['Internship duration', d.internshipDurationMonths != null ? `${d.internshipDurationMonths} months` : null],
    ['PPO possible', d.ppoPossible ? 'Yes' : null],
    ['Bond', bond],
    ['Openings', d.vacancyCount != null ? String(d.vacancyCount) : null],
    ['Locations', d.locations?.length ? d.locations.join('\n') : null],
    ['Applications open', d.applicationOpensAt ? formatDate(d.applicationOpensAt) : null],
    ['Applications close', formatDate(d.applicationDeadline)],
    ['Drive date', d.driveDate ? formatDate(d.driveDate) : null],
    ['Venue', d.driveVenue || null],
  ];
  return facts.filter(([, v]) => v !== null && v !== undefined && v !== '');
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

  // The tab (?tab=applied) and an open drive (/drives/42) live in the URL, so a
  // refresh puts the student back on the same list and the same drive.
  const [tab, setTabState] = useState(() => {
    const wanted = new URLSearchParams(window.location.search).get('tab');
    return TABS.some((t) => t.id === wanted) ? wanted : 'open';
  });
  const setTab = (id) => {
    setTabState(id);
    navigateTo(`/drives${id === 'open' ? '' : `?tab=${id}`}`, { replace: true });
  };
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { fetchDrives(); }, [tab]);

  // Reopen the drive named in the URL on first load.
  useEffect(() => {
    const id = parseDriveId(window.location.pathname);
    if (id) openDetail(id);
  }, []);

  // Back/Forward between the list and a drive.
  useEffect(() => {
    const onPop = () => {
      const id = parseDriveId(window.location.pathname);
      if (id) openDetail(id, { push: false });
      else { setDetail(null); setEligibility(null); }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const listUrl = () => `/drives${tab === 'open' ? '' : `?tab=${tab}`}`;
  const closeDetail = () => {
    setDetail(null);
    navigateTo(listUrl(), { replace: true });
  };

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

  const openDetail = async (postingId, { push = true } = {}) => {
    try {
      const [d, e] = await Promise.all([
        drivesApi.getDrive(postingId),
        drivesApi.myEligibility(postingId).catch(() => null),
      ]);
      setDetail(d);
      setEligibility(e);
      if (push) navigateTo(`/drives/${postingId}`);
    } catch (err) {
      toast.error(err.message || 'Could not open this drive');
      navigateTo(listUrl(), { replace: true });
    }
  };

  const apply = async (postingId) => {
    setBusyId(postingId);
    try {
      await drivesApi.applyToDrive(postingId);
      toast.success('Applied. You can withdraw any time before the deadline.');
      closeDetail();
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
      closeDetail();
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

      <CodingChecks />

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
                  {d.underReReview && (
                    <span className="badge badge-warning" style={{ marginLeft: 'auto' }}
                          title="You were shortlisted, then the TnP reopened applications. The shortlist will be worked out again after the new deadline.">
                      Under re-review
                    </span>
                  )}
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
      <Modal isOpen={!!detail} onClose={closeDetail} title={detail?.title || ''} wide>
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

            {detail.responsibilities && (
              <div>
                <div className="profile-section-title">Responsibilities</div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {detail.responsibilities}
                </p>
              </div>
            )}

            <div>
              <div className="profile-section-title">Role at a glance</div>
              <div className="form-grid">
                {roleFacts(detail).map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'pre-wrap' }}>{value}</div>
                  </div>
                ))}
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

            {detail.underReReview && (

              <div className="alert alert-warning" style={{ display: 'block', fontSize: '13px', marginBottom: '12px', lineHeight: 1.55 }}>

                <strong>Under re-review.</strong> You were shortlisted for this drive, then the TnP extended the deadline and

                reopened applications. Your application stands; the shortlist will be worked out again after the new

                deadline, and you will be told the result.

              </div>

            )}

            <DriveScore postingId={detail.postingId} />

            {eligibility && !eligibility.eligible && (
              <div className="alert alert-danger">
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>You cannot apply to this drive</div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px' }}>
                  {eligibility.failureCodes.map((c) => <li key={c}>{describeFailure(c)}</li>)}
                </ul>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeDetail}>Close</button>
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
