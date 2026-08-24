import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Key, Mail, AlertCircle, Shield, ArrowRight } from 'lucide-react';
import { useToast } from '../components/Toast';

export function Login({ setActiveView }) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      toast.success('Welcome back!');
      // AuthProvider sets user and App.jsx transitions to 'dashboard'
    } catch (err) {
      setError(err.message || 'Invalid credentials or inactive student account.');
      toast.error(err.message || 'Login failed');
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
      <div className="panel auth-panel" style={{ maxWidth: '420px' }}>
        {/* Brand Heading */}
        <div className="auth-header">
          <div
            className="auth-brand-icon"
            style={{ background: 'linear-gradient(135deg, #3ec8ac, #4d8df7)' }}
          >
            YS
          </div>
          <h2 className="auth-title">Student Portal Sign In</h2>
          <p className="auth-subtitle">
            Access your placement profile, drives, and career resources.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label className="form-label">Student Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-control"
                placeholder="student@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
              <Mail
                size={15}
                style={{ position: 'absolute', left: '11px', top: '11px', color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Security Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="form-control"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
              <Key
                size={15}
                style={{ position: 'absolute', left: '11px', top: '11px', color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            <LogIn size={15} /> {loading ? 'Verifying Credentials...' : 'Sign in to Student Portal'}
          </button>
        </form>

        {/* Activation Link */}
        <div className="auth-divider">
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Received an account invitation code?{' '}
          </span>
          <span
            className="auth-link"
            onClick={() => setActiveView('accept-invite')}
          >
            Activate Account
          </span>
        </div>
      </div>
    </div>
  );
}