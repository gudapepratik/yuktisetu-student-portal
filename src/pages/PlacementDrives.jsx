import React, { useState, useEffect } from 'react';
import { drivesApi } from '../api/drives';
import {
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  X,
  ExternalLink,
  ArrowRight,
  Download,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';

const DRIVE_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  UPCOMING: 'UPCOMING',
  ONGOING: 'ONGOING',
};

const DRIVE_TYPES = {
  FULL_TIME: 'FULL_TIME',
  INTERNSHIP: 'INTERNSHIP',
  CONTRACT: 'CONTRACT',
};

const statusIcons = {
  [DRIVE_STATUS.OPEN]: CheckCircle2,
  [DRIVE_STATUS.CLOSED]: XCircle,
  [DRIVE_STATUS.UPCOMING]: Clock,
  [DRIVE_STATUS.ONGOING]: AlertTriangle,
};

const statusConfig = {
  [DRIVE_STATUS.OPEN]: { label: 'Open', color: 'var(--success)', bg: 'var(--success-bg)' },
  [DRIVE_STATUS.CLOSED]: { label: 'Closed', color: 'var(--text-muted)', bg: 'rgba(101,112,125,0.14)' },
  [DRIVE_STATUS.UPCOMING]: { label: 'Upcoming', color: 'var(--accent-blue)', bg: 'var(--accent-blue-glow)' },
  [DRIVE_STATUS.ONGOING]: { label: 'Ongoing', color: 'var(--warning)', bg: 'var(--warning-bg)' },
};

const typeConfig = {
  [DRIVE_TYPES.FULL_TIME]: { label: 'Full-time', color: 'var(--accent-teal)' },
  [DRIVE_TYPES.INTERNSHIP]: { label: 'Internship', color: 'var(--accent-gold)' },
  [DRIVE_TYPES.CONTRACT]: { label: 'Contract', color: 'var(--accent-purple)' },
};

