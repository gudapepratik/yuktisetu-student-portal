import React, { useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useToast } from '../components/Toast';

export function AcceptInvite({ setActiveView }) {
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      await authApi.acceptInvite({
        token: token.trim(),
        newPassword: password,
      });
      setSuccess(true);
      toast.success('Account activated successfully! You can now sign in.');
    } catch (err) {
      setError(
        err.message ||
          'Failed to activate account. The invitation token may be invalid, expired, or already used.'
      );
      toast.error(err.message || 'Failed to activate account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(62,200,172,0.08), transparent 70%), var(--bg-app)',
      }}
    >
      <div className="panel auth-panel">
        {/* Header */}
        <div className="auth-header">
          <div
            className="auth-brand-icon"
            style={{ background: 'linear-gradient(135deg, #3ec8ac, #4d8df7)' }}
          >
            <KeyRound size={22} color="#fff" />
          </div>
          <h2 className="auth-title">Activate YuktiSetu Account</h2>
          <p className="auth-subtitle">
            Set your permanent security credentials to complete onboarding.
          </p>
        </div>

        {success ? (
          <div className="success-state">
            <div className="success-icon">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="success-title">Account Activated!</h3>
            <p className="success-desc">
              Your security password has been configured and your status is now
              <span className="badge badge-active">ACTIVE</span>. You may now log in to the portal.
            </p>

            <button
              className="btn btn-primary auth-submit"
              onClick={() => setActiveView('login')}
            >
              Proceed to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={16} flexShrink={0} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Invitation Token *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. 4f9b87e2-8921-42e7-a9a3-97b11c09e39b"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Security Password *</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Security Password *</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              <ShieldCheck size={16} />
              {loading ? 'Activating Credentials...' : 'Set Password & Activate'}
            </button>

            <div className="auth-divider">
              <button
                type="button"
                className="auth-link"
                onClick={() => setActiveView('login')}
              >
                <ArrowLeft size={13} /> Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}