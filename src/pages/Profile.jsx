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

export function Profile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    address: '',
    institution: '',
    degree: '',
    branch: '',
    cgpa: '',
    graduationYear: '',
    tenthPercentage: '',
    twelfthPercentage: '',
    coCubesScore: '',
    compositeScore: '',
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
        // Convert data to form format
        setFormData({
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
          address: data.address || '',
          institution: data.institution || '',
          degree: data.degree || '',
          branch: data.branch || '',
          cgpa: data.cgpa || '',
          graduationYear: data.graduationYear || '',
          tenthPercentage: data.tenthPercentage || '',
          twelfthPercentage: data.twelfthPercentage || '',
          coCubesScore: data.coCubesScore || '',
          compositeScore: data.compositeScore || '',
          skills: data.skills || [],
          codingProfiles: data.codingProfiles || [],
          professionalProfiles: data.professionalProfiles || [],
          projects: data.projects || [],
          workExperiences: data.workExperiences || [],
          achievements: data.achievements || [],
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        toast.error('Failed to load profile data');
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
    if (!formData.institution) newErrors.institution = 'Institution is required';
    if (!formData.degree) newErrors.degree = 'Degree is required';
    if (!formData.branch) newErrors.branch = 'Branch is required';
    if (!formData.graduationYear) newErrors.graduationYear = 'Graduation year is required';
    if (formData.cgpa && (parseFloat(formData.cgpa) < 0 || parseFloat(formData.cgpa) > 10)) {
      newErrors.cgpa = 'CGPA must be between 0 and 10';
    }
    if (formData.tenthPercentage && (parseFloat(formData.tenthPercentage) < 0 || parseFloat(formData.tenthPercentage) > 100)) {
      newErrors.tenthPercentage = 'Percentage must be between 0 and 100';
    }
    if (formData.twelfthPercentage && (parseFloat(formData.twelfthPercentage) < 0 || parseFloat(formData.twelfthPercentage) > 100)) {
      newErrors.twelfthPercentage = 'Percentage must be between 0 and 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const preparePayload = () => {
    const payload = {};
    const fields = [
      'dateOfBirth',
      'address',
      'institution',
      'degree',
      'branch',
      'cgpa',
      'graduationYear',
      'tenthPercentage',
      'twelfthPercentage',
      'coCubesScore',
      'compositeScore',
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
        payload[field] = filtered;
      } else if (value !== '' && value !== null && value !== undefined) {
        // For numeric fields, convert to number
        if (['cgpa', 'graduationYear', 'tenthPercentage', 'twelfthPercentage', 'coCubesScore', 'compositeScore'].includes(field)) {
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
        institution: profile.institution || '',
        degree: profile.degree || '',
        branch: profile.branch || '',
        cgpa: profile.cgpa || '',
        graduationYear: profile.graduationYear || '',
        tenthPercentage: profile.tenthPercentage || '',
        twelfthPercentage: profile.twelfthPercentage || '',
        coCubesScore: profile.coCubesScore || '',
        compositeScore: profile.compositeScore || '',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
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
              <div className="profile-fields">
                <div className="form-group">
                  <label className="form-label">Institution *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.institution}
                    onChange={(e) => handleChange('institution', e.target.value)}
                    placeholder="e.g. Pimpri Chinchwad College of Engineering"
                  />
                  {errors.institution && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{errors.institution}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Degree *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.degree}
                    onChange={(e) => handleChange('degree', e.target.value)}
                    placeholder="e.g. Bachelor of Technology"
                  />
                  {errors.degree && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{errors.degree}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Branch *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.branch}
                    onChange={(e) => handleChange('branch', e.target.value)}
                    placeholder="e.g. Computer Engineering"
                  />
                  {errors.branch && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{errors.branch}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    className="form-control"
                    value={formData.cgpa}
                    onChange={(e) => handleChange('cgpa', e.target.value)}
                    placeholder="e.g. 8.75"
                  />
                  {errors.cgpa && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{errors.cgpa}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Graduation Year *</label>
                  <input
                    type="number"
                    min="2000"
                    max={new Date().getFullYear() + 5}
                    className="form-control"
                    value={formData.graduationYear}
                    onChange={(e) => handleChange('graduationYear', e.target.value)}
                    placeholder="e.g. 2026"
                  />
                  {errors.graduationYear && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{errors.graduationYear}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">10th Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-control"
                    value={formData.tenthPercentage}
                    onChange={(e) => handleChange('tenthPercentage', e.target.value)}
                    placeholder="e.g. 92.5"
                  />
                  {errors.tenthPercentage && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{errors.tenthPercentage}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">12th Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-control"
                    value={formData.twelfthPercentage}
                    onChange={(e) => handleChange('twelfthPercentage', e.target.value)}
                    placeholder="e.g. 89.0"
                  />
                  {errors.twelfthPercentage && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{errors.twelfthPercentage}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">CoCubes Score</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-control"
                    value={formData.coCubesScore}
                    onChange={(e) => handleChange('coCubesScore', e.target.value)}
                    placeholder="e.g. 78.5"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Composite Score</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-control"
                    value={formData.compositeScore}
                    onChange={(e) => handleChange('compositeScore', e.target.value)}
                    placeholder="e.g. 84.2"
                  />
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
                {formData.institution ? '🎓' : '👤'}
              </div>
              <div className="profile-info">
                <div className="profile-name" style={{ fontSize: '15px' }}>
                  {formData.institution || 'Profile Incomplete'}
                </div>
                <div className="profile-meta" style={{ fontSize: '11px' }}>
                  {formData.branch && <span><Award size={12} /> {formData.branch}</span>}
                  {formData.cgpa && <span><TrendingUp size={12} /> CGPA: {formData.cgpa}</span>}
                  {formData.graduationYear && <span><GraduationCap size={12} /> {formData.graduationYear}</span>}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--divider)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Completion Status
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'institution', label: 'Institution', icon: GraduationCap },
                  { key: 'degree', label: 'Degree', icon: Award },
                  { key: 'branch', label: 'Branch', icon: Code },
                  { key: 'cgpa', label: 'CGPA', icon: TrendingUp },
                  { key: 'skills', label: 'Skills', icon: Award },
                  { key: 'projects', label: 'Projects', icon: Briefcase },
                  { key: 'codingProfiles', label: 'Coding Profiles', icon: Code },
                  { key: 'achievements', label: 'Achievements', icon: Trophy },
                ].map((item) => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <item.icon size={14} color={formData[item.key] ? 'var(--success)' : 'var(--text-muted)'} />
                    <span style={{ color: formData[item.key] ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {item.label}
                    </span>
                    <span style={{ marginLeft: 'auto', color: formData[item.key] ? 'var(--success)' : 'var(--text-dim)' }}>
                      {formData[item.key] ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}