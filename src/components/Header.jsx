import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function Header() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getInitials = (email) => {
    return email
      .split('@')[0]
      .split('.')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-teal)', fontWeight: 700, fontSize: '16px' }}>
          YS
        </div>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          YuktiSetu Student Portal
        </span>
      </div>

      <div className="header-right">
        <button
          className="btn btn-ghost btn-sm"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Read-only -- account controls (sign out, settings) live in the
            sidebar footer now, this is just an identity display. */}
        <div className="user-menu-trigger" style={{ cursor: 'default' }} title={user?.email}>
          <div className="user-avatar-sm">{getInitials(user?.email || 'ST')}</div>
          <span className="user-name">{user?.email || 'Student'}</span>
        </div>
      </div>
    </header>
  );
}
