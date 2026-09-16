import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/user';
import {
  User,
  Award,
  Briefcase,
  Code,
  FileText,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Settings,
  Plus,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { PacmanLoader } from '../components/PacmanLoader';

export function Dashboard({ setActiveView }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await userApi.getStudentProfile();
        setProfile(data);
      } catch (err) {
        if (err.status === 404) {
          // Not an error -- this student just hasn't saved a profile yet.
          // Not every student keeps a complete profile at every point in
          // the program, so a missing/partial profile is expected, not a
          // failure worth interrupting them with a toast over.
          setProfile(null);
        } else {
          console.error('Failed to load profile:', err);
          toast.error('Failed to load profile data');
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const stats = [
    { label: 'Profile Completion', value: profile ? calculateCompletion(profile) : '0%', icon: User, color: 'var(--accent-teal)' },
    { label: 'Placement Drives', value: '0', icon: Briefcase, color: 'var(--accent-blue)' },
    { label: 'Coding Profiles', value: profile?.codingProfiles?.length || 0, icon: Code, color: 'var(--accent-gold)' },
    { label: 'Projects', value: profile?.projects?.length || 0, icon: FileText, color: 'var(--accent-purple)' },
  ];

  // Completion is based only on what the student can actually fill in
  // themselves. institution/degree/branch/cgpa/graduationYear/tenthPercentage/
  // twelfthPercentage/semester GPAs are admin-set academic records -- a
  // currently-studying student legitimately won't have all of those yet
  // (e.g. semester GPAs fill in over time), so they don't count against
  // completion here.
  function calculateCompletion(p) {
    const fields = [
      p.dateOfBirth,
      p.address,
      p.coCubesScore,
      p.skills?.length,
      p.codingProfiles?.length,
      p.professionalProfiles?.length,
      p.projects?.length,
      p.workExperiences?.length,
      p.achievements?.length,
    ];
    const filled = fields.filter(Boolean).length;
    return `${Math.round((filled / fields.length) * 100)}%`;
  }

  if (loading) {
    return (
      <div className="content-container">
        <PacmanLoader label="Loading dashboard..." />
      </div>
    );
  }

  const firstName = profile?.institution ? 'Student' : 'Student';
  const displayName = user?.email?.split('@')[0] || 'Student';

  return (
    <div className="content-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-eyebrow">
          <TrendingUp size={13} /> Student Command Center
        </div>
        <h1 className="page-title">Welcome back, {displayName}</h1>
        <p className="page-desc">
          Manage your placement profile, track drives, and showcase your achievements.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-label">{stat.label}</span>
              <stat.icon size={18} color={stat.color} />
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-desc">Keep building your profile</div>
          </div>
        ))}
      </div>

      {/* Quick Action Cards */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>
          Quick Actions
        </h3>

        <div className="action-cards">
          {/* Card 1: Complete Profile */}
          <div
            className="action-card"
            onClick={() => setActiveView('profile')}
          >
            <div
              className="action-icon"
              style={{ background: 'rgba(62, 200, 172, 0.14)', color: 'var(--accent-teal)' }}
            >
              <User size={20} />
            </div>
            <h4 className="action-title">Complete Your Profile</h4>
            <p className="action-desc">
              Add your academic details, skills, projects, and experience to strengthen your placement profile.
            </p>
            <div className="action-link">
              <span>Open Profile Editor</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card 2: Resume Builder */}
          <div className="action-card">
            <div
              className="action-icon"
              style={{ background: 'rgba(77, 141, 247, 0.14)', color: 'var(--accent-blue)' }}
            >
              <FileText size={20} />
            </div>
            <h4 className="action-title">Resume Builder</h4>
            <p className="action-desc">
              Generate professional resumes tailored for placement drives using your profile data.
            </p>
            <div className="action-link">
              <span>Build Resume</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card 3: Placement Drives */}
          <div className="action-card">
            <div
              className="action-icon"
              style={{ background: 'rgba(212, 155, 75, 0.14)', color: 'var(--accent-gold)' }}
            >
              <Briefcase size={20} />
            </div>
            <h4 className="action-title">Placement Drives</h4>
            <p className="action-desc">
              Browse and apply for active placement drives from companies visiting your campus.
            </p>
            <div className="action-link">
              <span>View Drives</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card 4: Coding Profiles */}
          <div className="action-card">
            <div
              className="action-icon"
              style={{ background: 'rgba(155, 114, 207, 0.14)', color: 'var(--accent-purple)' }}
            >
              <Code size={20} />
            </div>
            <h4 className="action-title">Coding Profiles</h4>
            <p className="action-desc">
              Link your LeetCode, Codeforces, GitHub profiles to showcase your problem-solving skills.
            </p>
            <div className="action-link">
              <span>Manage Profiles</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Summary Card */}
      {profile && (
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Profile Summary</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveView('profile')}
            >
              <Settings size={14} /> Edit Profile
            </button>
          </div>

          <div className="profile-card">
            <div className="profile-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <div className="profile-name">
                {displayName}
                <span className="badge badge-role" style={{ marginLeft: '8px', fontSize: '10px' }}>
                  Student
                </span>
              </div>
              <div className="profile-meta">
                {profile.institution && (
                  <span>
                    <GraduationCap size={14} /> {profile.institution}
                  </span>
                )}
                {profile.branch && (
                  <span>
                    <Award size={14} /> {profile.branch}
                  </span>
                )}
                {profile.cgpa && (
                  <span>
                    <TrendingUp size={14} /> CGPA: {profile.cgpa}
                  </span>
                )}
                {profile.graduationYear && (
                  <span>
                    <Award size={14} /> Class of {profile.graduationYear}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Skills Preview */}
          {profile.skills && profile.skills.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Top Skills</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.skills.slice(0, 8).map((skill) => (
                  <span
                    key={skill}
                    className="badge"
                    style={{
                      background: 'rgba(62, 200, 172, 0.12)',
                      color: 'var(--accent-teal)',
                      border: '1px solid rgba(62, 200, 172, 0.3)',
                    }}
                  >
                    {skill}
                  </span>
                ))}
                {profile.skills.length > 8 && (
                  <span className="badge badge-pending">+{profile.skills.length - 8} more</span>
                )}
              </div>
            </div>
          )}

          {/* Recent Projects Preview */}
          {profile.projects && profile.projects.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Recent Projects</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {profile.projects.slice(0, 3).map((proj, idx) => (
                  <div key={idx} style={{ padding: '12px', background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{proj.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{proj.description}</div>
                    {proj.technologies && (
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {proj.technologies.split(',').slice(0, 4).map((tech, ti) => (
                          <span key={ti} className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}