export function PlacementDrives() {
  const { toast } = useToast();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [applying, setApplying] = useState(null);

  // Mock data for demo (replace with actual API call)
  const mockDrives = [
    {
      id: 1,
      title: 'Software Development Engineer',
      company: { name: 'Google India', logo: null, website: 'https://google.com' },
      type: DRIVE_TYPES.FULL_TIME,
      status: DRIVE_STATUS.OPEN,
      location: 'Bangalore, Karnataka',
      ctc: '45 LPA',
      stipend: null,
      description: 'We are looking for passionate software engineers to join our team...',
      eligibilityCriteria: 'B.Tech/B.E. in CS/IT/ECE, CGPA >= 7.0, No active backlogs',
      skillsRequired: ['Java', 'Python', 'Go', 'Distributed Systems', 'System Design'],
      applicationDeadline: '2026-09-15T23:59:59Z',
      driveDate: '2026-09-20T09:00:00Z',
      rounds: ['Online Assessment', 'Technical Interview 1', 'Technical Interview 2', 'Hiring Committee'],
      applied: false,
    },
    {
      id: 2,
      title: 'Backend Engineering Intern',
      company: { name: 'Microsoft', logo: null, website: 'https://microsoft.com' },
      type: DRIVE_TYPES.INTERNSHIP,
      status: DRIVE_STATUS.OPEN,
      location: 'Hyderabad, Telangana',
      ctc: null,
      stipend: '1.25 Lakh/month',
      description: 'Summer internship program for backend engineering...',
      eligibilityCriteria: 'B.Tech 3rd year, CGPA >= 8.0, Strong in Java/C#',
      skillsRequired: ['C#', '.NET', 'Azure', 'SQL', 'REST APIs'],
      applicationDeadline: '2026-09-10T23:59:59Z',
      driveDate: '2026-09-25T10:00:00Z',
      rounds: ['Online Coding Test', 'Technical Interview', 'HR Round'],
      applied: false,
    },
    {
      id: 3,
      title: 'Full Stack Developer',
      company: { name: 'Amazon', logo: null, website: 'https://amazon.com' },
      type: DRIVE_TYPES.FULL_TIME,
      status: DRIVE_STATUS.UPCOMING,
      location: 'Pune, Maharashtra',
      ctc: '42 LPA',
      stipend: null,
      description: 'Join Amazon\'s retail technology team...',
      eligibilityCriteria: 'B.Tech/M.Tech, CGPA >= 7.5, 2026 batch',
      skillsRequired: ['Java', 'React', 'AWS', 'Microservices', 'Docker'],
      applicationDeadline: '2026-09-20T23:59:59Z',
      driveDate: '2026-10-01T09:00:00Z',
      rounds: ['Online Assessment', 'Technical Interviews (3)', 'Bar Raiser'],
      applied: true,
    },
    {
      id: 4,
      title: 'Data Science Intern',
      company: { name: 'Flipkart', logo: null, website: 'https://flipkart.com' },
      type: DRIVE_TYPES.INTERNSHIP,
      status: DRIVE_STATUS.CLOSED,
      location: 'Bangalore, Karnataka',
      ctc: null,
      stipend: '80k/month',
      description: 'Data science internship with focus on recommendation systems...',
      eligibilityCriteria: 'B.Tech/M.Tech, CGPA >= 8.5, ML/DL coursework',
      skillsRequired: ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'Statistics'],
      applicationDeadline: '2026-08-01T23:59:59Z',
      driveDate: '2026-08-15T09:00:00Z',
      rounds: ['Coding Test', 'ML Assignment', 'Technical Interview'],
      applied: false,
    },
    {
      id: 5,
      title: 'DevOps Engineer',
      company: { name: 'Uber', logo: null, website: 'https://uber.com' },
      type: DRIVE_TYPES.FULL_TIME,
      status: DRIVE_STATUS.OPEN,
      location: 'Remote / Bangalore',
      ctc: '38 LPA',
      stipend: null,
      description: 'Build and maintain scalable infrastructure...',
      eligibilityCriteria: 'B.Tech, CGPA >= 7.0, Experience with Kubernetes',
      skillsRequired: ['Kubernetes', 'AWS', 'Terraform', 'Go', 'Prometheus'],
      applicationDeadline: '2026-09-30T23:59:59Z',
      driveDate: '2026-10-10T10:00:00Z',
      rounds: ['Screening', 'Technical Deep Dive', 'System Design', 'Cultural Fit'],
      applied: false,
    },
    {
      id: 6,
      title: 'Frontend Developer',
      company: { name: 'Swiggy', logo: null, website: 'https://swiggy.com' },
      type: DRIVE_TYPES.FULL_TIME,
      status: DRIVE_STATUS.ONGOING,
      location: 'Bangalore, Karnataka',
      ctc: '32 LPA',
      stipend: null,
      description: 'Build delightful user experiences for millions of users...',
      eligibilityCriteria: 'B.Tech, CGPA >= 7.0, 2+ years React experience',
      skillsRequired: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'Testing'],
      applicationDeadline: '2026-09-05T23:59:59Z',
      driveDate: '2026-09-12T09:00:00Z',
      rounds: ['Portfolio Review', 'Coding Challenge', 'Technical Interview', 'Design Review'],
      applied: false,
    },
  ];

  useEffect(() => {
    loadDrives();
  }, []);

  const loadDrives = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const data = await drivesApi.listDrives({ search, status: statusFilter, type: typeFilter });
      // setDrives(data);
      setDrives(mockDrives);
    } catch (err) {
      toast.error('Failed to load drives');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrives = drives.filter((drive) => {
    const matchesSearch = drive.title.toLowerCase().includes(search.toLowerCase()) ||
      drive.company.name.toLowerCase().includes(search.toLowerCase()) ||
      drive.location.toLowerCase().includes(search.toLowerCase()) ||
      drive.skillsRequired.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || drive.status === statusFilter;
    const matchesType = typeFilter === 'all' || drive.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleApply = async (drive) => {
    setApplying(drive.id);
    try {
      // TODO: Replace with actual API call
      // await drivesApi.applyToDrive(drive.id, { resumeId: null, coverLetter: '' });
      
      // Update local state
      setDrives((prev) => prev.map((d) => (d.id === drive.id ? { ...d, applied: true } : d)));
      if (selectedDrive?.id === drive.id) {
        setSelectedDrive({ ...selectedDrive, applied: true });
      }
      toast.success(`Applied to ${drive.title} at ${drive.company.name}!`);
    } catch (err) {
      toast.error(err.message || 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  const openDriveDetail = (drive) => {
    setSelectedDrive(drive);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isDeadlinePassed = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  if (loading) {
    return (
      <div className="content-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
          Loading placement drives...
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="page-eyebrow">
            <Briefcase size={13} /> Placement Drives
          </div>
          <h1 className="page-title">Browse Opportunities</h1>
          <p className="page-desc">
            {filteredDrives.length} of {drives.length} drives available
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className={`btn ${showFilters ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} /> Filters
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '280px', marginBottom: 0 }}>
            <label className="form-label">Search Drives</label>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search by role, company, location, skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          {showFilters && (
            <>
              <div className="form-group" style={{ minWidth: '180px', marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value={DRIVE_STATUS.OPEN}>Open</option>
                  <option value={DRIVE_STATUS.UPCOMING}>Upcoming</option>
                  <option value={DRIVE_STATUS.ONGOING}>Ongoing</option>
                  <option value={DRIVE_STATUS.CLOSED}>Closed</option>
                </select>
              </div>

              <div className="form-group" style={{ minWidth: '180px', marginBottom: 0 }}>
                <label className="form-label">Type</label>
                <select
                  className="form-control"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value={DRIVE_TYPES.FULL_TIME}>Full-time</option>
                  <option value={DRIVE_TYPES.INTERNSHIP}>Internship</option>
                  <option value={DRIVE_TYPES.CONTRACT}>Contract</option>
                </select>
              </div>

              {(statusFilter !== 'all' || typeFilter !== 'all') && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}
                  style={{ marginBottom: '2px' }}
                >
                  <X size={14} /> Clear
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Drives Grid */}
      {filteredDrives.length === 0 ? (
        <div className="panel empty-state">
          <Briefcase className="empty-icon" size={64} />
          <h3 className="empty-title">No drives found</h3>
          <p className="empty-desc">
            {search || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'No placement drives available at the moment. Check back soon!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {filteredDrives.map((drive) => {
            const DriveStatusIcon = statusIcons[drive.status] || statusIcons[DRIVE_STATUS.OPEN];
            return (
              <div key={drive.id} className="panel" style={{ transition: 'border-color 0.15s ease', borderColor: drive.applied ? 'var(--accent-teal)' : 'var(--border-subtle)' }}>
                {/* Drive Header */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '20px',
                      flexShrink: 0,
                    }}
                  >
                    {drive.company.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{drive.title}</h3>
                      {drive.applied && (
                        <span className="badge badge-active" style={{ fontSize: '10px' }}>
                          <CheckCircle2 size={10} /> Applied
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--accent-teal)', fontWeight: 500 }}>{drive.company.name}</p>
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <span
                    className="badge"
                    style={{
                      background: statusConfig[drive.status].bg,
                      color: statusConfig[drive.status].color,
                      borderColor: statusConfig[drive.status].color,
                    }}
                  >
                    <DriveStatusIcon size={10} /> {statusConfig[drive.status].label}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: `rgba(${typeConfig[drive.type].color.replace('#', '')}, 0.12)`,
                      color: typeConfig[drive.type].color,
                      borderColor: typeConfig[drive.type].color,
                    }}
                  >
                    {typeConfig[drive.type].label}
                  </span>
                </div>

                {/* Meta Info */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> {drive.location}
                  </span>
                  {drive.ctc && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontWeight: 600 }}>
                      <DollarSign size={14} /> {drive.ctc}
                    </span>
                  )}
                  {drive.stipend && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-gold)', fontWeight: 600 }}>
                      <DollarSign size={14} /> {drive.stipend}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> Apply by {formatDate(drive.applicationDeadline)}
                  </span>
                </div>

                {/* Skills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {drive.skillsRequired.slice(0, 5).map((skill) => (
                    <span key={skill} className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', fontSize: '10px' }}>
                      {skill}
                    </span>
                  ))}
                  {drive.skillsRequired.length > 5 && (
                    <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10px' }}>
                      +{drive.skillsRequired.length - 5} more
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--divider)' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => openDriveDetail(drive)}
                  >
                    View Details
                  </button>
                  {drive.status === DRIVE_STATUS.OPEN || drive.status === DRIVE_STATUS.UPCOMING || drive.status === DRIVE_STATUS.ONGOING ? (
                    <button
                      className={drive.applied ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                      style={{ flex: 1 }}
                      onClick={() => handleApply(drive)}
                      disabled={drive.applied || applying === drive.id}
                    >
                      {applying === drive.id ? 'Applying...' : drive.applied ? 'Applied' : 'Apply Now'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      disabled
                    >
                      {drive.status === DRIVE_STATUS.CLOSED ? 'Closed' : 'Not Open'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drive Detail Modal */}
      <Modal
        isOpen={!!selectedDrive}
        onClose={() => setSelectedDrive(null)}
        title={selectedDrive?.title}
        size="lg"
      >
        {selectedDrive && (
          <>
            const ModalStatusIcon = statusIcons[selectedDrive.status] || statusIcons[DRIVE_STATUS.OPEN];
            <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '18px',
                  }}
                >
                  {selectedDrive.company.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDrive.company.name}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedDrive.location}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                <span
                  className="badge"
                  style={{
                    background: statusConfig[selectedDrive.status].bg,
                    color: statusConfig[selectedDrive.status].color,
                    borderColor: statusConfig[selectedDrive.status].color,
                  }}
                >
                  <ModalStatusIcon size={10} /> {statusConfig[selectedDrive.status].label}
                </span>
                <span
                  className="badge"
                  style={{
                    background: `rgba(${typeConfig[selectedDrive.type].color.replace('#', '')}, 0.12)`,
                    color: typeConfig[selectedDrive.type].color,
                    borderColor: typeConfig[selectedDrive.type].color,
                  }}
                >
                  {typeConfig[selectedDrive.type].label}
                </span>
                {selectedDrive.ctc && (
                  <span className="badge badge-active" style={{ fontSize: '11px' }}>
                    <DollarSign size={10} /> {selectedDrive.ctc}
                  </span>
                )}
                {selectedDrive.stipend && (
                  <span className="badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning-border)' }}>
                    <DollarSign size={10} /> {selectedDrive.stipend}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--divider)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> Deadline: {formatDate(selectedDrive.applicationDeadline)}
                    {isDeadlinePassed(selectedDrive.applicationDeadline) && (
                      <span className="badge badge-inactive" style={{ fontSize: '9px', marginLeft: '6px' }}>Expired</span>
                    )}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> Drive Date: {formatDate(selectedDrive.driveDate)}
                  </span>
                  {selectedDrive.company.website && (
                    <a href={selectedDrive.company.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                      <ExternalLink size={14} /> Company Website
                    </a>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Description
                </h5>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{selectedDrive.description}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Eligibility Criteria
                </h5>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{selectedDrive.eligibilityCriteria}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Skills Required
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedDrive.skillsRequired.map((skill) => (
                    <span key={skill} className="badge" style={{ background: 'rgba(62, 200, 172, 0.12)', color: 'var(--accent-teal)', border: '1px solid rgba(62, 200, 172, 0.3)' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Selection Rounds
                </h5>
                <ol style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px' }}>
                  {selectedDrive.rounds.map((round, idx) => (
                    <li key={idx} style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-teal)', color: '#0c0d0e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      {round}
                    </li>
                  ))}
                </ol>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--divider)' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedDrive(null)}
                >
                  Close
                </button>
                {(selectedDrive.status === DRIVE_STATUS.OPEN || selectedDrive.status === DRIVE_STATUS.UPCOMING || selectedDrive.status === DRIVE_STATUS.ONGOING) && !selectedDrive.applied && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleApply(selectedDrive)}
                    disabled={applying === selectedDrive.id}
                  >
                    {applying === selectedDrive.id ? 'Applying...' : 'Apply Now'}
                  </button>
                )}
                {selectedDrive.applied && (
                  <span className="badge badge-active" style={{ display: 'flex', alignItems: 'center', height: '40px', padding: '0 16px' }}>
                    <CheckCircle2 size={14} /> Applied
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}