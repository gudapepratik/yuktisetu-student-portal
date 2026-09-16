import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/user';
import { authApi } from '../api/auth';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { PacmanLoader } from '../components/PacmanLoader';

export function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const data = await userApi.getUserProfile(user.userId);
        setUserProfile(data);
      } catch (err) {
        if (err.status === 404) {
          // No basic profile record yet -- not an error, just show the
          // "Not provided" placeholders already built into this page.
          setUserProfile(null);
        } else {
          console.error('Failed to load user profile:', err);
          toast.error('Failed to load account details');
        }
      } finally {
        setLoading(false);
      }
    }

    if (user?.userId) {
      loadUserProfile();
    }
  }, [user?.userId, toast]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters';
    }
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      toast.success('Password changed successfully! Please login again.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      // Log the user out after password change -- this SPA has no router
      // (App.jsx switches views via in-memory state, there's no real
      // "/login" URL to redirect to), so clear the session through the
      // normal auth flow instead of a hard navigation.
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="content-container">
        <PacmanLoader label="Loading account details..." />
      </div>
    );
  }

  return (
    <div className="content-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-eyebrow">
          <User size={13} /> Account Settings
        </div>
        <h1 className="page-title">Account Settings</h1>
        <p className="page-desc">
          Manage your account information and security settings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Account Information */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <User size={18} /> Account Information
            </h3>
            <span className="badge badge-info">Read Only</span>
          </div>
          <div className="profile-card">
            <div className="profile-avatar" style={{ width: '72px', height: '72px', fontSize: '28px' }}>
              {userProfile?.firstName ? userProfile.firstName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-info">
              <div className="profile-name" style={{ fontSize: '18px', fontWeight: 600 }}>
                {userProfile?.firstName || ''} {userProfile?.lastName || ''}
              </div>
              <div className="profile-meta" style={{ fontSize: '13px', marginTop: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Student Account</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--divider)' }}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">
                  <User size={14} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Full Name
                </label>
                <div className="form-control-static" style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--divider)', fontSize: '14px' }}>
                  {(userProfile?.firstName || userProfile?.lastName)
                    ? `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim()
                    : 'Not provided'}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Email Address
                </label>
                <div className="form-control-static" style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--divider)', fontSize: '14px' }}>
                  {user?.email || 'Not provided'}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone size={14} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Phone Number
                </label>
                <div className="form-control-static" style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--divider)', fontSize: '14px' }}>
                  {userProfile?.phone || 'Not provided'}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Date of Birth
                </label>
                <div className="form-control-static" style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--divider)', fontSize: '14px' }}>
                  {formatDate(userProfile?.dateOfBirth)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Address
                </label>
                <div className="form-control-static" style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--divider)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {userProfile?.address || 'Not provided'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Lock size={18} /> Change Password
            </h3>
            <span className="badge badge-warning">Requires Current Password</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="form-control"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Enter current password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--danger)', fontSize: '12px' }}>
                  <AlertCircle size={14} /> {passwordErrors.currentPassword}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-control"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--danger)', fontSize: '12px' }}>
                  <AlertCircle size={14} /> {passwordErrors.newPassword}
                </div>
              )}
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                Must be at least 8 characters long
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--danger)', fontSize: '12px' }}>
                  <AlertCircle size={14} /> {passwordErrors.confirmPassword}
                </div>
              )}
            </div>

            <div style={{ marginTop: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={handleChangePassword}
                disabled={saving}
                style={{ width: '100%' }}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Changing...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Change Password
                  </>
                )}
              </button>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--divider)', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, color: 'var(--warning)' }} />
                <div>
                  <strong>Security Note:</strong> Changing your password will log you out of all sessions.
                  You will need to log in again with your new password.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}