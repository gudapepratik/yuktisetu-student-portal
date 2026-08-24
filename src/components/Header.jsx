import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Settings, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
  };

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

        <div className="user-menu" ref={menuRef}>
          <button
            className="user-menu-trigger"
            onClick={() => setShowMenu(!showMenu)}
          >
            <div className="user-avatar-sm">{getInitials(user?.email || 'ST')}</div>
            <span className="user-name">{user?.email || 'Student'}</span>
            <ChevronDown size={16} color="var(--text-muted)" />
          </button>

          {showMenu && (
            <div className="user-menu-dropdown">
              <button className="dropdown-item" onClick={() => { setShowMenu(false); }}>
                <User size={16} /> Profile
              </button>
              <button className="dropdown-item" onClick={() => { setShowMenu(false); }}>
                <Settings size={16} /> Settings
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}