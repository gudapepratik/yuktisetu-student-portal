import React, { useState, useEffect } from 'react';
import { userApi } from '../api/user';
import {
  User,
  Calendar,
  MapPin,
  GraduationCap,
  Award,
  TrendingUp,
  Code,
  Link2,
  Briefcase,
  Trophy,
  Plus,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { PacmanLoader } from '../components/PacmanLoader';

// Admin-set academic fields are shown faded when unset and full-contrast
// once the institute admin has actually set them, so an incomplete record
// (e.g. semester GPAs not filled in yet for a currently-studying student)
// reads as "not set yet" rather than looking broken.
const academicFieldStyle = (value) => {
  const hasValue = value !== null && value !== undefined && value !== '';
  return {
    opacity: hasValue ? 1 : 0.45,
    color: hasValue ? 'var(--text-primary)' : 'var(--text-dim)',
  };
};

export function Profile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  // True when the backend has no StudentProfile row for this user yet (a
  // fresh 404, not a failure) -- distinct from a real fetch error below.
  const [profileNotFound, setProfileNotFound] = useState(false);

  // Form state -- only the fields a student can actually edit. institution/
  // degree/branch/cgpa/graduationYear/tenthPercentage/twelfthPercentage/
  // semester GPAs are admin-controlled (set via bulk-student-import, sourced
  // from College/Department/UserRoleAssignment.degree) and are read directly
  // from `profile` below, never from this editable state.
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    address: '',
    coCubesScore: '',
    skills: [],
    codingProfiles: [],
    professionalProfiles: [],
    projects: [],
    workExperiences: [],
    achievements: [],
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await userApi.getStudentProfile();
        setProfile(data);
        setProfileNotFound(false);
        // Convert data to form format
        setFormData({
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
          address: data.address || '',
          coCubesScore: data.coCubesScore || '',
          skills: data.skills || [],
          codingProfiles: data.codingProfiles || [],
          professionalProfiles: data.professionalProfiles || [],
          projects: data.projects || [],
          workExperiences: data.workExperiences || [],
          achievements: data.achievements || [],
        });
      } catch (err) {
        if (err.status === 404) {
          // Not an error -- the student just hasn't saved a profile yet.
          // Leave formData at its blank default so they can fill it in.
          setProfile(null);
          setProfileNotFound(true);
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

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (arrayField, index, field, value) => {
    setFormData((prev) => {
      const newArray = [...prev[arrayField]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayField]: newArray };
    });
  };

  const addArrayItem = (arrayField, defaultItem) => {
    setFormData((prev) => ({
      ...prev,
      [arrayField]: [...prev[arrayField], defaultItem],
    }));
  };

  const removeArrayItem = (arrayField, index) => {
    setFormData((prev) => {
      const newArray = [...prev[arrayField]];
      newArray.splice(index, 1);
      return { ...prev, [arrayField]: newArray };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (formData.coCubesScore !== '' && (parseFloat(formData.coCubesScore) < 0 || parseFloat(formData.coCubesScore) > 800)) {
      newErrors.coCubesScore = 'CoCubes score must be between 0 and 800';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const preparePayload = () => {
    const payload = {};
    const fields = [
      'dateOfBirth',
      'address',
      'coCubesScore',
      'skills',
      'codingProfiles',
      'professionalProfiles',
      'projects',
      'workExperiences',
      'achievements',
    ];

    const arrayFields = [
      'skills',
      'codingProfiles',
      'professionalProfiles',
      'projects',
      'workExperiences',
      'achievements',
    ];

    fields.forEach((field) => {
      const value = formData[field];
      const isArrayField = arrayFields.includes(field);

      // For array fields, always include (even empty) to allow clearing
      if (isArrayField) {
        const filtered = (value || []).filter((item) => {
          if (typeof item === 'string') return item.trim() !== '';
          return Object.values(item).some((v) => v !== '' && v !== null && v !== undefined);
        });
        // codingProfiles.rating is a Double on the backend -- coerce from
        // the input's raw string so it's sent as a number, not text.
        payload[field] = field === 'codingProfiles'
          ? filtered.map((item) => ({
              ...item,
              rating: item.rating === '' || item.rating === null || item.rating === undefined
                ? null
                : Number(item.rating),
            }))
          : filtered;
      } else if (value !== '' && value !== null && value !== undefined) {
        // For numeric fields, convert to number
        if (['coCubesScore'].includes(field)) {
          payload[field] = value === '' ? null : Number(value);
        } else {
          payload[field] = value;
        }
      }
    });

    return payload;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setSaving(true);
    try {
      const payload = preparePayload();
      await userApi.updateStudentProfile(payload);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (profile) {
      setFormData({
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        address: profile.address || '',
        coCubesScore: profile.coCubesScore || '',
        skills: profile.skills || [],
        codingProfiles: profile.codingProfiles || [],
        professionalProfiles: profile.professionalProfiles || [],
        projects: profile.projects || [],
        workExperiences: profile.workExperiences || [],
        achievements: profile.achievements || [],
      });
      setErrors({});
      toast.info('Form reset to saved values');
    }
  };

  if (loading) {
    return (
      <div className="content-container">
        <PacmanLoader label="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="content-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-eyebrow">
          <User size={13} /> Profile Management
        </div>
        <h1 className="page-title">Student Profile</h1>
        <p className="page-desc">
          Manage your academic records, skills, projects, and professional information.
        </p>
      </div>

      {profileNotFound && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          <CheckCircle2 size={16} flexShrink={0} />
          <span>No profile found yet for your account. Fill in your details below and click "Save Changes" to create one.</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Main Form */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* Personal Information */}
            <div className="panel profile-section">
              <h3 className="profile-section-title">
                <User size={16} /> Personal Information
              </h3>
              <div className="profile-fields">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Current residential address"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="panel profile-section">
              <h3 className="profile-section-title">
                <GraduationCap size={16} /> Academic Information
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-8px', marginBottom: '12px' }}>
                These fields are set by your institute admin and can't be edited here, except CoCubes Score.
              </p>
              <div className="profile-fields">
                <div className="form-group">
                  <label className="form-label">Institution</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile?.institution || ''}
                    placeholder="Not set by your institute admin yet"
                    disabled
                    style={academicFieldStyle(profile?.institution)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Degree</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile?.degree || ''}
                    placeholder="Not set by your institute admin yet"
                    disabled
                    style={academicFieldStyle(profile?.degree)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile?.branch || ''}
                    placeholder="Not set by your institute admin yet"
                    disabled
                    style={academicFieldStyle(profile?.branch)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CGPA</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile?.cgpa ?? ''}
                    placeholder="Not set by your institute admin yet"
                    disabled
                    style={academicFieldStyle(profile?.cgpa)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Graduation Year</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile?.graduationYear ?? ''}
                    placeholder="Not set by your institute admin yet"
                    disabled
                    style={academicFieldStyle(profile?.graduationYear)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">10th Percentage</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile?.tenthPercentage ?? ''}
                    placeholder="Not set by your institute admin yet"
                    disabled
                    style={academicFieldStyle(profile?.tenthPercentage)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">12th Percentage</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile?.twelfthPercentage ?? ''}
                    placeholder="Not set by your institute admin yet"
                    disabled
                    style={academicFieldStyle(profile?.twelfthPercentage)}
                  />
                </div>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <div className="form-group" key={`sem${sem}Gpa`}>
                    <label className="form-label">Semester {sem} GPA</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile?.[`sem${sem}Gpa`] ?? ''}
                      placeholder="Not set by your institute admin yet"
                      disabled
                      style={academicFieldStyle(profile?.[`sem${sem}Gpa`])}
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">CoCubes Score</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="800"
                    className="form-control"
                    value={formData.coCubesScore}
                    onChange={(e) => handleChange('coCubesScore', e.target.value)}
                    placeholder="e.g. 650"
                  />
                  {errors.coCubesScore && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{errors.coCubesScore}</span>}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="panel profile-section">
              <div className="profile-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><Award size={16} /> Skills</span>
                <button
                  type="button"
                  className="add-item-btn"
                  onClick={() => addArrayItem('skills', '')}
                >
                  <Plus size={14} /> Add Skill
                </button>
              </div>
              <div className="array-items">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="array-item" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control"
                      style={{ flex: 1 }}
                      value={skill}
                      onChange={(e) => {
                        const newSkills = [...formData.skills];
                        newSkills[index] = e.target.value;
                        handleChange('skills', newSkills);
                      }}
                      placeholder="e.g. Java, Spring Boot, React"
                    />
                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => removeArrayItem('skills', index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {formData.skills.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No skills added yet. Click "Add Skill" to start.
                  </div>
                )}
              </div>
            </div>

            {/* Coding Profiles */}
            <div className="panel profile-section">
              <div className="profile-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><Code size={16} /> Coding Profiles</span>
                <button
                  type="button"
                  className="add-item-btn"
                  onClick={() => addArrayItem('codingProfiles', { platform: '', username: '', profileLink: '', rating: '' })}
                >
                  <Plus size={14} /> Add Profile
                </button>
              </div>
              <div className="array-items">
                {formData.codingProfiles.map((profile, index) => (
                  <div key={index} className="array-item">
                    <div className="array-item-row">
                      <div className="form-group">
                        <label className="form-label">Platform</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profile.platform}
                          onChange={(e) => handleArrayChange('codingProfiles', index, 'platform', e.target.value)}
                          placeholder="e.g. LeetCode, Codeforces, HackerRank"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profile.username}
                          onChange={(e) => handleArrayChange('codingProfiles', index, 'username', e.target.value)}
                          placeholder="e.g. johndoe"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Rating</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={profile.rating}
                          onChange={(e) => handleArrayChange('codingProfiles', index, 'rating', e.target.value)}
                          placeholder="e.g. 1850"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Profile Link</label>
                      <input
                        type="url"
                        className="form-control"
                        value={profile.profileLink}
                        onChange={(e) => handleArrayChange('codingProfiles', index, 'profileLink', e.target.value)}
                        placeholder="https://leetcode.com/u/johndoe"
                      />
                    </div>
                    <div className="array-item-actions">
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeArrayItem('codingProfiles', index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {formData.codingProfiles.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No coding profiles added yet.
                  </div>
                )}
              </div>
            </div>

            {/* Professional Profiles */}
            <div className="panel profile-section">
              <div className="profile-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><Link2 size={16} /> Professional Profiles</span>
                <button
                  type="button"
                  className="add-item-btn"
                  onClick={() => addArrayItem('professionalProfiles', { platform: '', profileLink: '' })}
                >
                  <Plus size={14} /> Add Profile
                </button>
              </div>
              <div className="array-items">
                {formData.professionalProfiles.map((profile, index) => (
                  <div key={index} className="array-item">
                    <div className="array-item-row">
                      <div className="form-group">
                        <label className="form-label">Platform</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profile.platform}
                          onChange={(e) => handleArrayChange('professionalProfiles', index, 'platform', e.target.value)}
                          placeholder="e.g. LinkedIn, GitHub, Portfolio"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Profile Link</label>
                      <input
                        type="url"
                        className="form-control"
                        value={profile.profileLink}
                        onChange={(e) => handleArrayChange('professionalProfiles', index, 'profileLink', e.target.value)}
                        placeholder="https://linkedin.com/in/johndoe"
                      />
                    </div>
                    <div className="array-item-actions">
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeArrayItem('professionalProfiles', index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {formData.professionalProfiles.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No professional profiles added yet.
                  </div>
                )}
              </div>
            </div>

            {/* Projects */}
            <div className="panel profile-section">
              <div className="profile-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><Briefcase size={16} /> Projects</span>
                <button
                  type="button"
                  className="add-item-btn"
                  onClick={() => addArrayItem('projects', { title: '', projectLink: '', description: '', technologies: '' })}
                >
                  <Plus size={14} /> Add Project
                </button>
              </div>
              <div className="array-items">
                {formData.projects.map((project, index) => (
                  <div key={index} className="array-item">
                    <div className="array-item-row">
                      <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={project.title}
                          onChange={(e) => handleArrayChange('projects', index, 'title', e.target.value)}
                          placeholder="Project title"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Project Link</label>
                      <input
                        type="url"
                        className="form-control"
                        value={project.projectLink}
                        onChange={(e) => handleArrayChange('projects', index, 'projectLink', e.target.value)}
                        placeholder="https://github.com/user/project"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={project.description}
                        onChange={(e) => handleArrayChange('projects', index, 'description', e.target.value)}
                        placeholder="Brief description of the project"
                        rows={2}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Technologies (comma separated)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={project.technologies}
                        onChange={(e) => handleArrayChange('projects', index, 'technologies', e.target.value)}
                        placeholder="React, Node.js, MongoDB, Docker"
                      />
                    </div>
                    <div className="array-item-actions">
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeArrayItem('projects', index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {formData.projects.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No projects added yet.
                  </div>
                )}
              </div>
            </div>

            {/* Work Experiences */}
            <div className="panel profile-section">
              <div className="profile-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><Briefcase size={16} /> Work Experience</span>
                <button
                  type="button"
                  className="add-item-btn"
                  onClick={() => addArrayItem('workExperiences', { company: '', role: '', duration: '', description: '' })}
                >
                  <Plus size={14} /> Add Experience
                </button>
              </div>
              <div className="array-items">
                {formData.workExperiences.map((exp, index) => (
                  <div key={index} className="array-item">
                    <div className="array-item-row">
                      <div className="form-group">
                        <label className="form-label">Company *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={exp.company}
                          onChange={(e) => handleArrayChange('workExperiences', index, 'company', e.target.value)}
                          placeholder="Company name"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Role *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={exp.role}
                          onChange={(e) => handleArrayChange('workExperiences', index, 'role', e.target.value)}
                          placeholder="Your role/title"
                        />
                      </div>
                    </div>
                    <div className="array-item-row">
                      <div className="form-group">
                        <label className="form-label">Duration</label>
                        <input
                          type="text"
                          className="form-control"
                          value={exp.duration}
                          onChange={(e) => handleArrayChange('workExperiences', index, 'duration', e.target.value)}
                          placeholder="e.g. Jun 2025 - Aug 2025"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={exp.description}
                        onChange={(e) => handleArrayChange('workExperiences', index, 'description', e.target.value)}
                        placeholder="Key responsibilities and achievements"
                        rows={2}
                      />
                    </div>
                    <div className="array-item-actions">
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeArrayItem('workExperiences', index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {formData.workExperiences.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No work experience added yet.
                  </div>
                )}
              </div>
            </div>

            {/* Achievements */}
            <div className="panel profile-section">
              <div className="profile-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><Trophy size={16} /> Achievements</span>
                <button
                  type="button"
                  className="add-item-btn"
                  onClick={() => addArrayItem('achievements', { title: '', description: '' })}
                >
                  <Plus size={14} /> Add Achievement
                </button>
              </div>
              <div className="array-items">
                {formData.achievements.map((achievement, index) => (
                  <div key={index} className="array-item">
                    <div className="array-item-row">
                      <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={achievement.title}
                          onChange={(e) => handleArrayChange('achievements', index, 'title', e.target.value)}
                          placeholder="Achievement title"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={achievement.description}
                        onChange={(e) => handleArrayChange('achievements', index, 'description', e.target.value)}
                        placeholder="Details about the achievement"
                        rows={2}
                      />
                    </div>
                    <div className="array-item-actions">
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeArrayItem('achievements', index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {formData.achievements.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No achievements added yet.
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="panel" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--divider)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
              >
                <RotateCcw size={14} /> Reset
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar - Profile Preview */}
        <div style={{ width: '320px', flexShrink: 0 }}>
          <div className="panel" style={{ position: 'sticky', top: '100px' }}>
            <div className="panel-header">
              <h3 className="panel-title">Profile Preview</h3>
              <span className="badge badge-active">Live Preview</span>
            </div>
            <div className="profile-card">
              <div className="profile-avatar" style={{ width: '56px', height: '56px', fontSize: '20px' }}>
                {profile?.institution ? '🎓' : '👤'}
              </div>
              <div className="profile-info">
                <div className="profile-name" style={{ fontSize: '15px' }}>
                  {profile?.institution || 'Profile Incomplete'}
                </div>
                <div className="profile-meta" style={{ fontSize: '11px' }}>
                  {profile?.branch && <span><Award size={12} /> {profile.branch}</span>}
                  {profile?.cgpa && <span><TrendingUp size={12} /> CGPA: {profile.cgpa}</span>}
                  {profile?.graduationYear && <span><GraduationCap size={12} /> {profile.graduationYear}</span>}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--divider)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Completion Status
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'institution', label: 'Institution', icon: GraduationCap, source: 'profile' },
                  { key: 'degree', label: 'Degree', icon: Award, source: 'profile' },
                  { key: 'branch', label: 'Branch', icon: Code, source: 'profile' },
                  { key: 'cgpa', label: 'CGPA', icon: TrendingUp, source: 'profile' },
                  { key: 'skills', label: 'Skills', icon: Award, source: 'formData' },
                  { key: 'projects', label: 'Projects', icon: Briefcase, source: 'formData' },
                  { key: 'codingProfiles', label: 'Coding Profiles', icon: Code, source: 'formData' },
                  { key: 'achievements', label: 'Achievements', icon: Trophy, source: 'formData' },
                ].map((item) => {
                  // institution/degree/branch/cgpa are admin-set and read
                  // from `profile`, not the editable `formData`.
                  const value = item.source === 'profile' ? profile?.[item.key] : formData[item.key];
                  const complete = Array.isArray(value) ? value.length > 0 : !!value;
                  return (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <item.icon size={14} color={complete ? 'var(--success)' : 'var(--text-muted)'} />
                      <span style={{ color: complete ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {item.label}
                      </span>
                      <span style={{ marginLeft: 'auto', color: complete ? 'var(--success)' : 'var(--text-dim)' }}>
                        {complete ? '✓' : '✗'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}